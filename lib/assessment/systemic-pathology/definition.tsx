import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import { systemicPathologyCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
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
  validateSystemicPathologyCuratedAttempt,
  validateSystemicPathologyCuratedResult,
} from '@/lib/assessment/systemic-pathology/compatibility';
import {
  SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
  SYSTEMIC_PATHOLOGY_COURSE_ID,
  SYSTEMIC_PATHOLOGY_MODULE_ID,
  SYSTEMIC_PATHOLOGY_POLICY,
  SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/systemic-pathology/config';
import {
  createSystemicPathologyPracticeSelection,
  createSystemicPathologyWrittenSelection,
  SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS,
  SYSTEMIC_PATHOLOGY_DIFFICULTIES,
  SYSTEMIC_PATHOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  SYSTEMIC_PATHOLOGY_SECTION_FORMAT_AVAILABILITY,
  SYSTEMIC_PATHOLOGY_SECTIONS,
  systemicPathologyCuratedPracticeBlueprint,
  systemicPathologyWrittenPracticeBlueprint,
} from '@/lib/assessment/systemic-pathology/practiceBlueprint';
import { buildDraftOnlySystemicPathologyRegistry } from '@/lib/assessment/systemic-pathology/registry';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const registryResult = buildDraftOnlySystemicPathologyRegistry();
const automaticQuestions = systemicPathologyCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const labels: Record<string, string> = {
  'path-breast': 'Breast pathology',
  'path-cardio': 'Cardiovascular pathology',
  'path-endocrine': 'Endocrine pathology',
  'path-gi': 'Gastrointestinal pathology',
  'path-renal': 'Renal pathology',
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

function SystemicPathologyReleaseStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={systemicPathologyCuratedSummary}
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
    selection = createSystemicPathologyWrittenSelection(seed);
    questionIds = systemicPathologyCandidateBank.questions
      .filter((question) => question.format === 'open_response')
      .map((question) => question.id)
      .sort();
    selection = withStrategyEvidence(selection, questionIds);
  } else {
    const profile = systemicPathologyCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === request.profileId,
    );
    const requestedCount = request.requestedCount ?? profile?.count ?? 10;
    selection = createSystemicPathologyPracticeSelection({
      profileId: request.profileId,
      strategy: request.strategy
        ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
      requestedCount,
      sectionIds: request.sectionIds
        ?? (profile?.sectionTargets
          ? Object.keys(profile.sectionTargets)
          : [...SYSTEMIC_PATHOLOGY_SECTIONS]),
      formats: request.formats
        ?? (profile?.formatTargets
          ? Object.keys(profile.formatTargets) as typeof SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS
          : SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS),
      difficulties: request.difficulties
        ?? (profile?.difficultyTargets
          ? Object.keys(profile.difficultyTargets) as typeof SYSTEMIC_PATHOLOGY_DIFFICULTIES
          : SYSTEMIC_PATHOLOGY_DIFFICULTIES),
      seed,
    });
    const validSelection = validatePracticeSelection(
      selection,
      systemicPathologyCuratedPracticeBlueprint,
    );
    if (!validSelection.ok) return assemblyFailure(validSelection.issues);
    const assembly = assemblePractice({
      questions: systemicPathologyCandidateBank.questions,
      blueprint: systemicPathologyCuratedPracticeBlueprint,
      selection,
      history: store.assessment.questionHistory,
      sectionFormatAvailability:
        SYSTEMIC_PATHOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS[
          request.profileId as keyof typeof SYSTEMIC_PATHOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS
        ] ?? SYSTEMIC_PATHOLOGY_SECTION_FORMAT_AVAILABILITY,
    });
    if (!assembly.ok) return assemblyFailure(assembly.issues);
    questionIds = assembly.value.questionIds;
    selection = assembly.value.selection;
  }

  const blueprint = written
    ? systemicPathologyWrittenPracticeBlueprint
    : systemicPathologyCuratedPracticeBlueprint;
  return createAssessmentAttempt({
    registry,
    questionIds,
    mode: blueprint.defaultMode,
    courseId: SYSTEMIC_PATHOLOGY_COURSE_ID,
    moduleId: SYSTEMIC_PATHOLOGY_MODULE_ID,
    blueprintId: blueprint.id,
    practiceSelection: selection,
    gradingPolicy: SYSTEMIC_PATHOLOGY_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createSeededRandom(seed),
  });
}

const systemicPathologyPracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: systemicPathologyCuratedSummary,
  automaticBlueprintId: SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
  writtenBlueprintId: SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: SYSTEMIC_PATHOLOGY_SECTIONS,
    automaticFormats: SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS,
    difficulties: SYSTEMIC_PATHOLOGY_DIFFICULTIES,
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
      'Build deterministic Systemic Pathology sessions from 80 slide-aligned draft questions; history remains on this device.',
    fullContractDescription:
      'Full practice uses 50 questions with exact section, format, difficulty, Bloom, objective and family contracts.',
    notesLabel: 'Systemic Pathology notes',
    statusComponent: SystemicPathologyReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateSystemicPathologyCuratedAttempt,
  validateResult: validateSystemicPathologyCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID
      ? systemicPathologyWrittenPracticeBlueprint.historyPolicy
      : systemicPathologyCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      systemicPathologyCuratedPracticeBlueprint.maximumFamilyRepetition,
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

export const systemicPathologyPracticeDefinition = Object.freeze(
  systemicPathologyPracticeDefinitionValue,
);
