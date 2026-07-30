import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import {
  BLOOD_SUPPLY_BLUEPRINT_ID,
  BLOOD_SUPPLY_COURSE_ID,
  BLOOD_SUPPLY_MODULE_ID,
  BLOOD_SUPPLY_POLICY,
  BLOOD_SUPPLY_PRACTICE_FAMILY_ID,
  BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/blood-supply/config';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';

export const BLOOD_SUPPLY_SECTIONS = [
  'arterial-origins',
  'ciliary',
  'retinal',
  'barriers',
  'microcirculation',
  'clinical-blood',
] as const;
export const BLOOD_SUPPLY_AUTOMATIC_FORMATS: QuestionFormat[] = [
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
export const BLOOD_SUPPLY_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];
export const BLOOD_SUPPLY_OBJECTIVE_IDS = bloodSupplyCandidateBank.objectives
  .map((objective) => objective.id)
  .sort();

export const BLOOD_SUPPLY_SECTION_FORMAT_AVAILABILITY = Object.fromEntries(
  BLOOD_SUPPLY_SECTIONS.map((sectionId) => [
    sectionId,
    Object.fromEntries(BLOOD_SUPPLY_AUTOMATIC_FORMATS.map((format) => [
      format,
      bloodSupplyCandidateBank.questions.filter(
        (question) => question.sectionId === sectionId
          && question.format === format,
      ).length,
    ])),
  ]),
);

export const BLOOD_SUPPLY_PROFILE_SECTION_FORMAT_ALLOCATIONS = {
  quick: {
    'arterial-origins': { single_best_answer: 1 },
    ciliary: { single_best_answer: 1, short_answer: 1 },
    retinal: { single_best_answer: 1, multiple_response: 1 },
    barriers: { single_best_answer: 1 },
    microcirculation: { single_best_answer: 1, matching: 1 },
    'clinical-blood': { single_best_answer: 1, true_false: 1 },
  },
  standard: {
    'arterial-origins': { single_best_answer: 2, matching: 1 },
    ciliary: {
      single_best_answer: 3,
      multiple_response: 1,
      short_answer: 1,
    },
    retinal: {
      single_best_answer: 3,
      multiple_response: 1,
      matching: 1,
      ordering: 1,
    },
    barriers: { single_best_answer: 1, true_false: 1 },
    microcirculation: {
      single_best_answer: 2,
      extended_matching: 1,
      image_hotspot: 1,
    },
    'clinical-blood': {
      single_best_answer: 3,
      true_false: 1,
      multiple_response: 1,
    },
  },
  full: {
    'arterial-origins': {
      single_best_answer: 4,
      true_false: 1,
      multiple_response: 1,
      matching: 1,
      image_label: 1,
    },
    ciliary: {
      single_best_answer: 4,
      matching: 1,
      extended_matching: 1,
      image_hotspot: 1,
      image_label: 1,
      short_answer: 1,
    },
    retinal: {
      single_best_answer: 3,
      true_false: 1,
      matching: 2,
      extended_matching: 1,
      ordering: 1,
      image_label: 1,
      short_answer: 1,
    },
    barriers: {
      single_best_answer: 3,
      multiple_response: 2,
      extended_matching: 1,
      ordering: 1,
      image_label: 1,
      short_answer: 1,
    },
    microcirculation: {
      single_best_answer: 3,
      multiple_response: 1,
      matching: 1,
      extended_matching: 1,
      short_answer: 1,
    },
    'clinical-blood': {
      single_best_answer: 4,
      true_false: 1,
      multiple_response: 1,
      extended_matching: 1,
    },
  },
} as const;

export const bloodSupplyCuratedPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: BLOOD_SUPPLY_BLUEPRINT_ID,
    practiceFamilyId: BLOOD_SUPPLY_PRACTICE_FAMILY_ID,
    courseId: BLOOD_SUPPLY_COURSE_ID,
    moduleId: BLOOD_SUPPLY_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: BLOOD_SUPPLY_POLICY,
    eligibleFormats: BLOOD_SUPPLY_AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds: BLOOD_SUPPLY_SECTIONS,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: {
          'arterial-origins': 1,
          ciliary: 2,
          retinal: 2,
          barriers: 1,
          microcirculation: 2,
          'clinical-blood': 2,
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
        higherOrderMinimum: 5,
        higherOrderMaximum: 8,
      },
      {
        id: 'standard',
        label: 'Standard practice',
        count: 25,
        sectionTargets: {
          'arterial-origins': 3,
          ciliary: 5,
          retinal: 6,
          barriers: 2,
          microcirculation: 4,
          'clinical-blood': 5,
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
        higherOrderMinimum: 14,
        higherOrderMaximum: 21,
      },
      {
        id: 'full',
        label: 'Full practice',
        count: 50,
        sectionTargets: {
          'arterial-origins': 8,
          ciliary: 9,
          retinal: 10,
          barriers: 9,
          microcirculation: 7,
          'clinical-blood': 7,
        },
        formatTargets: {
          single_best_answer: 21,
          true_false: 3,
          multiple_response: 5,
          matching: 5,
          extended_matching: 5,
          ordering: 2,
          image_hotspot: 1,
          image_label: 4,
          short_answer: 4,
        },
        difficultyTargets: {
          foundation: 13,
          intermediate: 26,
          advanced: 11,
        },
        higherOrderMinimum: 34,
        higherOrderMaximum: 42,
        requiredObjectiveIds: BLOOD_SUPPLY_OBJECTIVE_IDS,
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

export const bloodSupplyWrittenPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: BLOOD_SUPPLY_PRACTICE_FAMILY_ID,
    courseId: BLOOD_SUPPLY_COURSE_ID,
    moduleId: BLOOD_SUPPLY_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: BLOOD_SUPPLY_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds: BLOOD_SUPPLY_SECTIONS,
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

export function createBloodSupplyPracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = [...BLOOD_SUPPLY_SECTIONS],
  formats = BLOOD_SUPPLY_AUTOMATIC_FORMATS,
  difficulties = BLOOD_SUPPLY_DIFFICULTIES,
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
    blueprintId: BLOOD_SUPPLY_BLUEPRINT_ID,
    practiceFamilyId: BLOOD_SUPPLY_PRACTICE_FAMILY_ID,
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

export function createBloodSupplyWrittenSelection(
  seed: string,
): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: BLOOD_SUPPLY_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: [...BLOOD_SUPPLY_SECTIONS],
    formats: ['open_response'],
    difficulties: [...BLOOD_SUPPLY_DIFFICULTIES],
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}
