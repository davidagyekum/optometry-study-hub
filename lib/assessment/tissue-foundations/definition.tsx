import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { tissueCuratedSummary } from '@/lib/assessment/curated/experienceRegistry';
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
  validateTissueCuratedAttempt,
  validateTissueCuratedResult,
} from '@/lib/assessment/tissue-foundations/compatibility';
import {
  TISSUE_CURATED_BLUEPRINT_ID,
  TISSUE_CURATED_COURSE_ID,
  TISSUE_CURATED_MODULE_ID,
  TISSUE_CURATED_POLICY,
  TISSUE_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/tissue-foundations/config';
import {
  createTissuePracticeSelection,
  createTissueWrittenSelection,
  TISSUE_AUTOMATIC_FORMATS,
  TISSUE_DIFFICULTIES,
  TISSUE_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  TISSUE_SECTION_FORMAT_AVAILABILITY,
  TISSUE_SECTIONS,
  tissueCuratedPracticeBlueprint,
  tissueWrittenPracticeBlueprint,
} from '@/lib/assessment/tissue-foundations/practiceBlueprint';
import { buildDraftOnlyTissueRegistry } from '@/lib/assessment/tissue-foundations/registry';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const registryResult = buildDraftOnlyTissueRegistry();
const automaticQuestions = tissueFoundationsCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

const labels: Record<string, string> = {
  'tissue-nervous': 'Nervous tissue',
  'tissue-epithelium': 'Epithelium',
  'tissue-connective': 'Connective tissue',
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

function TissueReleaseStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={tissueCuratedSummary}
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
    selection = createTissueWrittenSelection(seed);
    questionIds = tissueFoundationsCandidateBank.questions
      .filter((question) => question.format === 'open_response')
      .map((question) => question.id)
      .sort();
    selection = withStrategyEvidence(selection, questionIds);
  } else {
    const profile = tissueCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === request.profileId,
    );
    const requestedCount = request.requestedCount ?? profile?.count ?? 10;
    selection = createTissuePracticeSelection({
      profileId: request.profileId,
      strategy: request.strategy
        ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
      requestedCount,
      sectionIds: request.sectionIds
        ?? (profile?.sectionTargets
          ? Object.keys(profile.sectionTargets)
          : [...TISSUE_SECTIONS]),
      formats: request.formats
        ?? (profile?.formatTargets
          ? Object.keys(profile.formatTargets) as typeof TISSUE_AUTOMATIC_FORMATS
          : TISSUE_AUTOMATIC_FORMATS),
      difficulties: request.difficulties
        ?? (profile?.difficultyTargets
          ? Object.keys(profile.difficultyTargets) as typeof TISSUE_DIFFICULTIES
          : TISSUE_DIFFICULTIES),
      seed,
    });
    const validSelection = validatePracticeSelection(
      selection,
      tissueCuratedPracticeBlueprint,
    );
    if (!validSelection.ok) return assemblyFailure(validSelection.issues);
    const assembly = assemblePractice({
      questions: tissueFoundationsCandidateBank.questions,
      blueprint: tissueCuratedPracticeBlueprint,
      selection,
      history: store.assessment.questionHistory,
      sectionFormatAvailability:
        TISSUE_PROFILE_SECTION_FORMAT_ALLOCATIONS[
          request.profileId as keyof typeof TISSUE_PROFILE_SECTION_FORMAT_ALLOCATIONS
        ] ?? TISSUE_SECTION_FORMAT_AVAILABILITY,
    });
    if (!assembly.ok) return assemblyFailure(assembly.issues);
    questionIds = assembly.value.questionIds;
    selection = assembly.value.selection;
  }

  const blueprint = written
    ? tissueWrittenPracticeBlueprint
    : tissueCuratedPracticeBlueprint;
  return createAssessmentAttempt({
    registry,
    questionIds,
    mode: blueprint.defaultMode,
    courseId: TISSUE_CURATED_COURSE_ID,
    moduleId: TISSUE_CURATED_MODULE_ID,
    blueprintId: blueprint.id,
    practiceSelection: selection,
    gradingPolicy: TISSUE_CURATED_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createSeededRandom(seed),
  });
}

const tissuePracticeDefinitionValue: CuratedPracticeDefinition = {
  summary: tissueCuratedSummary,
  automaticBlueprintId: TISSUE_CURATED_BLUEPRINT_ID,
  writtenBlueprintId: TISSUE_WRITTEN_BLUEPRINT_ID,
  registryResult,
  learner: {
    labels,
    sectionIds: TISSUE_SECTIONS,
    automaticFormats: TISSUE_AUTOMATIC_FORMATS,
    difficulties: TISSUE_DIFFICULTIES,
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
      'Build deterministic Tissue Foundations sessions using current-version history stored only on this device.',
    fullContractDescription:
      'Full practice uses 50 questions with exact section, format, difficulty, Bloom, objective and family contracts.',
    notesLabel: 'Tissue Foundations notes',
    statusComponent: TissueReleaseStatus,
  },
  defaultRequest,
  replacementRequest: (attempt) => (
    attempt?.blueprintId === TISSUE_WRITTEN_BLUEPRINT_ID
      ? { profileId: 'written', requestedCount: 2 }
      : defaultRequest()
  ),
  createAttempt,
  validateAttempt: validateTissueCuratedAttempt,
  validateResult: validateTissueCuratedResult,
  historyPolicy: (attempt) => (
    attempt.blueprintId === TISSUE_WRITTEN_BLUEPRINT_ID
      ? tissueWrittenPracticeBlueprint.historyPolicy
      : tissueCuratedPracticeBlueprint.historyPolicy
  ),
  availability: (store) => {
    const available = (ids: string[]) => familyConstrainedCount(
      ids,
      automaticQuestions,
      tissueCuratedPracticeBlueprint.maximumFamilyRepetition,
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

export const tissuePracticeDefinition = Object.freeze(
  tissuePracticeDefinitionValue,
);
