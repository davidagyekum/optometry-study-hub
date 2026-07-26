import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import { validateResponseForQuestion } from '@/lib/assessment/session/responseValidation';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  PersistedResponse,
} from '@/lib/storage/schemas';

function includesQuestion(
  attempt: AssessmentAttemptSnapshot,
  questionId: string,
): boolean {
  return attempt.orderedQuestionIds.includes(questionId);
}

function questionOutsideAttempt(
  attempt: AssessmentAttemptSnapshot,
  questionId: string,
): SessionResult<never> {
  return sessionFailure(sessionIssue(
    'QUESTION_NOT_IN_ATTEMPT',
    `Question "${questionId}" is not part of this attempt.`,
    { attemptId: attempt.id, questionId },
  ));
}

export function setAttemptResponse(
  attempt: AssessmentAttemptSnapshot,
  registry: QuestionRegistry,
  questionId: string,
  input: unknown,
): SessionResult<AssessmentAttemptSnapshot> {
  if (!includesQuestion(attempt, questionId)) {
    return questionOutsideAttempt(attempt, questionId);
  }
  const question = registry.get(questionId);
  if (!question) {
    return sessionFailure(sessionIssue(
      'QUESTION_NOT_FOUND',
      `Question "${questionId}" is not registered.`,
      { attemptId: attempt.id, questionId },
    ));
  }
  const validated = validateResponseForQuestion(question, input);
  if (!validated.ok) {
    return sessionFailure(validated.issues.map((issue) => ({
      ...issue,
      attemptId: attempt.id,
    })));
  }
  const response = structuredClone(validated.value.response) as PersistedResponse;
  return sessionSuccess({
    ...attempt,
    responses: {
      ...attempt.responses,
      [questionId]: response,
    },
  });
}

export function clearAttemptResponse(
  attempt: AssessmentAttemptSnapshot,
  questionId: string,
): SessionResult<AssessmentAttemptSnapshot> {
  if (!includesQuestion(attempt, questionId)) {
    return questionOutsideAttempt(attempt, questionId);
  }
  const responses = { ...attempt.responses };
  delete responses[questionId];
  return sessionSuccess({ ...attempt, responses });
}

export function toggleAttemptFlag(
  attempt: AssessmentAttemptSnapshot,
  questionId: string,
): SessionResult<AssessmentAttemptSnapshot> {
  if (!includesQuestion(attempt, questionId)) {
    return questionOutsideAttempt(attempt, questionId);
  }
  const flags = attempt.flags.includes(questionId)
    ? attempt.flags.filter((id) => id !== questionId)
    : [...attempt.flags, questionId];
  return sessionSuccess({ ...attempt, flags });
}

export function moveAttemptToIndex(
  attempt: AssessmentAttemptSnapshot,
  index: number,
): SessionResult<AssessmentAttemptSnapshot> {
  if (!Number.isInteger(index) || index < 0 || index >= attempt.orderedQuestionIds.length) {
    return sessionFailure(sessionIssue(
      'CURRENT_INDEX_OUT_OF_RANGE',
      `Question index ${index} is outside this attempt.`,
      { attemptId: attempt.id, path: 'currentIndex' },
    ));
  }
  return sessionSuccess({ ...attempt, currentIndex: index });
}

export function moveAttemptNext(
  attempt: AssessmentAttemptSnapshot,
): SessionResult<AssessmentAttemptSnapshot> {
  const finalIndex = attempt.orderedQuestionIds.length - 1;
  return sessionSuccess({
    ...attempt,
    currentIndex: Math.min(attempt.currentIndex + 1, finalIndex),
  });
}

export function moveAttemptPrevious(
  attempt: AssessmentAttemptSnapshot,
): SessionResult<AssessmentAttemptSnapshot> {
  return sessionSuccess({
    ...attempt,
    currentIndex: Math.max(attempt.currentIndex - 1, 0),
  });
}
