import { HvpReleaseStatus } from '@/components/assessment/hvp/HvpReleaseStatus';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { hvpCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
import type {
  CuratedPracticeDefinition,
  CuratedPracticeRequest,
} from '@/lib/assessment/curated/definition';
import { assembleHvpCuratedPractice, createHvpSeededRandom, HVP_SECTION_FORMAT_ALLOCATION } from '@/lib/assessment/hvp/assembler';
import { validateHvpCuratedAttempt, validateHvpCuratedResult } from '@/lib/assessment/hvp/compatibility';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
  HVP_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/hvp/config';
import {
  createHvpPracticeSelection,
  createHvpWrittenSelection,
  HVP_AUTOMATIC_FORMATS,
  HVP_DIFFICULTIES,
  HVP_SECTIONS,
  hvpCuratedPracticeBlueprint,
  hvpWrittenPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import { withStrategyEvidence } from '@/lib/assessment/practice/evidence';
import {
  challengeQuestionIds,
  familyConstrainedCount,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
} from '@/lib/assessment/practice/history';
import { validatePracticeSelection } from '@/lib/assessment/practice/blueprint';
import type { PracticeSelectionSnapshot } from '@/lib/assessment/practice/types';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { sessionFailure, sessionIssue } from '@/lib/assessment/session/errors';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';
import type { AssessmentAttemptSnapshot, StoreV2 } from '@/lib/storage/schemas';

const registryResult = buildDraftOnlyHvpRegistry();

const labels: Record<string, string> = {
  'hvp-foundations': 'Foundations',
  'hvp-retina': 'Retina',
  'hvp-lgn': 'LGN and V1',
  'hvp-extrastriate': 'Extrastriate',
  single_best_answer: 'Single best answer',
  true_false: 'True / False',
  multiple_response: 'Multiple response',
  matching: 'Matching',
  extended_matching: 'Extended matching',
  ordering: 'Ordering',
  image_hotspot: 'Image hotspot',
  image_label: 'Image label',
  short_answer: 'Short answer',
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  quick: 'Quick practice',
  standard: 'Standard practice',
  full: 'Full practice',
  targeted: 'Targeted practice',
  custom: 'Custom practice',
  written: 'Written practice',
};

function runtimeSeed(): string {
  return globalThis.crypto.randomUUID();
}

function defaultRequest(): CuratedPracticeRequest {
  return { profileId: 'full', strategy: 'mixed', requestedCount: 50 };
}

function createAttempt(
  request: CuratedPracticeRequest,
  store: StoreV2,
  registry: QuestionRegistry,
): SessionResult<AssessmentAttemptSnapshot> {
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
    selection = withStrategyEvidence(selection, questionIds);
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
    const validatedSelection = validatePracticeSelection(selection, hvpCuratedPracticeBlueprint);
    if (!validatedSelection.ok) {
      return sessionFailure(validatedSelection.issues.map((issue) => sessionIssue(
        'PILOT_QUESTION_SET_MISMATCH',
        `[${issue.code}] ${issue.message}`,
        { path: issue.path ?? 'practiceSelection' },
      )));
    }
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
        history: store.assessment.questionHistory,
      });
      if (!assembly.ok) {
        return sessionFailure(assembly.issues.map((issue) => sessionIssue(
          'PILOT_QUESTION_SET_MISMATCH',
          `[${issue.code}] ${issue.message}`,
          { path: 'questionIds' },
        )));
      }
      questionIds = assembly.value.questionIds;
      const eligibleIds = humanVisualPerceptionCandidateBank.questions.filter((question) => (
        question.courseId === HVP_CURATED_COURSE_ID
        && question.moduleId === HVP_CURATED_MODULE_ID
        && question.reviewStatus === 'draft'
        && question.format !== 'open_response'
        && selection.sectionIds.includes(question.sectionId)
        && selection.formats.includes(question.format)
        && selection.difficulties.includes(question.difficulty)
      )).map((question) => question.id);
      selection = withStrategyEvidence(selection, eligibleIds);
    } else {
      const assembly = assemblePractice({
        questions: humanVisualPerceptionCandidateBank.questions,
        blueprint: hvpCuratedPracticeBlueprint,
        selection,
        history: store.assessment.questionHistory,
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
      selection = assembly.value.selection;
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
}

const automaticQuestions = humanVisualPerceptionCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const hvpPracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: hvpCuratedSummary,
  automaticBlueprintId: HVP_CURATED_BLUEPRINT_ID,
  writtenBlueprintId: HVP_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: HVP_SECTIONS,
    automaticFormats: HVP_AUTOMATIC_FORMATS,
    difficulties: HVP_DIFFICULTIES,
    questionPoolSize: 120,
    scoredFormatCount: 8,
    fullQuestionCount: 50,
    quickQuestionCount: 10,
    standardQuestionCount: 25,
    targetedQuestionCount: 10,
    writtenQuestionCount: 2,
    customMinimumCount: 5,
    customMaximumCount: 50,
    landingHeading: 'Curated slide-aligned practice',
    landingDescription:
      'Choose a deterministic session length or target revision using history stored only on this device.',
    fullContractDescription: 'Full practice preserves the exact PR #9 50-question contract.',
    notesLabel: 'Human Visual Perception notes',
    statusComponent: HvpReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === HVP_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateHvpCuratedAttempt,
  validateResult: validateHvpCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === HVP_WRITTEN_BLUEPRINT_ID
      ? hvpWrittenPracticeBlueprint.historyPolicy
      : hvpCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      hvpCuratedPracticeBlueprint.maximumFamilyRepetition,
    );
    return {
      unseen: available(unseenQuestionIds(automaticQuestions, store.assessment.questionHistory)),
      missed: available(retryMissedQuestionIds(automaticQuestions, store.assessment.questionHistory)),
      weakTopics: available(weakTopicQuestionIds(automaticQuestions, store.assessment.questionHistory)),
      challenge: available(challengeQuestionIds(automaticQuestions)),
    };
  },
};

export const hvpPracticeDefinition = Object.freeze(hvpPracticeDefinitionValue);
