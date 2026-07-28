import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import type { AssessmentGradingReport } from '@/lib/assessment/grading/types';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
} from '@/lib/assessment/hvp/config';
import {
  HVP_MINIMUM_HIGHER_ORDER_QUESTIONS,
  HVP_PRACTICE_DIFFICULTY_TARGETS,
  HVP_PRACTICE_FORMAT_TARGETS,
  HVP_PRACTICE_SECTION_TARGETS,
} from '@/lib/assessment/hvp/assembler';
import {
  HVP_WRITTEN_BLUEPRINT_ID,
  hvpCuratedPracticeBlueprint,
  hvpWrittenPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { validatePracticeSelection } from '@/lib/assessment/practice/blueprint';
import { hasValidStrategyEvidence } from '@/lib/assessment/practice/evidence';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import { resolveAssessmentAttempt } from '@/lib/assessment/session/resolveAttempt';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type {
  ResolvedAssessmentSession,
  SessionIssue,
  SessionResult,
} from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

const HIGHER_ORDER_LEVELS = new Set(['apply', 'analyze', 'evaluate', 'create']);

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

function expectedCounts(
  actual: Record<string, number>,
  expected: Readonly<Record<string, number>>,
  label: string,
): SessionIssue[] {
  return Object.entries(expected).flatMap(([id, count]) => (
    (actual[id] ?? 0) === count
      ? []
      : [sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `${label} "${id}" requires ${count} questions.`,
        { path: 'orderedQuestionIds' },
      )]
  ));
}

