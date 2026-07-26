import {
  validateAqueousPilotAttempt,
  validateAqueousPilotResult,
} from '@/lib/assessment/pilot/compatibility';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import {
  sessionFailure,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

export function selectActiveAqueousPilotAttempt(
  store: StoreV2,
  registry: QuestionRegistry,
): SessionResult<AssessmentAttemptSnapshot | undefined> {
  const attempt = Object.values(store.assessment.activeAttempts).find(
    (candidate) => candidate.blueprintId === AQUEOUS_PILOT_BLUEPRINT_ID,
  );
  if (!attempt) return sessionSuccess(undefined);
  const compatible = validateAqueousPilotAttempt(attempt, registry);
  return compatible.ok
    ? sessionSuccess(structuredClone(attempt))
    : sessionFailure(compatible.issues);
}

export function selectCompatibleAqueousPilotResults(
  store: StoreV2,
  registry: QuestionRegistry,
): AssessmentResultSnapshot[] {
  return Object.values(store.assessment.results)
    .filter((result) => validateAqueousPilotResult(result, registry).ok)
    .map((result) => structuredClone(result));
}

export function selectLatestCompatibleAqueousPilotResult(
  store: StoreV2,
  registry: QuestionRegistry,
): AssessmentResultSnapshot | undefined {
  return selectCompatibleAqueousPilotResults(store, registry)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}
