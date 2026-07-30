import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import { ocularAdnexaCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
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
  validateOcularAdnexaCuratedAttempt,
  validateOcularAdnexaCuratedResult,
} from '@/lib/assessment/ocular-adnexa/compatibility';
import {
  OCULAR_ADNEXA_BLUEPRINT_ID,
  OCULAR_ADNEXA_COURSE_ID,
  OCULAR_ADNEXA_MODULE_ID,
  OCULAR_ADNEXA_POLICY,
  OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/ocular-adnexa/config';
import {
  createOcularAdnexaPracticeSelection,
  createOcularAdnexaWrittenSelection,
  OCULAR_ADNEXA_AUTOMATIC_FORMATS,
  OCULAR_ADNEXA_DIFFICULTIES,
  OCULAR_ADNEXA_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  OCULAR_ADNEXA_SECTION_FORMAT_AVAILABILITY,
  OCULAR_ADNEXA_SECTIONS,
  ocularAdnexaCuratedPracticeBlueprint,
  ocularAdnexaWrittenPracticeBlueprint,
} from '@/lib/assessment/ocular-adnexa/practiceBlueprint';
import { buildDraftOnlyOcularAdnexaRegistry } from '@/lib/assessment/ocular-adnexa/registry';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const registryResult = buildDraftOnlyOcularAdnexaRegistry();
const automaticQuestions = ocularAdnexaCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const labels: Record<string, string> = {
  landmarks: 'Landmarks and topography',
  muscles: 'Skin, lashes and muscles',
  'tarsus-glands': 'Tarsus, conjunctiva and glands',
  'lower-lid-blood': 'Lower lid and blood supply',
  'lacrimal-gland': 'Lacrimal gland',
  tears: 'Tear film and drainage',
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

function OcularAdnexaReleaseStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={ocularAdnexaCuratedSummary}
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
    selection = createOcularAdnexaWrittenSelection(seed);
    questionIds = ocularAdnexaCandidateBank.questions
      .filter((question) => question.format === 'open_response')
      .map((question) => question.id)
      .sort();
    selection = withStrategyEvidence(selection, questionIds);
  } else {
    const profile = ocularAdnexaCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === request.profileId,
    );
    const requestedCount = request.requestedCount ?? profile?.count ?? 10;
    selection = createOcularAdnexaPracticeSelection({
      profileId: request.profileId,
      strategy: request.strategy
        ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
      requestedCount,
      sectionIds: request.sectionIds
        ?? (profile?.sectionTargets
          ? Object.keys(profile.sectionTargets)
          : [...OCULAR_ADNEXA_SECTIONS]),
      formats: request.formats
        ?? (profile?.formatTargets
          ? Object.keys(profile.formatTargets) as typeof OCULAR_ADNEXA_AUTOMATIC_FORMATS
          : OCULAR_ADNEXA_AUTOMATIC_FORMATS),
      difficulties: request.difficulties
        ?? (profile?.difficultyTargets
          ? Object.keys(profile.difficultyTargets) as typeof OCULAR_ADNEXA_DIFFICULTIES
          : OCULAR_ADNEXA_DIFFICULTIES),
      seed,
    });
    const validSelection = validatePracticeSelection(
      selection,
      ocularAdnexaCuratedPracticeBlueprint,
    );
    if (!validSelection.ok) return assemblyFailure(validSelection.issues);
    const assembly = assemblePractice({
      questions: ocularAdnexaCandidateBank.questions,
      blueprint: ocularAdnexaCuratedPracticeBlueprint,
      selection,
      history: store.assessment.questionHistory,
      sectionFormatAvailability:
        OCULAR_ADNEXA_PROFILE_SECTION_FORMAT_ALLOCATIONS[
          request.profileId as keyof typeof OCULAR_ADNEXA_PROFILE_SECTION_FORMAT_ALLOCATIONS
        ] ?? OCULAR_ADNEXA_SECTION_FORMAT_AVAILABILITY,
    });
    if (!assembly.ok) return assemblyFailure(assembly.issues);
    questionIds = assembly.value.questionIds;
    selection = assembly.value.selection;
  }

  const blueprint = written
    ? ocularAdnexaWrittenPracticeBlueprint
    : ocularAdnexaCuratedPracticeBlueprint;
  return createAssessmentAttempt({
    registry,
    questionIds,
    mode: blueprint.defaultMode,
    courseId: OCULAR_ADNEXA_COURSE_ID,
    moduleId: OCULAR_ADNEXA_MODULE_ID,
    blueprintId: blueprint.id,
    practiceSelection: selection,
    gradingPolicy: OCULAR_ADNEXA_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createSeededRandom(seed),
  });
}

const ocularAdnexaPracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: ocularAdnexaCuratedSummary,
  automaticBlueprintId: OCULAR_ADNEXA_BLUEPRINT_ID,
  writtenBlueprintId: OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: OCULAR_ADNEXA_SECTIONS,
    automaticFormats: OCULAR_ADNEXA_AUTOMATIC_FORMATS,
    difficulties: OCULAR_ADNEXA_DIFFICULTIES,
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
      'Build deterministic Ocular Adnexa sessions from 80 slide-aligned draft questions; history remains on this device.',
    fullContractDescription:
      'Full practice uses 50 questions with exact section, format, difficulty, Bloom, objective and family contracts.',
    notesLabel: 'Ocular Adnexa and Lacrimal Apparatus notes',
    statusComponent: OcularAdnexaReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateOcularAdnexaCuratedAttempt,
  validateResult: validateOcularAdnexaCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID
      ? ocularAdnexaWrittenPracticeBlueprint.historyPolicy
      : ocularAdnexaCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      ocularAdnexaCuratedPracticeBlueprint.maximumFamilyRepetition,
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

export const ocularAdnexaPracticeDefinition = Object.freeze(
  ocularAdnexaPracticeDefinitionValue,
);
