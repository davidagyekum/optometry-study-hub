import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import type {
  CuratedPracticeDefinition,
  CuratedPracticeRequest,
} from '@/lib/assessment/curated/definition';
import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import type { GradingPolicyReference } from '@/lib/assessment/grading/types';
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
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { sessionFailure, sessionIssue } from '@/lib/assessment/session/errors';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  Difficulty,
  QuestionBank,
  QuestionFormat,
} from '@/lib/assessment/types';
import type { Opt370ModuleConfig } from '@/lib/assessment/opt370/config';
import type {
  AssessmentAttemptSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

const AUTOMATIC_FORMATS: QuestionFormat[] = [
  'single_best_answer',
  'true_false',
  'multiple_response',
  'matching',
  'extended_matching',
  'ordering',
  'image_hotspot',
  'image_label',
  'short_answer',
];
const DIFFICULTIES: Difficulty[] = ['foundation', 'intermediate', 'advanced'];
const GRADING_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});
const FORMAT_LABELS: Record<string, string> = {
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

export type Opt370PracticeExperience = {
  definition: CuratedPracticeDefinition;
  automaticBlueprint: PracticeBlueprint;
  writtenBlueprint: PracticeBlueprint;
  registryBuilder: () => SessionResult<QuestionRegistry>;
  bank: QuestionBank;
  sectionLabels: Readonly<Record<string, string>>;
};

type FactoryOptions = {
  config: Opt370ModuleConfig;
  summary: CuratedExperienceSummary;
  bank: QuestionBank;
  fullSectionTargets: Readonly<Record<string, number>>;
};

function scaledTargets(
  targets: Readonly<Record<string, number>>,
  total: number,
): Record<string, number> {
  const entries = Object.entries(targets);
  const sourceTotal = entries.reduce((sum, [, count]) => sum + count, 0);
  const scaled = entries.map(([id, count]) => ({
    id,
    count: Math.floor((count * total) / sourceTotal),
    remainder: (count * total) % sourceTotal,
  }));
  let remaining = total - scaled.reduce((sum, entry) => sum + entry.count, 0);
  scaled.sort((a, b) => b.remainder - a.remainder || a.id.localeCompare(b.id));
  for (let index = 0; index < scaled.length && remaining > 0; index += 1) {
    scaled[index].count += 1;
    remaining -= 1;
  }
  return Object.fromEntries(scaled.map(({ id, count }) => [id, count]));
}

function runtimeSeed(): string {
  return globalThis.crypto.randomUUID();
}

function assemblyFailure(
  issues: Array<{ code: string; message: string; path?: string }>,
): SessionResult<AssessmentAttemptSnapshot> {
  return sessionFailure(issues.map((issue) => sessionIssue(
    'PILOT_QUESTION_SET_MISMATCH',
    '[' + issue.code + '] ' + issue.message,
    { path: issue.path ?? 'practiceSelection' },
  )));
}

export function createOpt370PracticeExperience({
  config,
  summary,
  bank,
  fullSectionTargets,
}: FactoryOptions): Opt370PracticeExperience {
  const sectionIds = Object.keys(config.sectionLabels);
  const registryBuilder = () => buildQuestionRegistry({
    banks: [bank],
    allowedReviewStatuses: ['draft'],
  });
  const registryResult = registryBuilder();
  const automaticQuestions = bank.questions.filter(
    (question) => question.format !== 'open_response',
  );
  const sectionFormatAvailability = Object.fromEntries(sectionIds.map((sectionId) => [
    sectionId,
    Object.fromEntries(AUTOMATIC_FORMATS.map((format) => [
      format,
      bank.questions.filter(
        (question) => question.sectionId === sectionId && question.format === format,
      ).length,
    ])),
  ]));

  const automaticBlueprint = practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: config.automaticBlueprintId,
    practiceFamilyId: config.practiceFamilyId,
    courseId: 'dispensing-optics-ii',
    moduleId: config.moduleId,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: GRADING_POLICY,
    eligibleFormats: AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: scaledTargets(fullSectionTargets, 10),
        higherOrderMinimum: 5,
        higherOrderMaximum: 10,
      },
      {
        id: 'standard',
        label: 'Standard practice',
        count: 25,
        sectionTargets: scaledTargets(fullSectionTargets, 25),
        higherOrderMinimum: 14,
        higherOrderMaximum: 25,
      },
      {
        id: 'full',
        label: 'Full practice',
        count: 50,
        sectionTargets: { ...fullSectionTargets },
        formatTargets: {
          single_best_answer: 19,
          true_false: 4,
          multiple_response: 6,
          matching: 5,
          extended_matching: 4,
          ordering: 4,
          image_hotspot: 3,
          image_label: 2,
          short_answer: 3,
        },
        difficultyTargets: { ...config.fullDifficultyTargets },
        higherOrderMinimum: 28,
        higherOrderMaximum: 50,
        recommended: true,
      },
      {
        id: 'targeted',
        label: 'Targeted practice',
        count: 10,
        higherOrderMinimum: 0,
      },
    ],
    maximumFamilyRepetition: 2,
    historyPolicy: 'scored',
    custom: { minimumCount: 5, maximumCount: 50 },
    writtenPracticeAvailable: true,
  });

  const writtenBlueprint = practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: config.writtenBlueprintId,
    practiceFamilyId: config.practiceFamilyId,
    courseId: 'dispensing-optics-ii',
    moduleId: config.moduleId,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: GRADING_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds,
    profiles: [{
      id: 'written',
      label: 'Written practice',
      count: 2,
      higherOrderMinimum: 0,
    }],
    maximumFamilyRepetition: 2,
    historyPolicy: 'encounter-and-manual',
    writtenPracticeAvailable: true,
  });
  const compatibility = createCuratedCompatibility({
    experienceName: config.title + ' curated practice',
    courseId: 'dispensing-optics-ii',
    moduleId: config.moduleId,
    automaticBlueprint,
    writtenBlueprint,
  });

  function createSelection({
    profileId,
    strategy = 'mixed',
    requestedCount,
    selectedSectionIds = sectionIds,
    formats = AUTOMATIC_FORMATS,
    difficulties = DIFFICULTIES,
    seed,
  }: {
    profileId: string;
    strategy?: PracticeStrategy;
    requestedCount: number;
    selectedSectionIds?: string[];
    formats?: QuestionFormat[];
    difficulties?: Difficulty[];
    seed: string;
  }): PracticeSelectionSnapshot {
    return {
      schemaVersion: 1,
      blueprintId: config.automaticBlueprintId,
      practiceFamilyId: config.practiceFamilyId,
      profileId,
      strategy,
      requestedCount,
      sectionIds: [...selectedSectionIds],
      formats: [...formats],
      difficulties: [...difficulties],
      seed,
      resultMode: 'automatic',
      historyPolicy: 'scored',
    };
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
      questionIds = bank.questions
        .filter((question) => question.format === 'open_response')
        .map((question) => question.id)
        .sort();
      selection = withStrategyEvidence({
        schemaVersion: 1,
        blueprintId: config.writtenBlueprintId,
        practiceFamilyId: config.practiceFamilyId,
        profileId: 'written',
        strategy: 'mixed',
        requestedCount: questionIds.length,
        sectionIds: [...sectionIds],
        formats: ['open_response'],
        difficulties: [...DIFFICULTIES],
        seed,
        resultMode: 'manual-only',
        historyPolicy: 'encounter-and-manual',
      }, questionIds);
    } else {
      const profile = automaticBlueprint.profiles.find(
        (candidate) => candidate.id === request.profileId,
      );
      const requestedCount = request.requestedCount ?? profile?.count ?? 10;
      selection = createSelection({
        profileId: request.profileId,
        strategy: request.strategy
          ?? (request.profileId === 'custom' ? 'custom' : 'mixed'),
        requestedCount,
        selectedSectionIds: request.sectionIds
          ?? (profile?.sectionTargets
            ? Object.keys(profile.sectionTargets)
            : [...sectionIds]),
        formats: request.formats
          ?? (profile?.formatTargets
            ? Object.keys(profile.formatTargets) as QuestionFormat[]
            : AUTOMATIC_FORMATS),
        difficulties: request.difficulties
          ?? (profile?.difficultyTargets
            ? Object.keys(profile.difficultyTargets) as Difficulty[]
            : DIFFICULTIES),
        seed,
      });
      const validSelection = validatePracticeSelection(selection, automaticBlueprint);
      if (!validSelection.ok) return assemblyFailure(validSelection.issues);
      const assembly = assemblePractice({
        questions: bank.questions,
        blueprint: automaticBlueprint,
        selection,
        history: store.assessment.questionHistory,
        sectionFormatAvailability,
      });
      if (!assembly.ok) return assemblyFailure(assembly.issues);
      questionIds = assembly.value.questionIds;
      selection = assembly.value.selection;
    }

    const blueprint = written ? writtenBlueprint : automaticBlueprint;
    return createAssessmentAttempt({
      registry,
      questionIds,
      mode: blueprint.defaultMode,
      courseId: 'dispensing-optics-ii',
      moduleId: config.moduleId,
      blueprintId: blueprint.id,
      practiceSelection: selection,
      gradingPolicy: GRADING_POLICY,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
      random: createSeededRandom(seed),
    });
  }

  function Status({ compact = false }: { compact?: boolean }) {
    return <CuratedReleaseStatus compact={compact} summary={summary} />;
  }

  const definition: CuratedPracticeDefinition = {
    summary,
    automaticBlueprintId: automaticBlueprint.id,
    writtenBlueprintId: writtenBlueprint.id,
    registryResult,
    learner: {
      labels: { ...config.sectionLabels, ...FORMAT_LABELS },
      sectionIds,
      automaticFormats: AUTOMATIC_FORMATS,
      difficulties: DIFFICULTIES,
      questionPoolSize: 80,
      scoredFormatCount: 9,
      fullQuestionCount: 50,
      quickQuestionCount: 10,
      standardQuestionCount: 25,
      targetedQuestionCount: 10,
      writtenQuestionCount: 2,
      customMinimumCount: 5,
      customMaximumCount: 50,
      landingHeading: 'Course-aligned practice',
      landingDescription:
        'Build deterministic mixed-format practice from 80 OPT 370 draft questions; history remains on this device.',
      fullContractDescription:
        'Full practice uses 50 questions with section, format, difficulty, Bloom, objective and family constraints.',
      notesLabel: config.shortTitle + ' notes',
      statusComponent: Status,
    },
    defaultRequest: () => ({
      profileId: 'full',
      strategy: 'mixed',
      requestedCount: 50,
    }),
    replacementRequest: (attempt) => (
      attempt?.blueprintId === writtenBlueprint.id
        ? { profileId: 'written', requestedCount: 2 }
        : { profileId: 'full', strategy: 'mixed', requestedCount: 50 }
    ),
    createAttempt,
    validateAttempt: compatibility.validateAttempt,
    validateResult: compatibility.validateResult,
    historyPolicy: (attempt) => (
      attempt.blueprintId === writtenBlueprint.id
        ? writtenBlueprint.historyPolicy
        : automaticBlueprint.historyPolicy
    ),
    availability: (store) => {
      const available = (ids: string[]) => familyConstrainedCount(
        ids,
        automaticQuestions,
        automaticBlueprint.maximumFamilyRepetition,
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
  Object.freeze(definition);

  return Object.freeze({
    definition,
    automaticBlueprint,
    writtenBlueprint,
    registryBuilder,
    bank,
    sectionLabels: config.sectionLabels,
  });
}
