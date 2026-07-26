import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import type { AssessmentGradingReport } from '@/lib/assessment/grading/types';
import {
  AQUEOUS_PILOT_COURSE_ID,
  AQUEOUS_PILOT_MODULE_ID,
  AQUEOUS_PILOT_POLICY,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
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

function hasExactPilotQuestionSet(ids: readonly string[]): boolean {
  if (ids.length !== AQUEOUS_PILOT_QUESTION_IDS.length) return false;
  const expected = new Set<string>(AQUEOUS_PILOT_QUESTION_IDS);
  return new Set(ids).size === ids.length && ids.every((id) => expected.has(id));
}

function hasExactPolicy(
  policy: AssessmentAttemptSnapshot['gradingPolicy'],
): boolean {
  return policy?.id === AQUEOUS_PILOT_POLICY.id
    && policy.version === AQUEOUS_PILOT_POLICY.version;
}

function identityIssues(
  snapshot: Pick<
    AssessmentAttemptSnapshot,
    'courseId' | 'moduleId' | 'orderedQuestionIds' | 'gradingPolicy'
  >,
): SessionIssue[] {
  const issues: SessionIssue[] = [];
  if (snapshot.courseId !== AQUEOUS_PILOT_COURSE_ID) {
    issues.push(sessionIssue(
      'PILOT_COURSE_MISMATCH',
      'The assessment does not belong to the controlled pilot course.',
      { path: 'courseId' },
    ));
  }
  if (snapshot.moduleId !== AQUEOUS_PILOT_MODULE_ID) {
    issues.push(sessionIssue(
      'PILOT_MODULE_MISMATCH',
      'The assessment does not belong to the controlled pilot module.',
      { path: 'moduleId' },
    ));
  }
  if (!hasExactPilotQuestionSet(snapshot.orderedQuestionIds)) {
    issues.push(sessionIssue(
      'PILOT_QUESTION_SET_MISMATCH',
      'The controlled pilot requires exactly its nine declared question IDs.',
      { path: 'orderedQuestionIds' },
    ));
  }
  if (!hasExactPolicy(snapshot.gradingPolicy)) {
    issues.push(sessionIssue(
      'PILOT_POLICY_MISMATCH',
      'The controlled pilot requires diagnostic@1 grading.',
      { path: 'gradingPolicy' },
    ));
  }
  return issues;
}

export function validateAqueousPilotAttempt(
  attempt: AssessmentAttemptSnapshot,
  registry: QuestionRegistry,
): SessionResult<ResolvedAssessmentSession> {
  const issues: SessionIssue[] = identityIssues(attempt).map((issue) => ({
    ...issue,
    attemptId: attempt.id,
  }));
  if (attempt.blueprintId !== AQUEOUS_PILOT_BLUEPRINT_ID) {
    issues.unshift(sessionIssue(
      'PILOT_BLUEPRINT_MISMATCH',
      'The attempt does not use the controlled Aqueous pilot blueprint.',
      { attemptId: attempt.id, path: 'blueprintId' },
    ));
  }
  if (attempt.mode !== 'study') {
    issues.push(sessionIssue(
      'PILOT_MODE_MISMATCH',
      'The controlled pilot is available only in Study mode.',
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

export function validateAqueousPilotResult(
  result: AssessmentResultSnapshot,
  registry: QuestionRegistry,
): SessionResult<{
  result: AssessmentResultSnapshot;
  report: AssessmentGradingReport;
}> {
  const issues: SessionIssue[] = identityIssues(result).map((issue) => ({
    ...issue,
    attemptId: result.attemptId,
  }));
  const versionsCurrent = hasExactPilotQuestionSet(result.orderedQuestionIds)
    && result.orderedQuestionIds.every((questionId) => (
      registry.getEntry(questionId)?.version === result.questionVersions[questionId]
    ));
  if (!versionsCurrent) {
    issues.push(sessionIssue(
      'PILOT_RESULT_INCOMPATIBLE',
      'The result does not resolve against the current pilot question versions.',
      { attemptId: result.attemptId, path: 'questionVersions' },
    ));
  }
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
