'use client';

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  AQUEOUS_PILOT_COURSE_ID,
  AQUEOUS_PILOT_MODULE_ID,
  AQUEOUS_PILOT_POLICY,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import {
  validateAqueousPilotAttempt,
  validateAqueousPilotResult,
} from '@/lib/assessment/pilot/compatibility';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import { buildDraftOnlyAqueousPilotRegistry } from '@/lib/assessment/pilot/registry';
import {
  selectActiveAqueousPilotAttempt,
  selectLatestCompatibleAqueousPilotResult,
} from '@/lib/assessment/pilot/selectors';
import {
  moveAttemptToIndex,
  toggleAttemptFlag,
} from '@/lib/assessment/session/attemptActions';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import {
  clearAttemptDraftResponse,
  updateAttemptDraftResponse,
} from '@/lib/assessment/session/draftResponses';
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

const PILOT_REGISTRY_RESULT = buildDraftOnlyAqueousPilotRegistry();

type StoreTransactionValue<T> = {
  store: StoreV2;
  value: T;
};

export function useAssessmentPilot({
  store,
  setStore,
  go,
}: {
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  const latestStoreRef = useRef(store);
  useEffect(() => {
    latestStoreRef.current = store;
  }, [store]);

  const registryResult = PILOT_REGISTRY_RESULT;
  const registry = registryResult.ok ? registryResult.value : undefined;

  const registryUnavailable = <T,>(): SessionResult<T> => sessionFailure(
    registryResult.ok
      ? sessionIssue('MALFORMED_QUESTION_BANK', 'Pilot registry is unavailable.')
      : registryResult.issues,
  );

  const transact = <T,>(
    operation: (latest: StoreV2) => SessionResult<StoreTransactionValue<T>>,
  ): SessionResult<T> => {
    const result = operation(latestStoreRef.current);
    if (!result.ok) return result;
    latestStoreRef.current = result.value.store;
    setStore(result.value.store);
    return sessionSuccess(result.value.value);
  };

  const activeAttemptResult = registry
    ? selectActiveAqueousPilotAttempt(store, registry)
    : registryUnavailable<AssessmentAttemptSnapshot | undefined>();
  const activeAttempt = activeAttemptResult.ok
    ? activeAttemptResult.value
    : undefined;
  const latestResult = registry
    ? selectLatestCompatibleAqueousPilotResult(store, registry)
    : undefined;

  const start = (restart = false): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const latestSelection = selectActiveAqueousPilotAttempt(
      latestStoreRef.current,
      registry,
    );
    if (!latestSelection.ok) return latestSelection;
    if (latestSelection.value && !restart) {
      go('assessment', latestSelection.value.id);
      return sessionSuccess(latestSelection.value);
    }

    const result = transact((latest) => {
      let baseStore = latest;
      if (latestSelection.value) {
        const removed = removeActiveAssessmentAttempt(
          baseStore,
          latestSelection.value.id,
        );
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
        gradingPolicy: AQUEOUS_PILOT_POLICY,
        initializeDraftResponses: true,
        allowedReviewStatuses: ['draft'],
      });
      if (!created.ok) return created;
      const inserted = putActiveAssessmentAttempt(
        baseStore,
        created.value.id,
        created.value,
      );
      return inserted.ok
        ? sessionSuccess({ store: inserted.value, value: created.value })
        : inserted;
    });
    if (result.ok) go('assessment', result.value.id);
    return result;
  };

  const updateStoredAttempt = (
    attemptId: string,
    update: (
      attempt: AssessmentAttemptSnapshot,
    ) => SessionResult<AssessmentAttemptSnapshot>,
  ): SessionResult<AssessmentAttemptSnapshot> => transact((latest) => {
    const current = getActiveAssessmentAttempt(latest, attemptId);
    if (!current.ok) return current;
    const compatible = registry
      ? validateAqueousPilotAttempt(current.value, registry)
      : registryUnavailable();
    if (!compatible.ok) return compatible;
    const updated = update(current.value);
    if (!updated.ok) return updated;
    const stored = putActiveAssessmentAttempt(
      latest,
      updated.value.id,
      updated.value,
    );
    return stored.ok
      ? sessionSuccess({ store: stored.value, value: updated.value })
      : stored;
  });

  const updateDraft = (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
    draft: AssessmentDraftResponse,
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    return updateStoredAttempt(attempt.id, (current) => updateAttemptDraftResponse({
      attempt: current,
      registry,
      questionId,
      draft,
    }));
  };

  const clearDraft = (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
  ): SessionResult<AssessmentAttemptSnapshot> => updateStoredAttempt(
    attempt.id,
    (current) => clearAttemptDraftResponse(current, questionId),
  );

  const moveTo = (
    attempt: AssessmentAttemptSnapshot,
    index: number,
  ): SessionResult<AssessmentAttemptSnapshot> => updateStoredAttempt(
    attempt.id,
    (current) => moveAttemptToIndex(current, index),
  );

  const toggleFlag = (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
  ): SessionResult<AssessmentAttemptSnapshot> => updateStoredAttempt(
    attempt.id,
    (current) => toggleAttemptFlag(current, questionId),
  );

  const discard = (attemptId: string): SessionResult<StoreV2> => transact(
    (latest) => {
      const removed = removeActiveAssessmentAttempt(latest, attemptId);
      return removed.ok
        ? sessionSuccess({ store: removed.value, value: removed.value })
        : removed;
    },
  );

  const submit = (
    attemptId: string,
  ): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return registryUnavailable();
    const result = transact((latest) => {
      const latestAttempt = getActiveAssessmentAttempt(latest, attemptId);
      if (!latestAttempt.ok) return latestAttempt;
      const compatible = validateAqueousPilotAttempt(
        latestAttempt.value,
        registry,
      );
      if (!compatible.ok) return compatible;
      const finalized = finalizeGradedAssessmentAttempt({
        attempt: latestAttempt.value,
        registry,
      });
      if (!finalized.ok) return sessionFailure(finalized.issues);
      const stored = finalizeAssessmentStore(
        latest,
        latestAttempt.value.id,
        finalized.value.result.id,
        finalized.value.result,
      );
      return stored.ok
        ? sessionSuccess({
          store: stored.value,
          value: finalized.value.result,
        })
        : stored;
    });
    if (result.ok) go('assessment-result', result.value.id);
    return result;
  };

  const getAttempt = (
    attemptId: string,
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const attempt = getActiveAssessmentAttempt(store, attemptId);
    if (!attempt.ok) return attempt;
    const compatible = validateAqueousPilotAttempt(attempt.value, registry);
    return compatible.ok ? sessionSuccess(attempt.value) : compatible;
  };

  const getResult = (
    resultId: string,
  ): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return registryUnavailable();
    const result = getAssessmentResult(store, resultId);
    if (!result.ok) return result;
    const compatible = validateAqueousPilotResult(result.value, registry);
    return compatible.ok ? sessionSuccess(result.value) : compatible;
  };

  return {
    registryResult,
    registry,
    activeAttemptResult,
    activeAttempt,
    latestResult,
    start,
    updateDraft,
    clearDraft,
    moveTo,
    toggleFlag,
    discard,
    submit,
    getAttempt,
    getResult,
  };
}
