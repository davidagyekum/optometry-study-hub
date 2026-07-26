import { STABLE_ID_PATTERN } from '@/lib/assessment/constants';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type {
  FinalizeAssessmentAttemptInput,
  SessionResult,
} from '@/lib/assessment/session/types';
import {
  assessmentResultSnapshotSchema,
  type AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

function defaultResultId(): string {
  return `result-${globalThis.crypto.randomUUID()}`;
}

function submittedAt(now: () => Date): SessionResult<string> {
  let value: Date;
  try {
    value = now();
  } catch {
    return sessionFailure(sessionIssue('INVALID_TIMESTAMP', 'The finalisation clock threw.'));
  }
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return sessionFailure(sessionIssue(
      'INVALID_TIMESTAMP',
      'The finalisation clock must return a valid Date.',
    ));
  }
  return sessionSuccess(value.toISOString());
}

export function finalizeAssessmentAttempt({
  attempt,
  evaluation,
  now = () => new Date(),
  idFactory = defaultResultId,
}: FinalizeAssessmentAttemptInput): SessionResult<AssessmentResultSnapshot> {
  const { score, maxScore } = evaluation;
  if ((score === null) !== (maxScore === null)) {
    return sessionFailure(sessionIssue(
      'EVALUATION_PAIR_MISMATCH',
      'Score and maxScore must either both be null or both be numeric.',
      { attemptId: attempt.id, path: 'evaluation' },
    ));
  }
  if (score !== null && maxScore !== null) {
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      return sessionFailure(sessionIssue(
        'EVALUATION_MAX_INVALID',
        'A numeric maxScore must be finite and greater than zero.',
        { attemptId: attempt.id, path: 'maxScore' },
      ));
    }
    if (
      !Number.isFinite(score)
      || score < 0
      || score > maxScore
    ) {
      return sessionFailure(sessionIssue(
        'EVALUATION_SCORE_INVALID',
        'A numeric score must be finite, nonnegative, and no greater than maxScore.',
        { attemptId: attempt.id, path: 'score' },
      ));
    }
  }

  let resultId: string;
  try {
    resultId = idFactory();
  } catch {
    return sessionFailure(sessionIssue(
      'INVALID_RESULT_ID',
      'The result ID factory threw.',
      { attemptId: attempt.id },
    ));
  }
  if (!STABLE_ID_PATTERN.test(resultId)) {
    return sessionFailure(sessionIssue(
      'INVALID_RESULT_ID',
      'Result IDs must use stable slug-style syntax.',
      { attemptId: attempt.id, path: 'id' },
    ));
  }
  const timestamp = submittedAt(now);
  if (!timestamp.ok) return timestamp;

  const candidate: AssessmentResultSnapshot = {
    id: resultId,
    attemptId: attempt.id,
    courseId: attempt.courseId,
    moduleId: attempt.moduleId,
    submittedAt: timestamp.value,
    orderedQuestionIds: [...attempt.orderedQuestionIds],
    questionVersions: { ...attempt.questionVersions },
    responses: structuredClone(attempt.responses),
    score,
    maxScore,
  };
  const parsed = assessmentResultSnapshotSchema.safeParse(candidate);
  if (!parsed.success) {
    return sessionFailure(parsed.error.issues.map((issue) => sessionIssue(
      'INVALID_RESULT_SNAPSHOT',
      issue.message,
      { attemptId: attempt.id, path: issue.path.join('.') },
    )));
  }
  return sessionSuccess(parsed.data);
}
