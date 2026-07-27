'use client';

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  assembleHvpCuratedPractice,
  createHvpSeededRandom,
  HVP_SECTION_FORMAT_ALLOCATION,
} from '@/lib/assessment/hvp/assembler';
import {
  validateHvpCuratedAttempt,
  validateHvpCuratedResult,
} from '@/lib/assessment/hvp/compatibility';
import {
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
} from '@/lib/assessment/hvp/config';
import {
  createHvpPracticeSelection,
  createHvpWrittenSelection,
  HVP_AUTOMATIC_FORMATS,
  HVP_DIFFICULTIES,
  HVP_SECTIONS,
  HVP_WRITTEN_BLUEPRINT_ID,
  hvpCuratedPracticeBlueprint,
  hvpWrittenPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import {
  isHvpPracticeBlueprintId,
  selectActiveHvpAttempt,
  selectHvpAttemptById,
  selectLatestCompatibleHvpResult,
} from '@/lib/assessment/hvp/selectors';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import {
  challengeQuestionIds,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
} from '@/lib/assessment/practice/history';
import type {
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type {
  Difficulty,
  QuestionFormat,
} from '@/lib/assessment/types';
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

const HVP_REGISTRY_RESULT = buildDraftOnlyHvpRegistry();

type TransactionValue<T> = { store: StoreV2; value: T };

export type HvpPracticeRequest = {
  profileId: 'quick' | 'standard' | 'full' | 'targeted' | 'custom' | 'written';
  strategy?: PracticeStrategy;
  requestedCount?: number;
  sectionIds?: string[];
  formats?: QuestionFormat[];
  difficulties?: Difficulty[];
  seed?: string;
};

function runtimeSeed(): string {
  return globalThis.crypto.randomUUID();
}

function defaultRequest(): HvpPracticeRequest {
  return { profileId: 'full', strategy: 'mixed', requestedCount: 50 };
}

export function useHvpCuratedPractice({
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

  const registryResult = HVP_REGISTRY_RESULT;
  const registry = registryResult.ok ? registryResult.value : undefined;
  const registryUnavailable = <T,>(): SessionResult<T> => sessionFailure(
    registryResult.ok
      ? sessionIssue('MALFORMED_QUESTION_BANK', 'HVP registry is unavailable.')
      : registryResult.issues,
  );
  const transact = <T,>(
    operation: (latest: StoreV2) => SessionResult<TransactionValue<T>>,
  ): SessionResult<T> => {
    const result = operation(latestStoreRef.current);
    if (!result.ok) return result;
    latestStoreRef.current = result.value.store;
    setStore(result.value.store);
    return sessionSuccess(result.value.value);
  };

  const createPracticeAttempt = (
    request: HvpPracticeRequest = defaultRequest(),
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const seed = request.seed ?? runtimeSeed();
    const written = request.profileId === 'written';
    let selection: PracticeSelectionSnapshot;
    let questionIds: string[];
    if (written) {
      selection = createHvpWrittenSelection(seed);
      questionIds = humanVisualPerceptionCandidateBank.questions
        .filter((question) => question.format === 'open_response')
        .map((question) => question.id)
        .sort();
    } else {
      const profile = hvpCuratedPracticeBlueprint.profiles.find(
        (candidate) => candidate.id === request.profileId,
      );
      const requestedCount = request.requestedCount ?? profile?.count ?? 10;
      selection = createHvpPracticeSelection({
        profileId: request.profileId,
        strategy: request.strategy ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
        requestedCount,
        sectionIds: request.sectionIds ?? HVP_SECTIONS,
        formats: request.formats ?? HVP_AUTOMATIC_FORMATS,
        difficulties: request.difficulties ?? HVP_DIFFICULTIES,
        seed,
      });
      const isPreservedFull = selection.profileId === 'full'
        && selection.strategy === 'mixed'
        && selection.sectionIds.length === HVP_SECTIONS.length
        && selection.formats.length === HVP_AUTOMATIC_FORMATS.length
        && selection.difficulties.length === HVP_DIFFICULTIES.length;
      if (isPreservedFull) {
        const assembly = assembleHvpCuratedPractice({
          questions: humanVisualPerceptionCandidateBank.questions,
          seed,
          allowDifficultyRelaxation: false,
        });
        if (!assembly.ok) {
          return sessionFailure(assembly.issues.map((issue) => sessionIssue(
            'PILOT_QUESTION_SET_MISMATCH',
            `[${issue.code}] ${issue.message}`,
            { path: 'questionIds' },
          )));
        }
        questionIds = assembly.value.questionIds;
      } else {
        const assembly = assemblePractice({
          questions: humanVisualPerceptionCandidateBank.questions,
          blueprint: hvpCuratedPracticeBlueprint,
          selection,
          history: latestStoreRef.current.assessment.questionHistory,
          sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
        });
        if (!assembly.ok) {
          return sessionFailure(assembly.issues.map((issue) => sessionIssue(
            'PILOT_QUESTION_SET_MISMATCH',
            `[${issue.code}] ${issue.message}`,
            { path: issue.path ?? 'practiceSelection' },
          )));
        }
        questionIds = assembly.value.questionIds;
      }
    }
    const blueprint = written ? hvpWrittenPracticeBlueprint : hvpCuratedPracticeBlueprint;
    return createAssessmentAttempt({
      registry,
      questionIds,
      mode: blueprint.defaultMode,
      courseId: HVP_CURATED_COURSE_ID,
      moduleId: HVP_CURATED_MODULE_ID,
      blueprintId: blueprint.id,
      practiceSelection: selection,
      gradingPolicy: HVP_CURATED_POLICY,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
      random: createHvpSeededRandom(seed),
    });
  };

  const activeAttemptSelection = registry
    ? selectActiveHvpAttempt(store, registry)
    : { candidates: [], issues: registryResult.ok ? [] : registryResult.issues };
  const latestResult = registry
    ? selectLatestCompatibleHvpResult(store, registry)
    : undefined;
  const latestWrittenResult = registry
    ? selectLatestCompatibleHvpResult(store, registry, HVP_WRITTEN_BLUEPRINT_ID)
    : undefined;

  const replaceCandidates = (
    candidateIds: string[],
    request: HvpPracticeRequest = defaultRequest(),
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const result = transact((latest) => {
      const currentIds = Object.values(latest.assessment.activeAttempts)
        .filter((attempt) => isHvpPracticeBlueprintId(attempt.blueprintId))
        .map((attempt) => attempt.id)
        .sort();
      const expectedIds = [...new Set(candidateIds)].sort();
      if (
        currentIds.length !== expectedIds.length
        || currentIds.some((id, index) => id !== expectedIds[index])
      ) {
        return sessionFailure(sessionIssue(
          currentIds.length > 1 ? 'PILOT_MULTIPLE_ACTIVE_ATTEMPTS' : 'PILOT_RESULT_INCOMPATIBLE',
          'The saved HVP practice candidates changed. Review them before replacement.',
        ));
      }
      let baseStore = latest;
      for (const id of expectedIds) {
        const candidate = baseStore.assessment.activeAttempts[id];
        if (!candidate) return sessionFailure(sessionIssue('ATTEMPT_NOT_FOUND', `Assessment attempt "${id}" was not found.`, { attemptId: id }));
        if (!isHvpPracticeBlueprintId(candidate.blueprintId)) {
          return sessionFailure(sessionIssue('PILOT_BLUEPRINT_MISMATCH', 'HVP practice cannot replace an unrelated assessment.', { attemptId: id }));
        }
        const removed = removeActiveAssessmentAttempt(baseStore, id);
        if (!removed.ok) return removed;
        baseStore = removed.value;
      }
      const created = createPracticeAttempt(request);
      if (!created.ok) return created;
      const inserted = putActiveAssessmentAttempt(baseStore, created.value.id, created.value);
      return inserted.ok ? sessionSuccess({ store: inserted.value, value: created.value }) : inserted;
    });
    if (result.ok) go('assessment', result.value.id);
    return result;
  };

  const discardCandidates = (candidateIds: string[]): SessionResult<StoreV2> => transact(
    (latest) => {
      let nextStore = latest;
      for (const id of [...new Set(candidateIds)]) {
        const candidate = nextStore.assessment.activeAttempts[id];
        if (!candidate) return sessionFailure(sessionIssue('ATTEMPT_NOT_FOUND', `Assessment attempt "${id}" was not found.`, { attemptId: id }));
        if (!isHvpPracticeBlueprintId(candidate.blueprintId)) {
          return sessionFailure(sessionIssue('PILOT_BLUEPRINT_MISMATCH', 'HVP practice cannot discard an unrelated assessment.', { attemptId: id }));
        }
        const removed = removeActiveAssessmentAttempt(nextStore, id);
        if (!removed.ok) return removed;
        nextStore = removed.value;
      }
      return sessionSuccess({ store: nextStore, value: nextStore });
    },
  );

  const start = (
    requestOrRestart: HvpPracticeRequest | boolean = defaultRequest(),
  ): SessionResult<AssessmentAttemptSnapshot> => {
    if (!registry) return registryUnavailable();
    const request = typeof requestOrRestart === 'boolean' ? defaultRequest() : requestOrRestart;
    const selection = selectActiveHvpAttempt(latestStoreRef.current, registry);
    if (requestOrRestart === true && selection.candidates.length > 0) {
      return replaceCandidates(selection.candidates.map((candidate) => candidate.id), request);
    }
    if (selection.issues.length) return sessionFailure(selection.issues);
    if (selection.compatibleAttempt) {
      go('assessment', selection.compatibleAttempt.id);
      return sessionSuccess(selection.compatibleAttempt);
    }
    const result = transact((latest) => {
      const reselected = selectActiveHvpAttempt(latest, registry);
      if (reselected.issues.length) return sessionFailure(reselected.issues);
      if (reselected.compatibleAttempt) return sessionSuccess({ store: latest, value: reselected.compatibleAttempt });
      const created = createPracticeAttempt(request);
      if (!created.ok) return created;
      const inserted = putActiveAssessmentAttempt(latest, created.value.id, created.value);
      return inserted.ok ? sessionSuccess({ store: inserted.value, value: created.value }) : inserted;
    });
    if (result.ok) go('assessment', result.value.id);
    return result;
  };

  const updateStoredAttempt = (
    attemptId: string,
    update: (attempt: AssessmentAttemptSnapshot) => SessionResult<AssessmentAttemptSnapshot>,
  ): SessionResult<AssessmentAttemptSnapshot> => transact((latest) => {
    const current = getActiveAssessmentAttempt(latest, attemptId);
    if (!current.ok) return current;
    const compatible = registry ? validateHvpCuratedAttempt(current.value, registry) : registryUnavailable();
    if (!compatible.ok) return compatible;
    const updated = update(current.value);
    if (!updated.ok) return updated;
    const stored = putActiveAssessmentAttempt(latest, updated.value.id, updated.value);
    return stored.ok ? sessionSuccess({ store: stored.value, value: updated.value }) : stored;
  });

  const updateDraft = (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
    draft: AssessmentDraftResponse,
  ) => registry
    ? updateStoredAttempt(attempt.id, (current) => updateAttemptDraftResponse({ attempt: current, registry, questionId, draft }))
    : registryUnavailable<AssessmentAttemptSnapshot>();
  const clearDraft = (attempt: AssessmentAttemptSnapshot, questionId: string) => updateStoredAttempt(
    attempt.id,
    (current) => clearAttemptDraftResponse(current, questionId),
  );
  const moveTo = (attempt: AssessmentAttemptSnapshot, index: number) => updateStoredAttempt(
    attempt.id,
    (current) => moveAttemptToIndex(current, index),
  );
  const toggleFlag = (attempt: AssessmentAttemptSnapshot, questionId: string) => updateStoredAttempt(
    attempt.id,
    (current) => toggleAttemptFlag(current, questionId),
  );
  const discard = (attemptId: string) => discardCandidates([attemptId]);

  const submit = (attemptId: string): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return registryUnavailable();
    const result = transact((latest) => {
      const latestAttempt = getActiveAssessmentAttempt(latest, attemptId);
      if (!latestAttempt.ok) return latestAttempt;
      const compatible = validateHvpCuratedAttempt(latestAttempt.value, registry);
      if (!compatible.ok) return compatible;
      const finalized = finalizeGradedAssessmentAttempt({ attempt: latestAttempt.value, registry });
      if (!finalized.ok) return sessionFailure(finalized.issues);
      const historyPolicy = latestAttempt.value.blueprintId === HVP_WRITTEN_BLUEPRINT_ID
        ? hvpWrittenPracticeBlueprint.historyPolicy
        : hvpCuratedPracticeBlueprint.historyPolicy;
      const stored = finalizeAssessmentStore(
        latest,
        latestAttempt.value.id,
        finalized.value.result.id,
        finalized.value.result,
        { historyPolicy },
      );
      return stored.ok
        ? sessionSuccess({ store: stored.value, value: finalized.value.result })
        : stored;
    });
    if (result.ok) go('assessment-result', result.value.id);
    return result;
  };

  const getAttemptSelection = (attemptId: string) => registry
    ? selectHvpAttemptById(store, registry, attemptId)
    : { candidates: [], issues: registryResult.ok ? [] : registryResult.issues };
  const getResult = (resultId: string): SessionResult<AssessmentResultSnapshot> => {
    if (!registry) return registryUnavailable();
    const result = getAssessmentResult(store, resultId);
    if (!result.ok) return result;
    const compatible = validateHvpCuratedResult(result.value, registry);
    return compatible.ok ? sessionSuccess(result.value) : compatible;
  };

  const automaticQuestions = humanVisualPerceptionCandidateBank.questions.filter(
    (question) => question.format !== 'open_response',
  );
  const history = store.assessment.questionHistory;
  const availability = {
    unseen: unseenQuestionIds(automaticQuestions, history).length,
    missed: retryMissedQuestionIds(automaticQuestions, history).length,
    weakTopics: weakTopicQuestionIds(automaticQuestions, history).length,
    challenge: challengeQuestionIds(automaticQuestions).length,
  };

  return {
    registryResult,
    registry,
    activeAttemptSelection,
    latestResult,
    latestWrittenResult,
    availability,
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
