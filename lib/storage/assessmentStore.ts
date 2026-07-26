import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type { SessionResult } from '@/lib/assessment/session/types';
import {
  storeV2Schema,
  type AssessmentAttemptSnapshot,
  type AssessmentResultSnapshot,
  type StoreV2,
} from '@/lib/storage/schemas';

function validatedStore(
  candidate: StoreV2,
  context: { attemptId?: string; path?: string } = {},
): SessionResult<StoreV2> {
  const parsed = storeV2Schema.safeParse(candidate);
  return parsed.success
    ? sessionSuccess(parsed.data)
    : sessionFailure(parsed.error.issues.map((issue) => sessionIssue(
      'INVALID_STORE',
      issue.message,
      {
        ...context,
        path: [context.path, issue.path.join('.')].filter(Boolean).join('.'),
      },
    )));
}

export function putActiveAssessmentAttempt(
  store: StoreV2,
  key: string,
  attempt: AssessmentAttemptSnapshot,
): SessionResult<StoreV2> {
  if (key !== attempt.id) {
    return sessionFailure(sessionIssue(
      'ATTEMPT_STORE_KEY_MISMATCH',
      `Active-attempt key "${key}" does not match attempt ID "${attempt.id}".`,
      { attemptId: attempt.id, path: `assessment.activeAttempts.${key}` },
    ));
  }
  return validatedStore({
    ...store,
    assessment: {
      ...store.assessment,
      activeAttempts: {
        ...store.assessment.activeAttempts,
        [key]: structuredClone(attempt),
      },
    },
  }, { attemptId: attempt.id });
}

export function getActiveAssessmentAttempt(
  store: StoreV2,
  key: string,
): SessionResult<AssessmentAttemptSnapshot> {
  const attempt = store.assessment.activeAttempts[key];
  if (!attempt) {
    return sessionFailure(sessionIssue(
      'ATTEMPT_NOT_FOUND',
      `Active attempt "${key}" does not exist.`,
      { attemptId: key, path: `assessment.activeAttempts.${key}` },
    ));
  }
  if (attempt.id !== key) {
    return sessionFailure(sessionIssue(
      'ATTEMPT_STORE_KEY_MISMATCH',
      `Active-attempt key "${key}" does not match attempt ID "${attempt.id}".`,
      { attemptId: attempt.id, path: `assessment.activeAttempts.${key}` },
    ));
  }
  return sessionSuccess(structuredClone(attempt));
}

export function removeActiveAssessmentAttempt(
  store: StoreV2,
  key: string,
): SessionResult<StoreV2> {
  const existing = getActiveAssessmentAttempt(store, key);
  if (!existing.ok) return existing;
  const activeAttempts = { ...store.assessment.activeAttempts };
  delete activeAttempts[key];
  return validatedStore({
    ...store,
    assessment: {
      ...store.assessment,
      activeAttempts,
    },
  }, { attemptId: key });
}

export function putAssessmentResult(
  store: StoreV2,
  key: string,
  result: AssessmentResultSnapshot,
): SessionResult<StoreV2> {
  if (key !== result.id) {
    return sessionFailure(sessionIssue(
      'RESULT_STORE_KEY_MISMATCH',
      `Result key "${key}" does not match result ID "${result.id}".`,
      { attemptId: result.attemptId, path: `assessment.results.${key}` },
    ));
  }
  return validatedStore({
    ...store,
    assessment: {
      ...store.assessment,
      results: {
        ...store.assessment.results,
        [key]: structuredClone(result),
      },
    },
  }, { attemptId: result.attemptId });
}

export function getAssessmentResult(
  store: StoreV2,
  key: string,
): SessionResult<AssessmentResultSnapshot> {
  const result = store.assessment.results[key];
  if (!result) {
    return sessionFailure(sessionIssue(
      'RESULT_NOT_FOUND',
      `Assessment result "${key}" does not exist.`,
      { path: `assessment.results.${key}` },
    ));
  }
  if (result.id !== key) {
    return sessionFailure(sessionIssue(
      'RESULT_STORE_KEY_MISMATCH',
      `Result key "${key}" does not match result ID "${result.id}".`,
      { attemptId: result.attemptId, path: `assessment.results.${key}` },
    ));
  }
  return sessionSuccess(structuredClone(result));
}

export function finalizeAssessmentStore(
  store: StoreV2,
  attemptKey: string,
  resultKey: string,
  result: AssessmentResultSnapshot,
): SessionResult<StoreV2> {
  const active = getActiveAssessmentAttempt(store, attemptKey);
  if (!active.ok) return active;
  if (resultKey !== result.id) {
    return sessionFailure(sessionIssue(
      'RESULT_STORE_KEY_MISMATCH',
      `Result key "${resultKey}" does not match result ID "${result.id}".`,
      { attemptId: result.attemptId, path: `assessment.results.${resultKey}` },
    ));
  }
  if (result.attemptId !== active.value.id) {
    return sessionFailure(sessionIssue(
      'RESULT_ATTEMPT_MISMATCH',
      `Result attempt ID "${result.attemptId}" does not match active attempt "${active.value.id}".`,
      { attemptId: active.value.id, path: 'attemptId' },
    ));
  }

  const activeAttempts = { ...store.assessment.activeAttempts };
  delete activeAttempts[attemptKey];
  return validatedStore({
    ...store,
    assessment: {
      ...store.assessment,
      activeAttempts,
      results: {
        ...store.assessment.results,
        [resultKey]: structuredClone(result),
      },
    },
  }, { attemptId: attemptKey });
}
