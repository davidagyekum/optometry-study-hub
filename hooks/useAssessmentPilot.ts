'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  AQUEOUS_PILOT_COURSE_ID,
  AQUEOUS_PILOT_MODULE_ID,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import { buildDraftOnlyAqueousPilotRegistry } from '@/lib/assessment/pilot/registry';
import {
  selectActiveAqueousPilotAttempt,
  selectLatestCompatibleAqueousPilotResult,
} from '@/lib/assessment/pilot/selectors';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  clearAttemptDraftResponse,
  updateAttemptDraftResponse,
} from '@/lib/assessment/session/draftResponses';
import {
  moveAttemptToIndex,
  toggleAttemptFlag,
} from '@/lib/assessment/session/attemptActions';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type { SessionResult } from '@/lib/assessment/session/types';
import type { GoToRoute } from '@/hooks/useClientRoute';
import {
  finalizeAssessmentStore,
  getActiveAssessmentAttempt,
  getAssessmentResult,
  putActiveAssessmentAttempt,
  removeActiveAssessmentAttempt,
} from '@/lib/storage/assessmentStore';
import type {
  AssessmentAttemptSnapshot,
  AssessmentDraftResponse,
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

export function useAssessmentPilot({
  store,
  setStore,
  go,
}: {
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  const registryResult = buildDraftOnlyAqueousPilotRegistry();
  const registry = registryResult.ok ? registryResult.value : undefined;
  const activeAttempt = selectActiveAqueousPilotAttempt(store);
  const latestResult = registry
    ? selectLatestCompatibleAqueousPilotResult(store, registry)
    : undefined;

  const registryUnavailable = <T,>(): SessionResult<T> => sessionFailure(
    registryResult.ok
      ? sessionIssue('MALFORMED_QUESTION_BANK', 'Pilot registry is unavailable.')
      : registryResult.issues,
  );

  const persistAttempt = (
    attempt: AssessmentAttemptSnapshot,
  ): SessionResult<AssessmentAttemptSnapshot> => {
    const nextStore = putActiveAssessmentAttempt(store, attempt.id, attempt);
    if (!nextStore.ok) return nextStore;
    setStore(nextStore.value);
    return sessionSuccess(attempt);
  };

  const start = (restart = false): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    if (activeAttempt && !restart) {
      go('assessment', activeAttempt.id);
      return sessionSuccess(activeAttempt);
    }
    let baseStore = store;
    if (activeAttempt) {
      const removed = removeActiveAssessmentAttempt(baseStore, activeAttempt.id);
      if (!removed.ok) return removed;
      baseStore = removed.value;
    }
    const created = createAssessmentAttempt({
      registry,
      questionIds: [...AQUEOUS_PILOT_QUESTION_IDS],
      mode: 'study',
      courseId: AQUEOUS_PILOT_COURSE_ID,
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
    });
    if (!created.ok) return created;
    const inserted = putActiveAssessmentAttempt(baseStore, created.value.id, created.value);
    if (!inserted.ok) return inserted;
    setStore(inserted.value);
    go('assessment', created.value.id);
    return created;
  };

  const updateDraft = (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
    draft: AssessmentDraftResponse,
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const updated = updateAttemptDraftResponse({
      attempt,
      registry,
      questionId,
      draft,
    });
    return updated.ok ? persistAttempt(updated.value) : updated;
  };

  const clearDraft = (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
  ): SessionResult<AssessmentAttemptSnapshot> => {
    const updated = clearAttemptDraftResponse(attempt, questionId);
    return updated.ok ? persistAttempt(updated.value) : updated;
  };

  const moveTo = (
    attempt: AssessmentAttemptSnapshot,
    index: number,
  ): SessionResult<AssessmentAttemptSnapshot> => {
    const updated = moveAttemptToIndex(attempt, index);
    return updated.ok ? persistAttempt(updated.value) : updated;
  };

  const toggleFlag = (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
  ): SessionResult<AssessmentAttemptSnapshot> => {
    const updated = toggleAttemptFlag(attempt, questionId);
    return updated.ok ? persistAttempt(updated.value) : updated;
  };

  const discard = (attemptId: string): SessionResult<StoreV2> => {
    const removed = removeActiveAssessmentAttempt(store, attemptId);
    if (removed.ok) setStore(removed.value);
    return removed;
  };

  const submit = (
    attemptId: string,
  ): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return registryUnavailable();
    const latestAttempt = getActiveAssessmentAttempt(store, attemptId);
    if (!latestAttempt.ok) return latestAttempt;
    if (latestAttempt.value.blueprintId !== AQUEOUS_PILOT_BLUEPRINT_ID) {
      return sessionFailure(sessionIssue(
        'RESULT_ATTEMPT_MISMATCH',
        'This assessment attempt does not belong to the controlled pilot.',
        { attemptId, path: 'blueprintId' },
      ));
    }
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: latestAttempt.value,
      registry,
    });
    if (!finalized.ok) return sessionFailure(finalized.issues);
    const stored = finalizeAssessmentStore(
      store,
      latestAttempt.value.id,
      finalized.value.result.id,
      finalized.value.result,
    );
    if (!stored.ok) return stored;
    setStore(stored.value);
    go('assessment-result', finalized.value.result.id);
    return sessionSuccess(finalized.value.result);
  };

  return {
    registryResult,
    registry,
    activeAttempt,
    latestResult,
    start,
    updateDraft,
    clearDraft,
    moveTo,
    toggleFlag,
    discard,
    submit,
    getAttempt: (attemptId: string) => getActiveAssessmentAttempt(store, attemptId),
    getResult: (resultId: string) => getAssessmentResult(store, resultId),
  };
}
