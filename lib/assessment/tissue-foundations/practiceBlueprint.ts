import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import {
  TISSUE_CURATED_BLUEPRINT_ID,
  TISSUE_CURATED_COURSE_ID,
  TISSUE_CURATED_MODULE_ID,
  TISSUE_CURATED_POLICY,
  TISSUE_PRACTICE_FAMILY_ID,
  TISSUE_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/tissue-foundations/config';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';

export const TISSUE_SECTIONS = [
  'tissue-nervous',
  'tissue-epithelium',
  'tissue-connective',
] as const;
export const TISSUE_AUTOMATIC_FORMATS: QuestionFormat[] = [
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
export const TISSUE_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];
export const TISSUE_OBJECTIVE_IDS = tissueFoundationsCandidateBank.objectives
  .map((objective) => objective.id)
  .sort();

export const TISSUE_SECTION_FORMAT_AVAILABILITY = Object.fromEntries(
  TISSUE_SECTIONS.map((sectionId) => [
    sectionId,
    Object.fromEntries(TISSUE_AUTOMATIC_FORMATS.map((format) => [
      format,
      tissueFoundationsCandidateBank.questions.filter(
        (question) => (
          question.sectionId === sectionId
          && question.format === format
        ),
      ).length,
    ])),
  ]),
);

export const TISSUE_PROFILE_SECTION_FORMAT_ALLOCATIONS = {
  quick: {
    'tissue-nervous': {
      single_best_answer: 2,
      true_false: 1,
      multiple_response: 1,
      matching: 1,
      short_answer: 1,
    },
    'tissue-epithelium': { single_best_answer: 2 },
    'tissue-connective': { single_best_answer: 2 },
  },
  standard: {
    'tissue-nervous': {
      single_best_answer: 9,
      true_false: 2,
      ordering: 1,
      image_label: 1,
      short_answer: 1,
    },
    'tissue-epithelium': {
      single_best_answer: 2,
      multiple_response: 2,
      matching: 2,
    },
    'tissue-connective': {
      single_best_answer: 3,
      multiple_response: 1,
      extended_matching: 1,
    },
  },
  full: {
    'tissue-nervous': {
      single_best_answer: 16,
      true_false: 3,
      multiple_response: 3,
      matching: 2,
      ordering: 2,
      image_label: 1,
      short_answer: 1,
    },
    'tissue-epithelium': {
      single_best_answer: 7,
      true_false: 1,
      multiple_response: 1,
      matching: 1,
      extended_matching: 1,
      image_hotspot: 1,
    },
    'tissue-connective': {
      single_best_answer: 5,
      multiple_response: 2,
      matching: 1,
      extended_matching: 1,
      short_answer: 1,
    },
  },
} as const;

export const tissueCuratedPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: TISSUE_CURATED_BLUEPRINT_ID,
    practiceFamilyId: TISSUE_PRACTICE_FAMILY_ID,
    courseId: TISSUE_CURATED_COURSE_ID,
    moduleId: TISSUE_CURATED_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: TISSUE_CURATED_POLICY,
    eligibleFormats: TISSUE_AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds: TISSUE_SECTIONS,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: {
          'tissue-nervous': 6,
          'tissue-epithelium': 2,
          'tissue-connective': 2,
        },
        formatTargets: {
          single_best_answer: 6,
          true_false: 1,
          multiple_response: 1,
          matching: 1,
          short_answer: 1,
        },
        difficultyTargets: {
          foundation: 3,
          intermediate: 5,
          advanced: 2,
        },
        higherOrderMinimum: 4,
        higherOrderMaximum: 6,
      },
      {
        id: 'standard',
        label: 'Standard practice',
        count: 25,
        sectionTargets: {
          'tissue-nervous': 14,
          'tissue-epithelium': 6,
          'tissue-connective': 5,
        },
        formatTargets: {
          single_best_answer: 14,
          true_false: 2,
          multiple_response: 3,
          matching: 2,
          extended_matching: 1,
          ordering: 1,
          image_label: 1,
          short_answer: 1,
        },
        difficultyTargets: {
          foundation: 7,
          intermediate: 13,
          advanced: 5,
        },
        higherOrderMinimum: 10,
        higherOrderMaximum: 16,
      },
      {
        id: 'full',
        label: 'Full practice',
        count: 50,
        sectionTargets: {
          'tissue-nervous': 28,
          'tissue-epithelium': 12,
          'tissue-connective': 10,
        },
        formatTargets: {
          single_best_answer: 28,
          true_false: 4,
          multiple_response: 6,
          matching: 4,
          extended_matching: 2,
          ordering: 2,
          image_hotspot: 1,
          image_label: 1,
          short_answer: 2,
        },
        difficultyTargets: {
          foundation: 15,
          intermediate: 27,
          advanced: 8,
        },
        higherOrderMinimum: 22,
        higherOrderMaximum: 32,
        requiredObjectiveIds: TISSUE_OBJECTIVE_IDS,
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

export const tissueWrittenPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: TISSUE_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: TISSUE_PRACTICE_FAMILY_ID,
    courseId: TISSUE_CURATED_COURSE_ID,
    moduleId: TISSUE_CURATED_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: TISSUE_CURATED_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds: TISSUE_SECTIONS,
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

export function createTissuePracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = [...TISSUE_SECTIONS],
  formats = TISSUE_AUTOMATIC_FORMATS,
  difficulties = TISSUE_DIFFICULTIES,
  seed,
}: {
  profileId: string;
  strategy?: PracticeStrategy;
  requestedCount: number;
  sectionIds?: string[];
  formats?: QuestionFormat[];
  difficulties?: Difficulty[];
  seed: string;
}): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: TISSUE_CURATED_BLUEPRINT_ID,
    practiceFamilyId: TISSUE_PRACTICE_FAMILY_ID,
    profileId,
    strategy,
    requestedCount,
    sectionIds: [...sectionIds],
    formats: [...formats],
    difficulties: [...difficulties],
    seed,
    resultMode: 'automatic',
    historyPolicy: 'scored',
  };
}

export function createTissueWrittenSelection(
  seed: string,
): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: TISSUE_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: TISSUE_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: [...TISSUE_SECTIONS],
    formats: ['open_response'],
    difficulties: [...TISSUE_DIFFICULTIES],
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}
