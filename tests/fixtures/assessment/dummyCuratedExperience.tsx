import type { Dispatch, SetStateAction } from 'react';
import { CuratedDefinitionRouter } from '@/components/assessment/curated/CuratedDefinitionRouter';
import {
  CuratedMasteryProgressPanel,
  emptyCuratedMasterySummary,
} from '@/components/progress/CuratedMasteryProgressPanel';
import type {
  CuratedPracticeDefinition,
  CuratedPracticeRequest,
} from '@/lib/assessment/curated/definition';
import type {
  CuratedExperienceAdapter,
  CuratedExperienceSummary,
  CuratedProgressContribution,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { resolveAssessmentAttempt } from '@/lib/assessment/session/resolveAttempt';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';
import { sessionFailure, sessionIssue } from '@/lib/assessment/session/errors';
import { aqueousVitreousPilotBank } from '@/content/question-bank/pilot/bank';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { ClientView } from '@/lib/navigation/clientRoute';
import type { PracticeSelectionSnapshot } from '@/lib/assessment/practice/types';
import type { QuestionBank } from '@/lib/assessment/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export const dummyCuratedSummary: CuratedExperienceSummary = {
  experienceId: 'dummy-curated',
  courseId: 'dummy-course',
  moduleId: 'dummy-module',
  title: 'Dummy curated practice',
  shortTitle: 'Dummy practice',
  courseCode: 'TEST 000',
  routeSegment: 'dummy-curated',
  blueprintIds: ['dummy-automatic-v1', 'dummy-written-v1'],
  statusLabel: 'Test-only curated practice',
  enabled: true,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: false,
  studyEntryTitle: 'Dummy practice entry',
  studyEntryDescription: 'Test-only copy with no educational content.',
  documentTitles: {
    landing: 'Dummy Curated Practice',
    session: 'Dummy Practice Session',
    result: 'Dummy Practice Result',
    unavailable: 'Dummy Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Dummy release status',
    title: 'Test-only status',
    lines: ['Synthetic fixture.', 'Not part of the production registry.'],
  },
};

function DummyStatus({ compact = false }: { compact?: boolean }) {
  return <aside aria-label="Dummy release status">{compact ? 'Synthetic fixture' : 'Synthetic test practice'}</aside>;
}

function dummyBank(): QuestionBank {
  const source = structuredClone(aqueousVitreousPilotBank);
  const question = source.questions.find((candidate) => candidate.format === 'single_best_answer');
  if (!question) throw new Error('Synthetic fixture requires a single-best-answer question.');
  question.courseId = dummyCuratedSummary.courseId;
  question.moduleId = dummyCuratedSummary.moduleId;
  source.id = 'dummy-curated-bank';
  source.title = 'Synthetic dummy curated bank';
  source.courseIds = [dummyCuratedSummary.courseId];
  source.questions = [question];
  source.objectives.forEach((objective) => {
    objective.courseId = dummyCuratedSummary.courseId;
    objective.moduleId = dummyCuratedSummary.moduleId;
  });
  return source;
}

const registryResult = buildQuestionRegistry({
  banks: [dummyBank()],
  allowedReviewStatuses: ['draft'],
});

function defaultRequest(): CuratedPracticeRequest {
  return { profileId: 'full', strategy: 'mixed', requestedCount: 1 };
}

export const dummyCuratedDefinition: CuratedPracticeDefinition = {
  summary: dummyCuratedSummary,
  automaticBlueprintId: 'dummy-automatic-v1',
  registryResult,
  learner: {
    labels: {
      'av-media-chambers': 'Synthetic section',
      single_best_answer: 'Single best answer',
      foundation: 'Foundation',
      full: 'Full practice',
    },
    sectionIds: ['av-media-chambers'],
    automaticFormats: ['single_best_answer'],
    difficulties: ['foundation', 'intermediate', 'advanced'],
    questionPoolSize: 1,
    scoredFormatCount: 1,
    fullQuestionCount: 1,
    quickQuestionCount: 1,
    standardQuestionCount: 1,
    targetedQuestionCount: 1,
    customMinimumCount: 1,
    customMaximumCount: 1,
    landingHeading: 'Dummy curated practice',
    landingDescription: 'Choose a synthetic practice session.',
    fullContractDescription: 'This fixture proves the generic lifecycle.',
    notesLabel: 'Dummy module notes',
    statusComponent: DummyStatus,
  },
  defaultRequest,
  replacementRequest: defaultRequest,
  createAttempt: (
    request: CuratedPracticeRequest,
    _store: StoreV2,
    registry,
  ) => {
    const questionIds = registry.questionIds().slice(0, request.requestedCount ?? 1);
    const selection: PracticeSelectionSnapshot = {
      schemaVersion: 1,
      blueprintId: 'dummy-automatic-v1',
      practiceFamilyId: 'dummy-practice-family',
      profileId: request.profileId,
      strategy: request.strategy ?? 'mixed',
      requestedCount: questionIds.length,
      sectionIds: ['av-media-chambers'],
      formats: ['single_best_answer'],
      difficulties: ['foundation', 'intermediate', 'advanced'],
      seed: request.seed ?? 'dummy-seed',
      resultMode: 'automatic',
      historyPolicy: 'scored',
    };
    return createAssessmentAttempt({
      registry,
      questionIds,
      mode: 'study',
      courseId: dummyCuratedSummary.courseId,
      moduleId: dummyCuratedSummary.moduleId,
      blueprintId: 'dummy-automatic-v1',
      practiceSelection: selection,
      gradingPolicy: { id: 'diagnostic', version: 1 },
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
      random: () => 0.25,
      idFactory: () => 'dummy-attempt',
      now: () => new Date('2026-07-29T09:00:00.000Z'),
    });
  },
  validateAttempt: (attempt, registry) => (
    attempt.blueprintId !== 'dummy-automatic-v1'
      ? sessionFailure(sessionIssue('PILOT_BLUEPRINT_MISMATCH', 'Synthetic blueprint mismatch.'))
      : resolveAssessmentAttempt(attempt, registry)
  ),
  validateResult: (result, registry) => (
    result.blueprintId !== 'dummy-automatic-v1'
      ? sessionFailure(sessionIssue('PILOT_BLUEPRINT_MISMATCH', 'Synthetic result blueprint mismatch.'))
      : gradeAssessmentResult({ result, registry })
  ),
  historyPolicy: () => 'scored',
  availability: () => ({ unseen: 1, missed: 0, weakTopics: 0, challenge: 0 }),
};

