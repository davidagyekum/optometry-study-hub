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
  selectAqueousPilotAttemptById,
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

  const createPilotAttempt = () => registry
    ? createAssessmentAttempt({
      registry,
      questionIds: [...AQUEOUS_PILOT_QUESTION_IDS],
      mode: 'study',
      courseId: AQUEOUS_PILOT_COURSE_ID,
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
    })
    : registryUnavailable<AssessmentAttemptSnapshot>();

  const activeAttemptSelection = registry
    ? selectActiveAqueousPilotAttempt(store, registry)
    : { candidates: [], issues: registryResult.ok ? [] : registryResult.issues };
  const activeAttempt = activeAttemptSelection.compatibleAttempt;
  const latestResult = registry
    ? selectLatestCompatibleAqueousPilotResult(store, registry)
    : undefined;

  const replacePilotCandidates = (
    candidateIds: string[],
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const result = transact((latest) => {
      const currentPilotIds = Object.values(latest.assessment.activeAttempts)
        .filter((candidate) => candidate.blueprintId === AQUEOUS_PILOT_BLUEPRINT_ID)
        .map((candidate) => candidate.id)
        .sort();
      const expectedIds = [...new Set(candidateIds)].sort();
      if (
        currentPilotIds.length !== expectedIds.length
        || currentPilotIds.some((id, index) => id !== expectedIds[index])
      ) {
        return sessionFailure(sessionIssue(
          currentPilotIds.length > 1
            ? 'PILOT_MULTIPLE_ACTIVE_ATTEMPTS'
            : 'PILOT_RESULT_INCOMPATIBLE',
          'The saved pilot candidates changed. Review them before replacing the pilot.',
        ));
      }

      let baseStore = latest;
      for (const id of expectedIds) {
        const candidate = baseStore.assessment.activeAttempts[id];
        if (!candidate) {
          return sessionFailure(sessionIssue(
            'ATTEMPT_NOT_FOUND',
            `Assessment attempt "${id}" was not found.`,
            { attemptId: id },
          ));
        }
        if (candidate.blueprintId !== AQUEOUS_PILOT_BLUEPRINT_ID) {
          return sessionFailure(sessionIssue(
            'PILOT_BLUEPRINT_MISMATCH',
            'An unrelated assessment cannot be replaced by the pilot route.',
            { attemptId: id },
          ));
        }
        const removed = removeActiveAssessmentAttempt(baseStore, id);
        if (!removed.ok) return removed;
        baseStore = removed.value;
      }

      const created = createPilotAttempt();
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

  const discardPilotCandidates = (candidateIds: string[]): SessionResult<StoreV2> => transact(
    (latest) => {
      let nextStore = latest;
      for (const id of [...new Set(candidateIds)]) {
        const candidate = nextStore.assessment.activeAttempts[id];
        if (!candidate) {
          return sessionFailure(sessionIssue(
            'ATTEMPT_NOT_FOUND',
            `Assessment attempt "${id}" was not found.`,
            { attemptId: id },
          ));
        }
        if (candidate.blueprintId !== AQUEOUS_PILOT_BLUEPRINT_ID) {
          return sessionFailure(sessionIssue(
            'PILOT_BLUEPRINT_MISMATCH',
            'The pilot route cannot discard an unrelated assessment.',
            { attemptId: id },
          ));
        }
        const removed = removeActiveAssessmentAttempt(nextStore, id);
        if (!removed.ok) return removed;
        nextStore = removed.value;
      }
      return sessionSuccess({ store: nextStore, value: nextStore });
    },
  );

  const start = (restart = false): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const latestSelection = selectActiveAqueousPilotAttempt(
      latestStoreRef.current,
      registry,
    );
    if (latestSelection.issues.length > 0) {
      return sessionFailure(latestSelection.issues);
    }
    if (latestSelection.compatibleAttempt && !restart) {
      go('assessment', latestSelection.compatibleAttempt.id);
      return sessionSuccess(latestSelection.compatibleAttempt);
    }
    if (restart && latestSelection.compatibleAttempt) {
      return replacePilotCandidates([latestSelection.compatibleAttempt.id]);
    }

    const result = transact((latest) => {
      const reselected = selectActiveAqueousPilotAttempt(latest, registry);
      if (reselected.issues.length > 0) return sessionFailure(reselected.issues);
      if (reselected.compatibleAttempt) {
        return sessionSuccess({ store: latest, value: reselected.compatibleAttempt });
      }
      const created = createPilotAttempt();
      if (!created.ok) return created;
      const inserted = putActiveAssessmentAttempt(
        latest,
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
    const stored = putActiveAssessmentAttempt(latest, updated.value.id, updated.value);
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

  const discard = (attemptId: string): SessionResult<StoreV2> => (
    discardPilotCandidates([attemptId])
  );

  const submit = (
    attemptId: string,
  ): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return registryUnavailable();
    const result = transact((latest) => {
      const latestAttempt = getActiveAssessmentAttempt(latest, attemptId);
      if (!latestAttempt.ok) return latestAttempt;
      const compatible = validateAqueousPilotAttempt(latestAttempt.value, registry);
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
        ? sessionSuccess({ store: stored.value, value: finalized.value.result })
        : stored;
    });
    if (result.ok) go('assessment-result', result.value.id);
    return result;
  };

  const getAttemptSelection = (attemptId: string) => registry
    ? selectAqueousPilotAttemptById(store, registry, attemptId)
    : { candidates: [], issues: registryResult.ok ? [] : registryResult.issues };

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
    activeAttemptSelection,
    activeAttempt,
    latestResult,
    start,
    replacePilotCandidates,
    discardPilotCandidates,
    updateDraft,
    clearDraft,
    moveTo,
    toggleFlag,
    discard,
    submit,
    getAttemptSelection,
    getResult,
  };
}