function automaticIdentityIssues(
  snapshot: Pick<
    AssessmentAttemptSnapshot,
    | 'blueprintId'
    | 'courseId'
    | 'moduleId'
    | 'orderedQuestionIds'
    | 'questionVersions'
    | 'gradingPolicy'
    | 'practiceSelection'
  >,
  registry: QuestionRegistry,
): SessionIssue[] {
  const issues: SessionIssue[] = [];
  if (snapshot.blueprintId !== HVP_CURATED_BLUEPRINT_ID) {
    issues.push(sessionIssue('PILOT_BLUEPRINT_MISMATCH', 'This is not an OPT 374 scored-practice snapshot.', { path: 'blueprintId' }));
  }
  if (snapshot.courseId !== HVP_CURATED_COURSE_ID) {
    issues.push(sessionIssue('PILOT_COURSE_MISMATCH', 'The assessment does not belong to OPT 374 Human Visual Perception.', { path: 'courseId' }));
  }
  if (snapshot.moduleId !== HVP_CURATED_MODULE_ID) {
    issues.push(sessionIssue('PILOT_MODULE_MISMATCH', 'The assessment does not belong to the Human Visual Perception module.', { path: 'moduleId' }));
  }
  if (
    snapshot.gradingPolicy?.id !== HVP_CURATED_POLICY.id
    || snapshot.gradingPolicy.version !== HVP_CURATED_POLICY.version
  ) {
    issues.push(sessionIssue('PILOT_POLICY_MISMATCH', 'HVP practice requires diagnostic@1 grading.', { path: 'gradingPolicy' }));
  }

  const selection = snapshot.practiceSelection;
  const legacyFull = selection === undefined;
  if (selection) {
    const validated = validatePracticeSelection(selection, hvpCuratedPracticeBlueprint);
    if (!validated.ok) {
      issues.push(...validated.issues.map((issue) => sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `[${issue.code}] ${issue.message}`,
        { path: issue.path ?? 'practiceSelection' },
      )));
    }
    if (!hasValidStrategyEvidence(selection)) {
      issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'Persisted strategy evidence is missing or has been altered.', { path: 'practiceSelection.strategyEvidenceHash' }));
    } else if (snapshot.orderedQuestionIds.some((id) => !selection.strategyEligibleQuestionIds?.includes(id))) {
      issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'A persisted question is outside the strategy-eligible pool.', { path: 'practiceSelection.strategyEligibleQuestionIds' }));
    }
  }
  const requestedCount = selection?.requestedCount ?? 50;
  if (
    snapshot.orderedQuestionIds.length !== requestedCount
    || new Set(snapshot.orderedQuestionIds).size !== requestedCount
  ) {
    issues.push(sessionIssue(
      'PILOT_QUESTION_SET_MISMATCH',
      `This practice snapshot requires exactly ${requestedCount} unique questions.`,
      { path: 'orderedQuestionIds' },
    ));
    return issues;
  }

  const sections: Record<string, number> = {};
  const formats: Record<string, number> = {};
  const difficulties: Record<string, number> = {};
  const families: Record<string, number> = {};
  let higherOrderCount = 0;
  snapshot.orderedQuestionIds.forEach((questionId) => {
    const entry = registry.getEntry(questionId);
    if (!entry) return;
    increment(sections, entry.sectionId);
    increment(formats, entry.format);
    increment(difficulties, entry.question.difficulty);
    increment(families, entry.familyId);
    if (HIGHER_ORDER_LEVELS.has(entry.question.bloomLevel)) higherOrderCount += 1;
    if (entry.format === 'open_response') {
      issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'Open responses are excluded from scored HVP practice.', { questionId, path: 'orderedQuestionIds' }));
    }
    if (snapshot.questionVersions[questionId] !== entry.version) {
      issues.push(sessionIssue('QUESTION_VERSION_MISMATCH', `Question "${questionId}" is not stored at its exact current version.`, { questionId, path: `questionVersions.${questionId}` }));
    }
    if (selection) {
      if (
        !selection.sectionIds.includes(entry.sectionId)
        || !selection.formats.includes(entry.format)
        || !selection.difficulties.includes(entry.question.difficulty)
      ) {
        issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', `Question "${questionId}" falls outside the persisted selection filters.`, { questionId, path: 'practiceSelection' }));
      }
    }
  });

  const profile = selection
    ? hvpCuratedPracticeBlueprint.profiles.find((candidate) => candidate.id === selection.profileId)
    : undefined;
  if (legacyFull) {
    issues.push(
      ...expectedCounts(sections, HVP_PRACTICE_SECTION_TARGETS, 'Section'),
      ...expectedCounts(formats, HVP_PRACTICE_FORMAT_TARGETS, 'Format'),
      ...expectedCounts(difficulties, HVP_PRACTICE_DIFFICULTY_TARGETS, 'Difficulty'),
    );
    if (higherOrderCount < HVP_MINIMUM_HIGHER_ORDER_QUESTIONS) {
      issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'Legacy Full practice requires at least 20 Apply-or-higher questions.', { path: 'orderedQuestionIds' }));
    }
  } else if (profile) {
    if (profile.sectionTargets) issues.push(...expectedCounts(sections, profile.sectionTargets, 'Section'));
    if (profile.formatTargets) issues.push(...expectedCounts(formats, profile.formatTargets, 'Format'));
    if (profile.difficultyTargets) issues.push(...expectedCounts(difficulties, profile.difficultyTargets, 'Difficulty'));
    if (higherOrderCount < profile.higherOrderMinimum) {
      issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', `Profile "${profile.id}" requires at least ${profile.higherOrderMinimum} Apply-or-higher questions.`, { path: 'orderedQuestionIds' }));
    }
  }
  if (Object.values(families).some((count) => count > 2)) {
    issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'A practice set may contain at most two questions from one family.', { path: 'orderedQuestionIds' }));
  }
  return issues;
}