export function DummyPracticeRouter({
  view,
  resourceId,
  store,
  setStore,
  go,
}: {
  view: ClientView;
  resourceId: string;
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  return (
    <CuratedDefinitionRouter
      definition={dummyCuratedDefinition}
      go={go}
      resourceId={resourceId}
      setStore={setStore}
      store={store}
      view={view}
    />
  );
}

export function getDummyProgressContribution(store: StoreV2): CuratedProgressContribution {
  const attempt = Object.values(store.assessment.activeAttempts).find(
    (candidate) => candidate.blueprintId === 'dummy-automatic-v1',
  );
  const result = Object.values(store.assessment.results).find(
    (candidate) => candidate.blueprintId === 'dummy-automatic-v1',
  );
  return {
    experienceId: dummyCuratedSummary.experienceId,
    moduleId: dummyCuratedSummary.moduleId,
    recommendationCandidates: attempt || result ? [{
      id: 'dummy-next-step',
      title: 'Continue dummy practice',
      reason: 'Synthetic evidence is available.',
      priority: 5,
      moduleId: dummyCuratedSummary.moduleId,
      destination: { view: 'practice', moduleId: dummyCuratedSummary.routeSegment },
    }] : [],
    activity: result ? [{
      id: `dummy-completed:${result.id}`,
      kind: 'curated-completed',
      moduleId: dummyCuratedSummary.moduleId,
      timestamp: result.submittedAt,
      label: 'Dummy practice completed',
      actionLabel: 'Review result',
      destination: { view: 'assessment-result', moduleId: result.id },
    }] : [],
    hasStoredData: Boolean(attempt || result),
    integrityOmissionCount: 0,
  };
}

export function DummyProgressPanel({
  store,
  go,
  variant,
}: CuratedProgressPanelProps) {
  const contribution = getDummyProgressContribution(store);
  const summary = emptyCuratedMasterySummary();
  summary.eligibleAutomaticQuestionTotal = 1;
  summary.compatibleScoredResultCount = Object.values(
    store.assessment.results,
  ).filter((result) => result.blueprintId === 'dummy-automatic-v1').length;
  summary.recentActivity = contribution.activity;
  return (
    <CuratedMasteryProgressPanel
      Status={DummyStatus}
      experience={dummyCuratedSummary}
      go={go}
      summaryResult={{ ok: true, summary }}
      variant={variant}
    />
  );
}

export function makeDummyCuratedExperience({
  enabled = true,
  onPracticeLoad,
  onProgressLoad,
  practiceLoader,
  progressLoader,
}: {
  enabled?: boolean;
  onPracticeLoad?: () => void;
  onProgressLoad?: () => void;
  practiceLoader?: CuratedExperienceAdapter['loadPracticeModule'];
  progressLoader?: NonNullable<CuratedExperienceAdapter['loadProgressModule']>;
} = {}): CuratedExperienceAdapter {
  return {
    summary: { ...dummyCuratedSummary, enabled },
    loadPracticeModule: practiceLoader ?? (async () => {
      onPracticeLoad?.();
      return { PracticeRouter: DummyPracticeRouter };
    }),
    loadProgressModule: progressLoader ?? (async () => {
      onProgressLoad?.();
      return {
        ProgressPanel: DummyProgressPanel,
        getContribution: getDummyProgressContribution,
      };
    }),
  };
}
