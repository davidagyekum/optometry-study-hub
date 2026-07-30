import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import { bloodSupplyCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
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
  validateBloodSupplyCuratedAttempt,
  validateBloodSupplyCuratedResult,
} from '@/lib/assessment/blood-supply/compatibility';
import {
  BLOOD_SUPPLY_BLUEPRINT_ID,
  BLOOD_SUPPLY_COURSE_ID,
  BLOOD_SUPPLY_MODULE_ID,
  BLOOD_SUPPLY_POLICY,
  BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/blood-supply/config';
import {
  createBloodSupplyPracticeSelection,
  createBloodSupplyWrittenSelection,
  BLOOD_SUPPLY_AUTOMATIC_FORMATS,
  BLOOD_SUPPLY_DIFFICULTIES,
  BLOOD_SUPPLY_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  BLOOD_SUPPLY_SECTION_FORMAT_AVAILABILITY,
  BLOOD_SUPPLY_SECTIONS,
  bloodSupplyCuratedPracticeBlueprint,
  bloodSupplyWrittenPracticeBlueprint,
} from '@/lib/assessment/blood-supply/practiceBlueprint';
import { buildDraftOnlyBloodSupplyRegistry } from '@/lib/assessment/blood-supply/registry';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const registryResult = buildDraftOnlyBloodSupplyRegistry();
const automaticQuestions = bloodSupplyCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const labels: Record<string, string> = {
  'arterial-origins': 'Ophthalmic artery and arterial origins',
  ciliary: 'Posterior ciliary and uveal circulation',
  retinal: 'Retinal circulation and foveal avascular zone',
  barriers: 'Blood-retina barriers and capillary types',
  microcirculation: 'Retinal microcirculation and exchange',
  'clinical-blood': 'Clinical vascular localization',
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

function BloodSupplyReleaseStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={bloodSupplyCuratedSummary}
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
    selection = createBloodSupplyWrittenSelection(seed);
    questionIds = bloodSupplyCandidateBank.questions
      .filter((question) => question.format === 'open_response')
      .map((question) => question.id)
      .sort();
    selection = withStrategyEvidence(selection, questionIds);
  } else {
    const profile = bloodSupplyCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === request.profileId,
    );
    const requestedCount = request.requestedCount ?? profile?.count ?? 10;
    selection = createBloodSupplyPracticeSelection({
      profileId: request.profileId,
      strategy: request.strategy
        ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
      requestedCount,
      sectionIds: request.sectionIds
        ?? (profile?.sectionTargets
          ? Object.keys(profile.sectionTargets)
          : [...BLOOD_SUPPLY_SECTIONS]),
      formats: request.formats
        ?? (profile?.formatTargets
          ? Object.keys(profile.formatTargets) as typeof BLOOD_SUPPLY_AUTOMATIC_FORMATS
          : BLOOD_SUPPLY_AUTOMATIC_FORMATS),
      difficulties: request.difficulties
        ?? (profile?.difficultyTargets
          ? Object.keys(profile.difficultyTargets) as typeof BLOOD_SUPPLY_DIFFICULTIES
          : BLOOD_SUPPLY_DIFFICULTIES),
      seed,
    });
    const validSelection = validatePracticeSelection(
      selection,
      bloodSupplyCuratedPracticeBlueprint,
    );
    if (!validSelection.ok) return assemblyFailure(validSelection.issues);
    const assembly = assemblePractice({
      questions: bloodSupplyCandidateBank.questions,
      blueprint: bloodSupplyCuratedPracticeBlueprint,
      selection,
      history: store.assessment.questionHistory,
      sectionFormatAvailability:
        BLOOD_SUPPLY_PROFILE_SECTION_FORMAT_ALLOCATIONS[
          request.profileId as keyof typeof BLOOD_SUPPLY_PROFILE_SECTION_FORMAT_ALLOCATIONS
        ] ?? BLOOD_SUPPLY_SECTION_FORMAT_AVAILABILITY,
    });
    if (!assembly.ok) return assemblyFailure(assembly.issues);
    questionIds = assembly.value.questionIds;
    selection = assembly.value.selection;
  }

  const blueprint = written
    ? bloodSupplyWrittenPracticeBlueprint
    : bloodSupplyCuratedPracticeBlueprint;
  return createAssessmentAttempt({
    registry,
    questionIds,
    mode: blueprint.defaultMode,
    courseId: BLOOD_SUPPLY_COURSE_ID,
    moduleId: BLOOD_SUPPLY_MODULE_ID,
    blueprintId: blueprint.id,
    practiceSelection: selection,
    gradingPolicy: BLOOD_SUPPLY_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createSeededRandom(seed),
  });
}

const bloodSupplyPracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: bloodSupplyCuratedSummary,
  automaticBlueprintId: BLOOD_SUPPLY_BLUEPRINT_ID,
  writtenBlueprintId: BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: BLOOD_SUPPLY_SECTIONS,
    automaticFormats: BLOOD_SUPPLY_AUTOMATIC_FORMATS,
    difficulties: BLOOD_SUPPLY_DIFFICULTIES,
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
      'Build deterministic Blood Supply sessions from 80 slide-aligned draft questions; history remains on this device.',
    fullContractDescription:
      'Full practice uses 50 questions with exact section, format, difficulty, Bloom, objective and family contracts.',
    notesLabel: 'Blood Supply to the Eye notes',
    statusComponent: BloodSupplyReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateBloodSupplyCuratedAttempt,
  validateResult: validateBloodSupplyCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID
      ? bloodSupplyWrittenPracticeBlueprint.historyPolicy
      : bloodSupplyCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      bloodSupplyCuratedPracticeBlueprint.maximumFamilyRepetition,
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

export const bloodSupplyPracticeDefinition = Object.freeze(
  bloodSupplyPracticeDefinitionValue,
);
