import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
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
  validateAqueousVitreousCuratedAttempt,
  validateAqueousVitreousCuratedResult,
} from '@/lib/assessment/aqueous-vitreous-curated/compatibility';
import {
  AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
  AQUEOUS_VITREOUS_CURATED_COURSE_ID,
  AQUEOUS_VITREOUS_CURATED_MODULE_ID,
  AQUEOUS_VITREOUS_CURATED_POLICY,
  AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/aqueous-vitreous-curated/config';
import {
  createAqueousVitreousPracticeSelection,
  createAqueousVitreousWrittenSelection,
  AQUEOUS_VITREOUS_AUTOMATIC_FORMATS,
  AQUEOUS_VITREOUS_DIFFICULTIES,
  AQUEOUS_VITREOUS_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  AQUEOUS_VITREOUS_SECTION_FORMAT_AVAILABILITY,
  AQUEOUS_VITREOUS_SECTIONS,
  aqueousVitreousCuratedPracticeBlueprint,
  aqueousVitreousWrittenPracticeBlueprint,
} from '@/lib/assessment/aqueous-vitreous-curated/practiceBlueprint';
import { buildDraftOnlyAqueousVitreousCuratedRegistry } from '@/lib/assessment/aqueous-vitreous-curated/registry';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const registryResult = buildDraftOnlyAqueousVitreousCuratedRegistry();
const automaticQuestions = aqueousVitreousCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const labels: Record<string, string> = {
  'media-chambers': 'Ocular media and chambers',
  production: 'Aqueous production and functions',
  flow: 'Aqueous flow and drainage',
  iop: 'Intraocular pressure',
  'vitreous-anatomy': 'Vitreous anatomy and attachments',
  'vitreous-clinical': 'Vitreous ageing and clinical change',
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

function AqueousVitreousReleaseStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={aqueousVitreousCuratedSummary}
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
    selection = createAqueousVitreousWrittenSelection(seed);
    questionIds = aqueousVitreousCandidateBank.questions
      .filter((question) => question.format === 'open_response')
      .map((question) => question.id)
      .sort();
    selection = withStrategyEvidence(selection, questionIds);
  } else {
    const profile = aqueousVitreousCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === request.profileId,
    );
    const requestedCount = request.requestedCount ?? profile?.count ?? 10;
    selection = createAqueousVitreousPracticeSelection({
      profileId: request.profileId,
      strategy: request.strategy
        ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
      requestedCount,
      sectionIds: request.sectionIds
        ?? (profile?.sectionTargets
          ? Object.keys(profile.sectionTargets)
          : [...AQUEOUS_VITREOUS_SECTIONS]),
      formats: request.formats
        ?? (profile?.formatTargets
          ? Object.keys(profile.formatTargets) as typeof AQUEOUS_VITREOUS_AUTOMATIC_FORMATS
          : AQUEOUS_VITREOUS_AUTOMATIC_FORMATS),
      difficulties: request.difficulties
        ?? (profile?.difficultyTargets
          ? Object.keys(profile.difficultyTargets) as typeof AQUEOUS_VITREOUS_DIFFICULTIES
          : AQUEOUS_VITREOUS_DIFFICULTIES),
      seed,
    });
    const validSelection = validatePracticeSelection(
      selection,
      aqueousVitreousCuratedPracticeBlueprint,
    );
    if (!validSelection.ok) return assemblyFailure(validSelection.issues);
    const assembly = assemblePractice({
      questions: aqueousVitreousCandidateBank.questions,
      blueprint: aqueousVitreousCuratedPracticeBlueprint,
      selection,
      history: store.assessment.questionHistory,
      sectionFormatAvailability:
        AQUEOUS_VITREOUS_PROFILE_SECTION_FORMAT_ALLOCATIONS[
          request.profileId as keyof typeof AQUEOUS_VITREOUS_PROFILE_SECTION_FORMAT_ALLOCATIONS
        ] ?? AQUEOUS_VITREOUS_SECTION_FORMAT_AVAILABILITY,
    });
    if (!assembly.ok) return assemblyFailure(assembly.issues);
    questionIds = assembly.value.questionIds;
    selection = assembly.value.selection;
  }

  const blueprint = written
    ? aqueousVitreousWrittenPracticeBlueprint
    : aqueousVitreousCuratedPracticeBlueprint;
  return createAssessmentAttempt({
    registry,
    questionIds,
    mode: blueprint.defaultMode,
    courseId: AQUEOUS_VITREOUS_CURATED_COURSE_ID,
    moduleId: AQUEOUS_VITREOUS_CURATED_MODULE_ID,
    blueprintId: blueprint.id,
    practiceSelection: selection,
    gradingPolicy: AQUEOUS_VITREOUS_CURATED_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createSeededRandom(seed),
  });
}

const aqueousVitreousCuratedPracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: aqueousVitreousCuratedSummary,
  automaticBlueprintId: AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
  writtenBlueprintId: AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: AQUEOUS_VITREOUS_SECTIONS,
    automaticFormats: AQUEOUS_VITREOUS_AUTOMATIC_FORMATS,
    difficulties: AQUEOUS_VITREOUS_DIFFICULTIES,
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
      'Build deterministic Aqueous and Vitreous sessions from 80 slide-aligned draft questions; history remains on this device.',
    fullContractDescription:
      'Full practice uses 50 questions with exact section, format and difficulty quotas, a bounded higher-order range, full objective coverage and the family limit.',
    notesLabel: 'Aqueous Humour and Vitreous Body notes',
    statusComponent: AqueousVitreousReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateAqueousVitreousCuratedAttempt,
  validateResult: validateAqueousVitreousCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID
      ? aqueousVitreousWrittenPracticeBlueprint.historyPolicy
      : aqueousVitreousCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      aqueousVitreousCuratedPracticeBlueprint.maximumFamilyRepetition,
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

export const aqueousVitreousCuratedPracticeDefinition = Object.freeze(
  aqueousVitreousCuratedPracticeDefinitionValue,
);