function writtenIdentityIssues(
  snapshot: Pick<
    AssessmentAttemptSnapshot,
    | 'blueprintId'
    | 'courseId'
    | 'moduleId'
    | 'orderedQuestionIds'
    | 'questionVersions'
    | 'gradingPolicy'
    | 'practiceSelection'
  >,
  registry: QuestionRegistry,
): SessionIssue[] {
  const issues: SessionIssue[] = [];
  if (snapshot.blueprintId !== HVP_WRITTEN_BLUEPRINT_ID) {
    issues.push(sessionIssue('PILOT_BLUEPRINT_MISMATCH', 'This is not the HVP written-practice blueprint.', { path: 'blueprintId' }));
  }
  if (snapshot.courseId !== HVP_CURATED_COURSE_ID || snapshot.moduleId !== HVP_CURATED_MODULE_ID) {
    issues.push(sessionIssue('PILOT_COURSE_MISMATCH', 'Written practice must belong to OPT 374 Human Visual Perception.', { path: 'courseId' }));
  }
  if (
    snapshot.gradingPolicy?.id !== HVP_CURATED_POLICY.id
    || snapshot.gradingPolicy.version !== HVP_CURATED_POLICY.version
  ) {
    issues.push(sessionIssue('PILOT_POLICY_MISMATCH', 'Written practice requires diagnostic@1.', { path: 'gradingPolicy' }));
  }
  const selected = snapshot.practiceSelection
    ? validatePracticeSelection(snapshot.practiceSelection, hvpWrittenPracticeBlueprint)
    : undefined;
  if (!selected || !selected.ok) {
    issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'Written practice requires its persisted version-1 selection identity.', { path: 'practiceSelection' }));
  } else if (!snapshot.practiceSelection || !hasValidStrategyEvidence(snapshot.practiceSelection)) {
    issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'Written practice strategy evidence is missing or altered.', { path: 'practiceSelection.strategyEvidenceHash' }));
  }
  const canonical = registry.questionIds()
    .filter((id) => registry.get(id)?.format === 'open_response')
    .sort();
  if (
    snapshot.practiceSelection
    && hasValidStrategyEvidence(snapshot.practiceSelection)
    && (
      snapshot.practiceSelection.strategyEligibleQuestionIds?.length !== canonical.length
      || snapshot.practiceSelection.strategyEligibleQuestionIds.some(
        (id, index) => id !== canonical[index],
      )
    )
  ) {
    issues.push(sessionIssue(
      'PILOT_QUESTION_SET_MISMATCH',
      'Written-practice evidence must identify exactly the canonical open-response pool.',
      { path: 'practiceSelection.strategyEligibleQuestionIds' },
    ));
  }
  if (
    snapshot.orderedQuestionIds.length !== 2
    || new Set(snapshot.orderedQuestionIds).size !== 2
    || snapshot.orderedQuestionIds.some((id) => !canonical.includes(id))
  ) {
    issues.push(sessionIssue('PILOT_QUESTION_SET_MISMATCH', 'Written practice must contain exactly the two canonical open-response questions.', { path: 'orderedQuestionIds' }));
  }
  snapshot.orderedQuestionIds.forEach((id) => {
    const entry = registry.getEntry(id);
    if (!entry || entry.format !== 'open_response' || snapshot.questionVersions[id] !== entry.version) {
      issues.push(sessionIssue('QUESTION_VERSION_MISMATCH', `Written question "${id}" is not the exact current canonical version.`, { questionId: id, path: `questionVersions.${id}` }));
    }
  });
  return issues;
}

function identityIssues(
  snapshot: AssessmentAttemptSnapshot | AssessmentResultSnapshot,
  registry: QuestionRegistry,
): SessionIssue[] {
  return snapshot.blueprintId === HVP_WRITTEN_BLUEPRINT_ID
    ? writtenIdentityIssues(snapshot, registry)
    : automaticIdentityIssues(snapshot, registry);
}

export function validateHvpCuratedAttempt(
  attempt: AssessmentAttemptSnapshot,
  registry: QuestionRegistry,
): SessionResult<ResolvedAssessmentSession> {
  const issues: SessionIssue[] = identityIssues(attempt, registry).map((issue) => ({ ...issue, attemptId: attempt.id }));
  if (attempt.mode !== 'study') issues.push(sessionIssue('PILOT_MODE_MISMATCH', 'HVP practice is available only in Study mode.', { attemptId: attempt.id, path: 'mode' }));
  const resolved = resolveAssessmentAttempt(attempt, registry);
  if (!resolved.ok) issues.push(...resolved.issues);
  return issues.length
    ? sessionFailure(issues)
    : sessionSuccess(resolved.ok ? resolved.value : { attempt, questions: [] });
}

export function validateHvpCuratedResult(
  result: AssessmentResultSnapshot,
  registry: QuestionRegistry,
): SessionResult<{ result: AssessmentResultSnapshot; report: AssessmentGradingReport }> {
  const issues: SessionIssue[] = identityIssues(result, registry).map((issue) => ({ ...issue, attemptId: result.attemptId }));
  if (result.blueprintId === HVP_WRITTEN_BLUEPRINT_ID && (result.score !== null || result.maxScore !== null)) {
    issues.push(sessionIssue('PILOT_RESULT_INCOMPATIBLE', 'Written practice is manual-only and cannot carry numeric totals.', { attemptId: result.attemptId, path: 'score' }));
  }
  if (issues.length) return sessionFailure(issues);
  const graded = gradeAssessmentResult({ result, registry });
  if (!graded.ok) {
    return sessionFailure(sessionIssue('PILOT_RESULT_INCOMPATIBLE', `The result failed deterministic grading verification: ${graded.issues.map((issue) => issue.code).join(', ')}.`, { attemptId: result.attemptId, path: 'grading' }));
  }
  return sessionSuccess({ result: structuredClone(result), report: graded.value });
}
