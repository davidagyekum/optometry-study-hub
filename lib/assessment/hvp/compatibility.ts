import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import type { AssessmentGradingReport } from '@/lib/assessment/grading/types';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
} from '@/lib/assessment/hvp/config';
import {
  HVP_PRACTICE_FORMAT_TARGETS,
  HVP_PRACTICE_SECTION_TARGETS,
} from '@/lib/assessment/hvp/assembler';
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

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

function identityIssues(
  snapshot: Pick<
    AssessmentAttemptSnapshot,
    | 'blueprintId'
    | 'courseId'
    | 'moduleId'
    | 'orderedQuestionIds'
    | 'questionVersions'
    | 'gradingPolicy'
  >,
  registry: QuestionRegistry,
): SessionIssue[] {
  const issues: SessionIssue[] = [];
  if (snapshot.blueprintId !== HVP_CURATED_BLUEPRINT_ID) {
    issues.push(sessionIssue(
      'PILOT_BLUEPRINT_MISMATCH',
      'The assessment does not use the OPT 374 curated-practice blueprint.',
      { path: 'blueprintId' },
    ));
  }
  if (snapshot.courseId !== HVP_CURATED_COURSE_ID) {
    issues.push(sessionIssue(
      'PILOT_COURSE_MISMATCH',
      'The assessment does not belong to OPT 374 Human Visual Perception.',
      { path: 'courseId' },
    ));
  }
  if (snapshot.moduleId !== HVP_CURATED_MODULE_ID) {
    issues.push(sessionIssue(
      'PILOT_MODULE_MISMATCH',
      'The assessment does not belong to the Human Visual Perception module.',
      { path: 'moduleId' },
    ));
  }
  if (
    snapshot.gradingPolicy?.id !== HVP_CURATED_POLICY.id
    || snapshot.gradingPolicy.version !== HVP_CURATED_POLICY.version
  ) {
    issues.push(sessionIssue(
      'PILOT_POLICY_MISMATCH',
      'Curated practice requires diagnostic@1 grading.',
      { path: 'gradingPolicy' },
    ));
  }
  if (
    snapshot.orderedQuestionIds.length !== 50
    || new Set(snapshot.orderedQuestionIds).size !== 50
  ) {
    issues.push(sessionIssue(
      'PILOT_QUESTION_SET_MISMATCH',
      'Curated practice requires exactly 50 unique questions.',
      { path: 'orderedQuestionIds' },
    ));
    return issues;
  }

  const sections: Record<string, number> = {};
  const formats: Record<string, number> = {};
  const families: Record<string, number> = {};
  for (const questionId of snapshot.orderedQuestionIds) {
    const entry = registry.getEntry(questionId);
    if (!entry) continue;
    increment(sections, entry.sectionId);
    increment(formats, entry.format);
    increment(families, entry.familyId);
    if (entry.format === 'open_response') {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        'Open responses are excluded from automatically scored curated practice.',
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
  }
  for (const [sectionId, expected] of Object.entries(HVP_PRACTICE_SECTION_TARGETS)) {
    if ((sections[sectionId] ?? 0) !== expected) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `Section "${sectionId}" requires ${expected} questions.`,
        { path: 'orderedQuestionIds' },
      ));
    }
  }
  for (const [format, expected] of Object.entries(HVP_PRACTICE_FORMAT_TARGETS)) {
    if ((formats[format] ?? 0) !== expected) {
      issues.push(sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `Format "${format}" requires ${expected} questions.`,
        { path: 'orderedQuestionIds' },
      ));
    }
  }
  if (Object.values(families).some((count) => count > 2)) {
    issues.push(sessionIssue(
      'PILOT_QUESTION_SET_MISMATCH',
      'A curated practice set may contain at most two questions from one family.',
      { path: 'orderedQuestionIds' },
    ));
  }
  return issues;
}

export function validateHvpCuratedAttempt(
  attempt: AssessmentAttemptSnapshot,
  registry: QuestionRegistry,
): SessionResult<ResolvedAssessmentSession> {
  const issues: SessionIssue[] = identityIssues(attempt, registry).map((issue) => ({
    ...issue,
    attemptId: attempt.id,
  }));
  if (attempt.mode !== 'study') {
    issues.push(sessionIssue(
      'PILOT_MODE_MISMATCH',
      'Curated practice is available only in Study mode.',
      { attemptId: attempt.id, path: 'mode' },
    ));
  }
  const resolved = resolveAssessmentAttempt(attempt, registry);
  if (!resolved.ok) issues.push(...resolved.issues);
  return issues.length > 0
    ? sessionFailure(issues)
    : sessionSuccess(resolved.ok
      ? resolved.value
      : { attempt, questions: [] });
}

export function validateHvpCuratedResult(
  result: AssessmentResultSnapshot,
  registry: QuestionRegistry,
): SessionResult<{
  result: AssessmentResultSnapshot;
  report: AssessmentGradingReport;
}> {
  const issues: SessionIssue[] = identityIssues(result, registry).map((issue) => ({
    ...issue,
    attemptId: result.attemptId,
  }));
  if (issues.length > 0) return sessionFailure(issues);
  const graded = gradeAssessmentResult({ result, registry });
  if (!graded.ok) {
    return sessionFailure(sessionIssue(
      'PILOT_RESULT_INCOMPATIBLE',
      `The result failed deterministic grading verification: ${graded.issues
        .map((issue) => issue.code).join(', ')}.`,
      { attemptId: result.attemptId, path: 'grading' },
    ));
  }
  return sessionSuccess({
    result: structuredClone(result),
    report: graded.value,
  });
}
