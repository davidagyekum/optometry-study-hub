import {
  gradingFailure,
  gradingIssue,
  gradingSuccess,
} from '@/lib/assessment/grading/errors';
import { resolveSnapshotGradingPolicy } from '@/lib/assessment/grading/policyRegistry';
import type {
  GradingResult,
  LockAttemptGradingPolicyInput,
} from '@/lib/assessment/grading/types';
import {
  assessmentAttemptSnapshotSchema,
  type AssessmentAttemptSnapshot,
} from '@/lib/storage/schemas';

export function lockAttemptGradingPolicy({
  attempt,
  policy,
}: LockAttemptGradingPolicyInput): GradingResult<AssessmentAttemptSnapshot> {
  const parsedAttempt = assessmentAttemptSnapshotSchema.safeParse(attempt);
  if (!parsedAttempt.success) {
    return gradingFailure(parsedAttempt.error.issues.map((issue) => gradingIssue(
      'GRADING_ATTEMPT_INVALID',
      issue.message,
      { attemptId: attempt.id, path: issue.path.join('.') },
    )));
  }
  const validAttempt = parsedAttempt.data;
  const resolved = resolveSnapshotGradingPolicy(
    validAttempt.gradingPolicy,
    policy,
  );
  if (!resolved.ok) {
    return gradingFailure(resolved.issues.map((issue) => ({
      ...issue,
      attemptId: validAttempt.id,
    })));
  }
  const candidate: AssessmentAttemptSnapshot = {
    ...structuredClone(validAttempt),
    gradingPolicy: {
      id: resolved.value.id,
      version: resolved.value.version,
    },
  };
  const parsedCandidate = assessmentAttemptSnapshotSchema.safeParse(candidate);
  return parsedCandidate.success
    ? gradingSuccess(parsedCandidate.data)
    : gradingFailure(parsedCandidate.error.issues.map((issue) => gradingIssue(
      'GRADING_ATTEMPT_INVALID',
      issue.message,
      { attemptId: validAttempt.id, path: issue.path.join('.') },
    )));
}
