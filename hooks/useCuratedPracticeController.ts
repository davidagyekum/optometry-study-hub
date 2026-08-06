'use client';

import type { Dispatch, SetStateAction } from 'react';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import type {
  CuratedPracticeDefinition,
  CuratedPracticeRequest,
} from '@/lib/assessment/curated/definition';
import {
  ownsCuratedBlueprint,
  selectActiveCuratedAttempt,
  selectCuratedAttemptById,
  selectLatestCuratedResult,
} from '@/lib/assessment/curated/selectors';
import { moveAttemptToIndex, toggleAttemptFlag } from '@/lib/assessment/session/attemptActions';
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
import type { PracticeAnalyticsMetadata } from '@/lib/analytics/config';
import { trackPracticeEvent } from '@/lib/analytics/googleAnalytics';
import { useCuratedPractice } from '@/hooks/useCuratedPractice';
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

function practiceAnalyticsMetadata(
  snapshot: AssessmentAttemptSnapshot | AssessmentResultSnapshot,
): PracticeAnalyticsMetadata | undefined {
  const selection = snapshot.practiceSelection;
  if (!selection) return undefined;
  return {
    moduleId: snapshot.moduleId,
    practiceProfile: selection.profileId,
    practiceMode: selection.strategy,
    questionCount: snapshot.orderedQuestionIds.length,
  };
}

