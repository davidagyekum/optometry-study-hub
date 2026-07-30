import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import { environmentalVisionCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
import type {
  CuratedPracticeDefinition,
  CuratedPracticeRequest,
} from '@/lib/assessment/curated/definition';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import { validatePracticeSelection } from '@/lib/assessment/practice/blueprint';
import { withStrategyEvidence } from '@/lib/assessment/practice/evidence';
import {
  challengeQuestionIds,
  familyConstrainedCount,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
} from '@/lib/assessment/practice/history';
import { createSeededRandom } from '@/lib/assessment/practice/random';
import type { PracticeSelectionSnapshot } from '@/lib/assessment/practice/types';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { sessionFailure, sessionIssue } from '@/lib/assessment/session/errors';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';
import {
  validateEnvironmentalVisionCuratedAttempt,
  validateEnvironmentalVisionCuratedResult,
} from '@/lib/assessment/environmental-vision/compatibility';
import {
  ENVIRONMENTAL_VISION_BLUEPRINT_ID,
  ENVIRONMENTAL_VISION_COURSE_ID,
  ENVIRONMENTAL_VISION_MODULE_ID,
  ENVIRONMENTAL_VISION_POLICY,
  ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/environmental-vision/config';
import {
  createEnvironmentalVisionPracticeSelection,
  createEnvironmentalVisionWrittenSelection,
  ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS,
  ENVIRONMENTAL_VISION_DIFFICULTIES,
  ENVIRONMENTAL_VISION_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  ENVIRONMENTAL_VISION_SECTION_FORMAT_AVAILABILITY,
  ENVIRONMENTAL_VISION_SECTIONS,
  environmentalVisionCuratedPracticeBlueprint,
  environmentalVisionWrittenPracticeBlueprint,
} from '@/lib/assessment/environmental-vision/practiceBlueprint';
import { buildDraftOnlyEnvironmentalVisionRegistry } from '@/lib/assessment/environmental-vision/registry';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const registryResult = buildDraftOnlyEnvironmentalVisionRegistry();
const automaticQuestions = environmentalVisionCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const labels: Record<string, string> = {
  'env-optics': 'Physical optics and ocular absorption',
  'env-task': 'Visual task analysis',
  'env-ergonomics': 'Visual ergonomics',
  'env-hazards': 'Ocular hazards and injury',
  'env-protection': 'Eye and face protection',
  'env-lighting': 'Workplace lighting',
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

function EnvironmentalVisionReleaseStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={environmentalVisionCuratedSummary}
    />
  );
}

function runtimeSeed(): string {
  return globalThis.crypto.randomUUID();
}

function defaultRequest(): CuratedPracticeRequest {
  return { profileId: 'full', strategy: 'mixed', requestedCount: 50 };
}

function assemblyFailure(
  issues: Array<{ code: string; message: string; path?: string }>,
): SessionResult<AssessmentAttemptSnapshot> {
  return sessionFailure(issues.map((issue) => sessionIssue(
    'PILOT_QUESTION_SET_MISMATCH',
    `[${issue.code}] ${issue.message}`,
    { path: issue.path ?? 'practiceSelection' },
  )));
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
    selection = createEnvironmentalVisionWrittenSelection(seed);
    questionIds = environmentalVisionCandidateBank.questions
      .filter((question) => question.format === 'open_response')
      .map((question) => question.id)
      .sort();
    selection = withStrategyEvidence(selection, questionIds);
  } else {
    const profile = environmentalVisionCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === request.profileId,
    );
    const requestedCount = request.requestedCount ?? profile?.count ?? 10;
    selection = createEnvironmentalVisionPracticeSelection({
      profileId: request.profileId,
      strategy: request.strategy
        ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
      requestedCount,
      sectionIds: request.sectionIds
        ?? (profile?.sectionTargets
          ? Object.keys(profile.sectionTargets)
          : [...ENVIRONMENTAL_VISION_SECTIONS]),
      formats: request.formats
        ?? (profile?.formatTargets
          ? Object.keys(profile.formatTargets) as typeof ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS
          : ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS),
      difficulties: request.difficulties
        ?? (profile?.difficultyTargets
          ? Object.keys(profile.difficultyTargets) as typeof ENVIRONMENTAL_VISION_DIFFICULTIES
          : ENVIRONMENTAL_VISION_DIFFICULTIES),
      seed,
    });
    const validSelection = validatePracticeSelection(
      selection,
      environmentalVisionCuratedPracticeBlueprint,
    );
    if (!validSelection.ok) return assemblyFailure(validSelection.issues);
    const assembly = assemblePractice({
      questions: environmentalVisionCandidateBank.questions,
      blueprint: environmentalVisionCuratedPracticeBlueprint,
      selection,
      history: store.assessment.questionHistory,
      sectionFormatAvailability:
        ENVIRONMENTAL_VISION_PROFILE_SECTION_FORMAT_ALLOCATIONS[
          request.profileId as keyof typeof ENVIRONMENTAL_VISION_PROFILE_SECTION_FORMAT_ALLOCATIONS
        ] ?? ENVIRONMENTAL_VISION_SECTION_FORMAT_AVAILABILITY,
    });
    if (!assembly.ok) return assemblyFailure(assembly.issues);
    questionIds = assembly.value.questionIds;
    selection = assembly.value.selection;
  }

  const blueprint = written
    ? environmentalVisionWrittenPracticeBlueprint
    : environmentalVisionCuratedPracticeBlueprint;
  return createAssessmentAttempt({
    registry,
    questionIds,
    mode: blueprint.defaultMode,
    courseId: ENVIRONMENTAL_VISION_COURSE_ID,
    moduleId: ENVIRONMENTAL_VISION_MODULE_ID,
    blueprintId: blueprint.id,
    practiceSelection: selection,
    gradingPolicy: ENVIRONMENTAL_VISION_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createSeededRandom(seed),
  });
}

const environmentalVisionPracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: environmentalVisionCuratedSummary,
  automaticBlueprintId: ENVIRONMENTAL_VISION_BLUEPRINT_ID,
  writtenBlueprintId: ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: ENVIRONMENTAL_VISION_SECTIONS,
    automaticFormats: ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS,
    difficulties: ENVIRONMENTAL_VISION_DIFFICULTIES,
    questionPoolSize: 80,
    scoredFormatCount: 9,
    fullQuestionCount: 50,
    quickQuestionCount: 10,
    standardQuestionCount: 25,
    targetedQuestionCount: 10,
    writtenQuestionCount: 2,
    customMinimumCount: 5,
    customMaximumCount: 50,
    landingHeading: 'Curated slide-aligned practice',
    landingDescription:
      'Build deterministic Environmental Vision sessions from 80 slide-aligned draft questions; history remains on this device.',
    fullContractDescription:
      'Full practice uses 50 questions with exact section, format, difficulty, Bloom, objective and family contracts.',
    notesLabel: 'Environmental Vision notes',
    statusComponent: EnvironmentalVisionReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateEnvironmentalVisionCuratedAttempt,
  validateResult: validateEnvironmentalVisionCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID
      ? environmentalVisionWrittenPracticeBlueprint.historyPolicy
      : environmentalVisionCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      environmentalVisionCuratedPracticeBlueprint.maximumFamilyRepetition,
    );
    return {
      unseen: available(unseenQuestionIds(
        automaticQuestions,
        store.assessment.questionHistory,
      )),
      missed: available(retryMissedQuestionIds(
        automaticQuestions,
        store.assessment.questionHistory,
      )),
      weakTopics: available(weakTopicQuestionIds(
        automaticQuestions,
        store.assessment.questionHistory,
      )),
      challenge: available(challengeQuestionIds(automaticQuestions)),
    };
  },
};

export const environmentalVisionPracticeDefinition = Object.freeze(
  environmentalVisionPracticeDefinitionValue,
);
