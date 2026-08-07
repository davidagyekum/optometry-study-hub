import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import type { AssessmentGradingReport } from '@/lib/assessment/grading/types';
import { validatePracticeSelection } from '@/lib/assessment/practice/blueprint';
import { hasValidStrategyEvidence } from '@/lib/assessment/practice/evidence';
import type { PracticeBlueprint } from '@/lib/assessment/practice/types';
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

const HIGHER_ORDER_LEVELS = new Set([
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

type CuratedCompatibilityConfig = {
  experienceName: string;
  courseId: string;
  moduleId: string;
  automaticBlueprint: PracticeBlueprint;
  writtenBlueprint?: PracticeBlueprint;
};

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

export function createCuratedCompatibility({
  experienceName,
  courseId,
  moduleId,
  automaticBlueprint,
  writtenBlueprint,
}: CuratedCompatibilityConfig) {
  const policy = automaticBlueprint.gradingPolicy;

  function sharedIdentityIssues(
    snapshot: AssessmentAttemptSnapshot | AssessmentResultSnapshot,
    blueprint: PracticeBlueprint,
  ): SessionIssue[] {
    const issues: SessionIssue[] = [];
    if (snapshot.blueprintId !== blueprint.id) {
      issues.push(sessionIssue(
        'PILOT_BLUEPRINT_MISMATCH',
        `This is not a ${experienceName} snapshot.`,
        { path: 'blueprintId' },
      ));
    }
    if (snapshot.courseId !== courseId) {
      issues.push(sessionIssue(
        'PILOT_COURSE_MISMATCH',
        `The assessment does not belong to ${experienceName}.`,
        { path: 'courseId' },
      ));
    }
    if (snapshot.moduleId !== moduleId) {
      issues.push(sessionIssue(
        'PILOT_MODULE_MISMATCH',
        `The assessment does not belong to the ${experienceName} module.`,
        { path: 'moduleId' },
      ));
    }
    if (
      snapshot.gradingPolicy?.id !== policy.id
      || snapshot.gradingPolicy.version !== policy.version
    ) {
      issues.push(sessionIssue(
        'PILOT_POLICY_MISMATCH',
        `${experienceName} requires ${policy.id}@${policy.version} grading.`,
        { path: 'gradingPolicy' },
      ));
    }
    return issues;
  }

  function automaticIdentityIssues(
    snapshot: AssessmentAttemptSnapshot | AssessmentResultSnapshot,
    registry: QuestionRegistry,
  ): SessionIssue[] {
    const issues = sharedIdentityIssues(snapshot, automaticBlueprint);
    const selection = snapshot.practiceSelection;
    if (!selection) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        'Curated practice requires a persisted version-1 selection identity.',
        { path: 'practiceSelection' },
      ));
      return issues;
    }
    const validated = validatePracticeSelection(selection, automaticBlueprint);
    if (!validated.ok) {
      issues.push(...validated.issues.map((issue) => sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `[${issue.code}] ${issue.message}`,
        { path: issue.path ?? 'practiceSelection' },
      )));
    }
    if (!hasValidStrategyEvidence(selection)) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        'Persisted strategy evidence is missing or has been altered.',
        { path: 'practiceSelection.strategyEvidenceHash' },
      ));
    } else if (snapshot.orderedQuestionIds.some(
      (id) => !selection.strategyEligibleQuestionIds?.includes(id),
    )) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        'A persisted question is outside the strategy-eligible pool.',
        { path: 'practiceSelection.strategyEligibleQuestionIds' },
      ));
    }
    if (
      snapshot.orderedQuestionIds.length !== selection.requestedCount
      || new Set(snapshot.orderedQuestionIds).size !== selection.requestedCount
    ) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `This practice snapshot requires exactly ${selection.requestedCount} unique questions.`,
        { path: 'orderedQuestionIds' },
      ));
      return issues;
    }

    const sections: Record<string, number> = {};
    const formats: Record<string, number> = {};
    const difficulties: Record<string, number> = {};
    const families: Record<string, number> = {};
    const objectives = new Set<string>();
    let higherOrderCount = 0;
    snapshot.orderedQuestionIds.forEach((questionId) => {
      const entry = registry.getEntry(questionId);
      if (!entry) return;
      increment(sections, entry.sectionId);
      increment(formats, entry.format);
      increment(difficulties, entry.question.difficulty);
      increment(families, entry.familyId);
      objectives.add(entry.objectiveId);
      if (HIGHER_ORDER_LEVELS.has(entry.question.bloomLevel)) {
        higherOrderCount += 1;
      }
      if (entry.format === 'open_response') {
        issues.push(sessionIssue(
          'PILOT_QUESTION_SET_MISMATCH',
          'Open responses are excluded from scored curated practice.',
          { questionId, path: 'orderedQuestionIds' },
        ));
      }
      if (snapshot.questionVersions[questionId] !== entry.version) {
        issues.push(sessionIssue(
          'QUESTION_VERSION_MISMATCH',
          `Question "${questionId}" is not stored at its exact current version.`,
          { questionId, path: `questionVersions.${questionId}` },
        ));
      }
      if (
        !selection.sectionIds.includes(entry.sectionId)
        || !selection.formats.includes(entry.format)
        || !selection.difficulties.includes(entry.question.difficulty)
      ) {
        issues.push(sessionIssue(
          'PILOT_QUESTION_SET_MISMATCH',
          `Question "${questionId}" falls outside the persisted selection filters.`,
          { questionId, path: 'practiceSelection' },
        ));
      }
    });

    const profile = automaticBlueprint.profiles.find(
      (candidate) => candidate.id === selection.profileId,
    );
    const enforcesExactQuotaTargets = Boolean(
      profile?.sectionTargets
      && profile.formatTargets
      && profile.difficultyTargets,
    );
    // Short-profile quota targets remain advisory unless the assembler is
    // explicitly configured to enforce partial-profile targets.
    const enforcesConstrainedTargets = enforcesExactQuotaTargets || Boolean(
      automaticBlueprint.enforcePartialProfileTargets && profile?.sectionTargets,
    );
    if (enforcesConstrainedTargets && profile?.sectionTargets) {
      issues.push(...expectedCounts(sections, profile.sectionTargets, 'Section'));
    }
    if (enforcesExactQuotaTargets && profile?.formatTargets) {
      issues.push(...expectedCounts(formats, profile.formatTargets, 'Format'));
    }
    if (enforcesExactQuotaTargets && profile?.difficultyTargets) {
      issues.push(...expectedCounts(
        difficulties,
        profile.difficultyTargets,
        'Difficulty',
      ));
    }
    if (
      enforcesConstrainedTargets
      && profile
      && higherOrderCount < profile.higherOrderMinimum
    ) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `Profile "${profile.id}" requires at least ${profile.higherOrderMinimum} Apply-or-higher questions.`,
        { path: 'orderedQuestionIds' },
      ));
    }
    if (
      enforcesConstrainedTargets
      && profile?.higherOrderMaximum !== undefined
      && higherOrderCount > profile.higherOrderMaximum
    ) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `Profile "${profile.id}" permits at most ${profile.higherOrderMaximum} Apply-or-higher questions.`,
        { path: 'orderedQuestionIds' },
      ));
    }
    profile?.requiredObjectiveIds?.forEach((objectiveId) => {
      if (!objectives.has(objectiveId)) {
        issues.push(sessionIssue(
          'PILOT_QUESTION_SET_MISMATCH',
          `Profile "${profile.id}" requires objective "${objectiveId}".`,
          { path: 'orderedQuestionIds' },
        ));
      }
    });
    if (Object.values(families).some(
      (count) => count > automaticBlueprint.maximumFamilyRepetition,
    )) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `A practice set may contain at most ${automaticBlueprint.maximumFamilyRepetition} questions from one family.`,
        { path: 'orderedQuestionIds' },
      ));
    }
    return issues;
  }

  function writtenIdentityIssues(
    snapshot: AssessmentAttemptSnapshot | AssessmentResultSnapshot,
    registry: QuestionRegistry,
  ): SessionIssue[] {
    if (!writtenBlueprint) {
      return [sessionIssue(
        'PILOT_BLUEPRINT_MISMATCH',
        `${experienceName} does not provide written practice.`,
        { path: 'blueprintId' },
      )];
    }
    const issues = sharedIdentityIssues(snapshot, writtenBlueprint);
    const selected = snapshot.practiceSelection
      ? validatePracticeSelection(snapshot.practiceSelection, writtenBlueprint)
      : undefined;
    if (!selected?.ok) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        'Written practice requires its persisted version-1 selection identity.',
        { path: 'practiceSelection' },
      ));
    } else if (
      !snapshot.practiceSelection
      || !hasValidStrategyEvidence(snapshot.practiceSelection)
    ) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        'Written-practice strategy evidence is missing or altered.',
        { path: 'practiceSelection.strategyEvidenceHash' },
      ));
    }
    const canonical = registry.questionIds()
      .filter((id) => registry.get(id)?.format === 'open_response')
      .sort();
    const evidenceIds = snapshot.practiceSelection
      ?.strategyEligibleQuestionIds
      ?.slice()
      .sort();
    if (
      !evidenceIds
      || evidenceIds.length !== canonical.length
      || evidenceIds.some((id, index) => id !== canonical[index])
    ) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        'Written-practice evidence must identify the canonical open-response pool.',
        { path: 'practiceSelection.strategyEligibleQuestionIds' },
      ));
    }
    if (
      snapshot.orderedQuestionIds.length !== canonical.length
      || new Set(snapshot.orderedQuestionIds).size !== canonical.length
      || snapshot.orderedQuestionIds.some((id) => !canonical.includes(id))
    ) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `Written practice must contain exactly ${canonical.length} canonical open-response questions.`,
        { path: 'orderedQuestionIds' },
      ));
    }
    snapshot.orderedQuestionIds.forEach((id) => {
      const entry = registry.getEntry(id);
      if (
        !entry
        || entry.format !== 'open_response'
        || snapshot.questionVersions[id] !== entry.version
      ) {
        issues.push(sessionIssue(
          'QUESTION_VERSION_MISMATCH',
          `Written question "${id}" is not the exact current canonical version.`,
          { questionId: id, path: `questionVersions.${id}` },
        ));
      }
    });
    return issues;
  }

  function identityIssues(
    snapshot: AssessmentAttemptSnapshot | AssessmentResultSnapshot,
    registry: QuestionRegistry,
  ): SessionIssue[] {
    return writtenBlueprint && snapshot.blueprintId === writtenBlueprint.id
      ? writtenIdentityIssues(snapshot, registry)
      : automaticIdentityIssues(snapshot, registry);
  }

  return {
    validateAttempt(
      attempt: AssessmentAttemptSnapshot,
      registry: QuestionRegistry,
    ): SessionResult<ResolvedAssessmentSession> {
      const issues: SessionIssue[] = identityIssues(attempt, registry).map(
        (issue) => ({ ...issue, attemptId: attempt.id }),
      );
      if (attempt.mode !== 'study') {
        issues.push(sessionIssue(
          'PILOT_MODE_MISMATCH',
          `${experienceName} is available only in Study mode.`,
          { attemptId: attempt.id, path: 'mode' },
        ));
      }
      const resolved = resolveAssessmentAttempt(attempt, registry);
      if (!resolved.ok) issues.push(...resolved.issues);
      return issues.length
        ? sessionFailure(issues)
        : sessionSuccess(resolved.ok
          ? resolved.value
          : { attempt, questions: [] });
    },
    validateResult(
      result: AssessmentResultSnapshot,
      registry: QuestionRegistry,
    ): SessionResult<{
      result: AssessmentResultSnapshot;
      report: AssessmentGradingReport;
    }> {
      const issues: SessionIssue[] = identityIssues(result, registry).map(
        (issue) => ({ ...issue, attemptId: result.attemptId }),
      );
      if (
        writtenBlueprint
        && result.blueprintId === writtenBlueprint.id
        && (result.score !== null || result.maxScore !== null)
      ) {
        issues.push(sessionIssue(
          'PILOT_RESULT_INCOMPATIBLE',
          'Written practice is manual-only and cannot carry numeric totals.',
          { attemptId: result.attemptId, path: 'score' },
        ));
      }
      if (issues.length) return sessionFailure(issues);
      const graded = gradeAssessmentResult({ result, registry });
      if (!graded.ok) {
        return sessionFailure(sessionIssue(
          'PILOT_RESULT_INCOMPATIBLE',
          `The result failed deterministic grading verification: ${graded.issues.map((issue) => issue.code).join(', ')}.`,
          { attemptId: result.attemptId, path: 'grading' },
        ));
      }
      return sessionSuccess({
        result: structuredClone(result),
        report: graded.value,
      });
    },
  };
}