export function useCuratedPracticeController({
  definition,
  store,
  setStore,
  go,
}: {
  definition: CuratedPracticeDefinition;
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  const { latestStoreRef, transact } = useCuratedPractice({ store, setStore });
  const registryResult = definition.registryResult;
  const registry = registryResult.ok ? registryResult.value : undefined;
  const unavailable = <T,>(): SessionResult<T> => sessionFailure(
    registryResult.ok
      ? sessionIssue('MALFORMED_QUESTION_BANK', `${definition.summary.shortTitle} registry is unavailable.`)
      : registryResult.issues,
  );
  const activeAttemptSelection = registry
    ? selectActiveCuratedAttempt(definition, store, registry)
    : { candidates: [], issues: registryResult.ok ? [] : registryResult.issues };
  const latestResult = registry
    ? selectLatestCuratedResult(definition, store, registry)
    : undefined;
  const latestWrittenResult = registry && definition.writtenBlueprintId
    ? selectLatestCuratedResult(definition, store, registry, definition.writtenBlueprintId)
    : undefined;

  const replaceCandidates = (
    candidateIds: string[],
    request = definition.defaultRequest(),
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return unavailable();
    const result = transact((latest) => {
      const currentIds = Object.values(latest.assessment.activeAttempts)
        .filter((attempt) => ownsCuratedBlueprint(definition, attempt.blueprintId))
        .map((attempt) => attempt.id)
        .sort();
      const expectedIds = [...new Set(candidateIds)].sort();
      if (
        currentIds.length !== expectedIds.length
        || currentIds.some((id, index) => id !== expectedIds[index])
      ) {
        return sessionFailure(sessionIssue(
          currentIds.length > 1 ? 'PILOT_MULTIPLE_ACTIVE_ATTEMPTS' : 'PILOT_RESULT_INCOMPATIBLE',
          `The saved ${definition.summary.shortTitle} candidates changed. Review them before replacement.`,
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
        if (!ownsCuratedBlueprint(definition, candidate.blueprintId)) {
          return sessionFailure(sessionIssue(
            'PILOT_BLUEPRINT_MISMATCH',
            `${definition.summary.shortTitle} cannot replace an unrelated assessment.`,
            { attemptId: id },
          ));
        }
        const removed = removeActiveAssessmentAttempt(baseStore, id);
        if (!removed.ok) return removed;
        baseStore = removed.value;
      }
      const created = definition.createAttempt(request, baseStore, registry);
      if (!created.ok) return created;
      const inserted = putActiveAssessmentAttempt(baseStore, created.value.id, created.value);
      return inserted.ok
        ? sessionSuccess({ store: inserted.value, value: created.value })
        : inserted;
    });
    if (result.ok) {
      const metadata = practiceAnalyticsMetadata(result.value);
      if (metadata) trackPracticeEvent('practice_start', metadata);
      go('assessment', result.value.id);
    }
    return result;
  };

  const discardCandidates = (candidateIds: string[]): SessionResult<StoreV2> => transact(
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
        if (!ownsCuratedBlueprint(definition, candidate.blueprintId)) {
          return sessionFailure(sessionIssue(
            'PILOT_BLUEPRINT_MISMATCH',
            `${definition.summary.shortTitle} cannot discard an unrelated assessment.`,
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

  const start = (
    requestOrRestart: CuratedPracticeRequest | boolean = definition.defaultRequest(),
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return unavailable();
    const request = typeof requestOrRestart === 'boolean'
      ? definition.defaultRequest()
      : requestOrRestart;
    const selection = selectActiveCuratedAttempt(definition, latestStoreRef.current, registry);
    if (requestOrRestart === true && selection.candidates.length) {
      return replaceCandidates(selection.candidates.map((candidate) => candidate.id), request);
    }
    if (selection.issues.length) return sessionFailure(selection.issues);
    if (selection.compatibleAttempt) {
      go('assessment', selection.compatibleAttempt.id);
      return sessionSuccess(selection.compatibleAttempt);
    }
    let createdAttemptId: string | undefined;
    const result = transact((latest) => {
      const reselected = selectActiveCuratedAttempt(definition, latest, registry);
      if (reselected.issues.length) return sessionFailure(reselected.issues);
      if (reselected.compatibleAttempt) {
        return sessionSuccess({ store: latest, value: reselected.compatibleAttempt });
      }
      const created = definition.createAttempt(request, latest, registry);
      if (!created.ok) return created;
      createdAttemptId = created.value.id;
      const inserted = putActiveAssessmentAttempt(latest, created.value.id, created.value);
      return inserted.ok
        ? sessionSuccess({ store: inserted.value, value: created.value })
        : inserted;
    });
    if (result.ok) {
      if (result.value.id === createdAttemptId) {
        const metadata = practiceAnalyticsMetadata(result.value);
        if (metadata) trackPracticeEvent('practice_start', metadata);
      }
      go('assessment', result.value.id);
    }
    return result;
  };

  const updateStoredAttempt = (
    attemptId: string,
    update: (attempt: AssessmentAttemptSnapshot) => SessionResult<AssessmentAttemptSnapshot>,
  ): SessionResult<AssessmentAttemptSnapshot> => transact((latest) => {
    const current = getActiveAssessmentAttempt(latest, attemptId);
    if (!current.ok) return current;
    const compatible = definition.validateAttempt(current.value, registry!);
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
  ) => registry
    ? updateStoredAttempt(attempt.id, (current) => updateAttemptDraftResponse({
      attempt: current,
      registry,
      questionId,
      draft,
    }))
    : unavailable<AssessmentAttemptSnapshot>();
  const clearDraft = (attempt: AssessmentAttemptSnapshot, questionId: string) => (
    updateStoredAttempt(attempt.id, (current) => clearAttemptDraftResponse(current, questionId))
  );
  const moveTo = (attempt: AssessmentAttemptSnapshot, index: number) => (
    updateStoredAttempt(attempt.id, (current) => moveAttemptToIndex(current, index))
  );
  const toggleFlag = (attempt: AssessmentAttemptSnapshot, questionId: string) => (
    updateStoredAttempt(attempt.id, (current) => toggleAttemptFlag(current, questionId))
  );
  const discard = (attemptId: string) => discardCandidates([attemptId]);

  const submit = (attemptId: string): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return unavailable();
    const result = transact((latest) => {
      const latestAttempt = getActiveAssessmentAttempt(latest, attemptId);
      if (!latestAttempt.ok) return latestAttempt;
      const compatible = definition.validateAttempt(latestAttempt.value, registry);
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
        { historyPolicy: definition.historyPolicy(latestAttempt.value), registry },
      );
      return stored.ok
        ? sessionSuccess({ store: stored.value, value: finalized.value.result })
        : stored;
    });
    if (result.ok) {
      const metadata = practiceAnalyticsMetadata(result.value);
      if (metadata) trackPracticeEvent('practice_submit', metadata);
      go('assessment-result', result.value.id);
    }
    return result;
  };

  const getAttemptSelection = (attemptId: string) => registry
    ? selectCuratedAttemptById(definition, store, registry, attemptId)
    : { candidates: [], issues: registryResult.ok ? [] : registryResult.issues };
  const getResult = (resultId: string): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return unavailable();
    const result = getAssessmentResult(store, resultId);
    if (!result.ok) return result;
    const compatible = definition.validateResult(result.value, registry);
    return compatible.ok ? sessionSuccess(result.value) : compatible;
  };

  return {
    registryResult,
    registry,
    activeAttemptSelection,
    latestResult,
    latestWrittenResult,
    availability: definition.availability(store),
    start,
    replaceCandidates,
    discardCandidates,
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
