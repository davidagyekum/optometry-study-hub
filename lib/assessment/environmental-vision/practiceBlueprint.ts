import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import {
  ENVIRONMENTAL_VISION_BLUEPRINT_ID,
  ENVIRONMENTAL_VISION_COURSE_ID,
  ENVIRONMENTAL_VISION_MODULE_ID,
  ENVIRONMENTAL_VISION_POLICY,
  ENVIRONMENTAL_VISION_PRACTICE_FAMILY_ID,
  ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/environmental-vision/config';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';

export const ENVIRONMENTAL_VISION_SECTIONS = [
  'env-optics',
  'env-task',
  'env-ergonomics',
  'env-hazards',
  'env-protection',
  'env-lighting',
] as const;
export const ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS: QuestionFormat[] = [
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
export const ENVIRONMENTAL_VISION_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];
export const ENVIRONMENTAL_VISION_OBJECTIVE_IDS =
  environmentalVisionCandidateBank.objectives
    .map((objective) => objective.id)
    .sort();

export const ENVIRONMENTAL_VISION_SECTION_FORMAT_AVAILABILITY =
  Object.fromEntries(
    ENVIRONMENTAL_VISION_SECTIONS.map((sectionId) => [
      sectionId,
      Object.fromEntries(ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS.map(
        (format) => [
          format,
          environmentalVisionCandidateBank.questions.filter(
            (question) => question.sectionId === sectionId
              && question.format === format,
          ).length,
        ],
      )),
    ]),
  );

export const ENVIRONMENTAL_VISION_PROFILE_SECTION_FORMAT_ALLOCATIONS = {
  quick: {
    'env-optics': { single_best_answer: 1, short_answer: 1 },
    'env-task': { single_best_answer: 1, true_false: 1 },
    'env-ergonomics': { single_best_answer: 1, multiple_response: 1 },
    'env-hazards': { single_best_answer: 2 },
    'env-protection': { single_best_answer: 1 },
    'env-lighting': { matching: 1 },
  },
  standard: {
    'env-optics': {
      single_best_answer: 3,
      ordering: 1,
      short_answer: 1,
    },
    'env-task': { single_best_answer: 3, true_false: 1 },
    'env-ergonomics': {
      single_best_answer: 1,
      true_false: 1,
      multiple_response: 1,
      matching: 1,
    },
    'env-hazards': {
      single_best_answer: 2,
      extended_matching: 1,
      image_hotspot: 1,
    },
    'env-protection': {
      single_best_answer: 3,
      multiple_response: 1,
    },
    'env-lighting': {
      single_best_answer: 2,
      multiple_response: 1,
      matching: 1,
    },
  },
  full: {
    'env-optics': {
      single_best_answer: 5,
      true_false: 1,
      multiple_response: 1,
      ordering: 1,
      short_answer: 1,
    },
    'env-task': {
      single_best_answer: 6,
      true_false: 1,
      matching: 1,
    },
    'env-ergonomics': {
      single_best_answer: 3,
      true_false: 1,
      multiple_response: 1,
      matching: 1,
      image_hotspot: 1,
      image_label: 1,
    },
    'env-hazards': {
      single_best_answer: 5,
      multiple_response: 1,
      extended_matching: 1,
      ordering: 1,
      image_hotspot: 1,
    },
    'env-protection': {
      single_best_answer: 7,
      multiple_response: 1,
    },
    'env-lighting': {
      single_best_answer: 2,
      multiple_response: 1,
      matching: 2,
      extended_matching: 1,
      image_label: 1,
      short_answer: 1,
    },
  },
} as const;

export const environmentalVisionCuratedPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: ENVIRONMENTAL_VISION_BLUEPRINT_ID,
    practiceFamilyId: ENVIRONMENTAL_VISION_PRACTICE_FAMILY_ID,
    courseId: ENVIRONMENTAL_VISION_COURSE_ID,
    moduleId: ENVIRONMENTAL_VISION_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: ENVIRONMENTAL_VISION_POLICY,
    eligibleFormats: ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds: ENVIRONMENTAL_VISION_SECTIONS,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: {
          'env-optics': 2,
          'env-task': 2,
          'env-ergonomics': 2,
          'env-hazards': 2,
          'env-protection': 1,
          'env-lighting': 1,
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
        higherOrderMinimum: 6,
        higherOrderMaximum: 10,
      },
      {
        id: 'standard',
        label: 'Standard practice',
        count: 25,
        sectionTargets: {
          'env-optics': 5,
          'env-task': 4,
          'env-ergonomics': 4,
          'env-hazards': 4,
          'env-protection': 4,
          'env-lighting': 4,
        },
        formatTargets: {
          single_best_answer: 14,
          true_false: 2,
          multiple_response: 3,
          matching: 2,
          extended_matching: 1,
          ordering: 1,
          image_hotspot: 1,
          short_answer: 1,
        },
        difficultyTargets: {
          foundation: 7,
          intermediate: 13,
          advanced: 5,
        },
        higherOrderMinimum: 16,
        higherOrderMaximum: 25,
      },
      {
        id: 'full',
        label: 'Full practice',
        count: 50,
        sectionTargets: {
          'env-optics': 9,
          'env-task': 8,
          'env-ergonomics': 8,
          'env-hazards': 9,
          'env-protection': 8,
          'env-lighting': 8,
        },
        formatTargets: {
          single_best_answer: 28,
          true_false: 3,
          multiple_response: 5,
          matching: 4,
          extended_matching: 2,
          ordering: 2,
          image_hotspot: 2,
          image_label: 2,
          short_answer: 2,
        },
        difficultyTargets: {
          foundation: 14,
          intermediate: 27,
          advanced: 9,
        },
        higherOrderMinimum: 35,
        higherOrderMaximum: 50,
        requiredObjectiveIds: ENVIRONMENTAL_VISION_OBJECTIVE_IDS,
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

export const environmentalVisionWrittenPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: ENVIRONMENTAL_VISION_PRACTICE_FAMILY_ID,
    courseId: ENVIRONMENTAL_VISION_COURSE_ID,
    moduleId: ENVIRONMENTAL_VISION_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: ENVIRONMENTAL_VISION_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds: ENVIRONMENTAL_VISION_SECTIONS,
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

export function createEnvironmentalVisionPracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = [...ENVIRONMENTAL_VISION_SECTIONS],
  formats = ENVIRONMENTAL_VISION_AUTOMATIC_FORMATS,
  difficulties = ENVIRONMENTAL_VISION_DIFFICULTIES,
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
    blueprintId: ENVIRONMENTAL_VISION_BLUEPRINT_ID,
    practiceFamilyId: ENVIRONMENTAL_VISION_PRACTICE_FAMILY_ID,
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

export function createEnvironmentalVisionWrittenSelection(
  seed: string,
): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: ENVIRONMENTAL_VISION_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: [...ENVIRONMENTAL_VISION_SECTIONS],
    formats: ['open_response'],
    difficulties: [...ENVIRONMENTAL_VISION_DIFFICULTIES],
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}
