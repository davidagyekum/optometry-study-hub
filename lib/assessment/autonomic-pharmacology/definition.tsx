import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import { autonomicPharmacologyCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
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
  validateAutonomicPharmacologyCuratedAttempt,
  validateAutonomicPharmacologyCuratedResult,
} from '@/lib/assessment/autonomic-pharmacology/compatibility';
import {
  AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
  AUTONOMIC_PHARMACOLOGY_COURSE_ID,
  AUTONOMIC_PHARMACOLOGY_MODULE_ID,
  AUTONOMIC_PHARMACOLOGY_POLICY,
  AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/autonomic-pharmacology/config';
import {
  createAutonomicPharmacologyPracticeSelection,
  createAutonomicPharmacologyWrittenSelection,
  AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS,
  AUTONOMIC_PHARMACOLOGY_DIFFICULTIES,
  AUTONOMIC_PHARMACOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  AUTONOMIC_PHARMACOLOGY_SECTION_FORMAT_AVAILABILITY,
  AUTONOMIC_PHARMACOLOGY_SECTIONS,
  autonomicPharmacologyCuratedPracticeBlueprint,
  autonomicPharmacologyWrittenPracticeBlueprint,
} from '@/lib/assessment/autonomic-pharmacology/practiceBlueprint';
import { buildDraftOnlyAutonomicPharmacologyRegistry } from '@/lib/assessment/autonomic-pharmacology/registry';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const registryResult = buildDraftOnlyAutonomicPharmacologyRegistry();
const automaticQuestions = autonomicPharmacologyCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const labels: Record<string, string> = {
  'pharm-adrenergic': 'Adrenergic pharmacology',
  'pharm-cholinergic': 'Cholinergic pharmacology',
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

function AutonomicPharmacologyReleaseStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={autonomicPharmacologyCuratedSummary}
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
    selection = createAutonomicPharmacologyWrittenSelection(seed);
    questionIds = autonomicPharmacologyCandidateBank.questions
      .filter((question) => question.format === 'open_response')
      .map((question) => question.id)
      .sort();
    selection = withStrategyEvidence(selection, questionIds);
  } else {
    const profile = autonomicPharmacologyCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === request.profileId,
    );
    const requestedCount = request.requestedCount ?? profile?.count ?? 10;
    selection = createAutonomicPharmacologyPracticeSelection({
      profileId: request.profileId,
      strategy: request.strategy
        ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
      requestedCount,
      sectionIds: request.sectionIds
        ?? (profile?.sectionTargets
          ? Object.keys(profile.sectionTargets)
          : [...AUTONOMIC_PHARMACOLOGY_SECTIONS]),
      formats: request.formats
        ?? (profile?.formatTargets
          ? Object.keys(profile.formatTargets) as typeof AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS
          : AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS),
      difficulties: request.difficulties
        ?? (profile?.difficultyTargets
          ? Object.keys(profile.difficultyTargets) as typeof AUTONOMIC_PHARMACOLOGY_DIFFICULTIES
          : AUTONOMIC_PHARMACOLOGY_DIFFICULTIES),
      seed,
    });
    const validSelection = validatePracticeSelection(
      selection,
      autonomicPharmacologyCuratedPracticeBlueprint,
    );
    if (!validSelection.ok) return assemblyFailure(validSelection.issues);
    const assembly = assemblePractice({
      questions: autonomicPharmacologyCandidateBank.questions,
      blueprint: autonomicPharmacologyCuratedPracticeBlueprint,
      selection,
      history: store.assessment.questionHistory,
      sectionFormatAvailability:
        AUTONOMIC_PHARMACOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS[
          request.profileId as keyof typeof AUTONOMIC_PHARMACOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS
        ] ?? AUTONOMIC_PHARMACOLOGY_SECTION_FORMAT_AVAILABILITY,
    });
    if (!assembly.ok) return assemblyFailure(assembly.issues);
    questionIds = assembly.value.questionIds;
    selection = assembly.value.selection;
  }

  const blueprint = written
    ? autonomicPharmacologyWrittenPracticeBlueprint
    : autonomicPharmacologyCuratedPracticeBlueprint;
  return createAssessmentAttempt({
    registry,
    questionIds,
    mode: blueprint.defaultMode,
    courseId: AUTONOMIC_PHARMACOLOGY_COURSE_ID,
    moduleId: AUTONOMIC_PHARMACOLOGY_MODULE_ID,
    blueprintId: blueprint.id,
    practiceSelection: selection,
    gradingPolicy: AUTONOMIC_PHARMACOLOGY_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createSeededRandom(seed),
  });
}

const autonomicPharmacologyPracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: autonomicPharmacologyCuratedSummary,
  automaticBlueprintId: AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
  writtenBlueprintId: AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: AUTONOMIC_PHARMACOLOGY_SECTIONS,
    automaticFormats: AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS,
    difficulties: AUTONOMIC_PHARMACOLOGY_DIFFICULTIES,
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
      'Build deterministic Autonomic Pharmacology sessions from 80 slide-aligned draft questions; history remains on this device.',
    fullContractDescription:
      'Full practice uses 50 questions with exact section, format, difficulty, Bloom, objective and family contracts.',
    notesLabel: 'Autonomic Pharmacology notes',
    statusComponent: AutonomicPharmacologyReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateAutonomicPharmacologyCuratedAttempt,
  validateResult: validateAutonomicPharmacologyCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID
      ? autonomicPharmacologyWrittenPracticeBlueprint.historyPolicy
      : autonomicPharmacologyCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      autonomicPharmacologyCuratedPracticeBlueprint.maximumFamilyRepetition,
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

export const autonomicPharmacologyPracticeDefinition = Object.freeze(
  autonomicPharmacologyPracticeDefinitionValue,
);
