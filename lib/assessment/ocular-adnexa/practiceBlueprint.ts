import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import {
  OCULAR_ADNEXA_BLUEPRINT_ID,
  OCULAR_ADNEXA_COURSE_ID,
  OCULAR_ADNEXA_MODULE_ID,
  OCULAR_ADNEXA_POLICY,
  OCULAR_ADNEXA_PRACTICE_FAMILY_ID,
  OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/ocular-adnexa/config';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';

export const OCULAR_ADNEXA_SECTIONS = [
  'landmarks',
  'muscles',
  'tarsus-glands',
  'lower-lid-blood',
  'lacrimal-gland',
  'tears',
] as const;
export const OCULAR_ADNEXA_AUTOMATIC_FORMATS: QuestionFormat[] = [
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
export const OCULAR_ADNEXA_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];
export const OCULAR_ADNEXA_OBJECTIVE_IDS = ocularAdnexaCandidateBank.objectives
  .map((objective) => objective.id)
  .sort();

export const OCULAR_ADNEXA_SECTION_FORMAT_AVAILABILITY = Object.fromEntries(
  OCULAR_ADNEXA_SECTIONS.map((sectionId) => [
    sectionId,
    Object.fromEntries(OCULAR_ADNEXA_AUTOMATIC_FORMATS.map((format) => [
      format,
      ocularAdnexaCandidateBank.questions.filter(
        (question) => question.sectionId === sectionId
          && question.format === format,
      ).length,
    ])),
  ]),
);

export const OCULAR_ADNEXA_PROFILE_SECTION_FORMAT_ALLOCATIONS = {
  quick: {
    landmarks: { single_best_answer: 1 },
    muscles: { single_best_answer: 1, short_answer: 1 },
    'tarsus-glands': { single_best_answer: 1, multiple_response: 1 },
    'lower-lid-blood': { single_best_answer: 1 },
    'lacrimal-gland': { single_best_answer: 1, matching: 1 },
    tears: { single_best_answer: 1, true_false: 1 },
  },
  standard: {
    landmarks: { single_best_answer: 2, matching: 1 },
    muscles: {
      single_best_answer: 3,
      multiple_response: 1,
      short_answer: 1,
    },
    'tarsus-glands': {
      single_best_answer: 3,
      multiple_response: 1,
      matching: 1,
      ordering: 1,
    },
    'lower-lid-blood': { single_best_answer: 1, true_false: 1 },
    'lacrimal-gland': {
      single_best_answer: 2,
      image_label: 1,
      extended_matching: 1,
    },
    tears: {
      single_best_answer: 3,
      true_false: 1,
      multiple_response: 1,
    },
  },
  full: {
    landmarks: {
      single_best_answer: 4,
      true_false: 1,
      matching: 1,
    },
    muscles: {
      single_best_answer: 6,
      multiple_response: 1,
      matching: 1,
      ordering: 1,
      short_answer: 1,
    },
    'tarsus-glands': {
      single_best_answer: 6,
      true_false: 1,
      multiple_response: 2,
      matching: 1,
      image_hotspot: 1,
    },
    'lower-lid-blood': {
      single_best_answer: 3,
      multiple_response: 1,
      extended_matching: 1,
    },
    'lacrimal-gland': {
      single_best_answer: 4,
      true_false: 1,
      image_label: 1,
      extended_matching: 1,
      short_answer: 1,
    },
    tears: {
      single_best_answer: 5,
      true_false: 1,
      multiple_response: 2,
      matching: 1,
      ordering: 1,
    },
  },
} as const;

export const ocularAdnexaCuratedPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: OCULAR_ADNEXA_BLUEPRINT_ID,
    practiceFamilyId: OCULAR_ADNEXA_PRACTICE_FAMILY_ID,
    courseId: OCULAR_ADNEXA_COURSE_ID,
    moduleId: OCULAR_ADNEXA_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: OCULAR_ADNEXA_POLICY,
    eligibleFormats: OCULAR_ADNEXA_AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds: OCULAR_ADNEXA_SECTIONS,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: {
          landmarks: 1,
          muscles: 2,
          'tarsus-glands': 2,
          'lower-lid-blood': 1,
          'lacrimal-gland': 2,
          tears: 2,
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
          landmarks: 3,
          muscles: 5,
          'tarsus-glands': 6,
          'lower-lid-blood': 2,
          'lacrimal-gland': 4,
          tears: 5,
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
        higherOrderMinimum: 13,
        higherOrderMaximum: 20,
      },
      {
        id: 'full',
        label: 'Full practice',
        count: 50,
        sectionTargets: {
          landmarks: 6,
          muscles: 10,
          'tarsus-glands': 11,
          'lower-lid-blood': 5,
          'lacrimal-gland': 8,
          tears: 10,
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
          foundation: 14,
          intermediate: 26,
          advanced: 10,
        },
        higherOrderMinimum: 30,
        higherOrderMaximum: 40,
        requiredObjectiveIds: OCULAR_ADNEXA_OBJECTIVE_IDS,
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

export const ocularAdnexaWrittenPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: OCULAR_ADNEXA_PRACTICE_FAMILY_ID,
    courseId: OCULAR_ADNEXA_COURSE_ID,
    moduleId: OCULAR_ADNEXA_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: OCULAR_ADNEXA_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds: OCULAR_ADNEXA_SECTIONS,
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

export function createOcularAdnexaPracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = [...OCULAR_ADNEXA_SECTIONS],
  formats = OCULAR_ADNEXA_AUTOMATIC_FORMATS,
  difficulties = OCULAR_ADNEXA_DIFFICULTIES,
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
    blueprintId: OCULAR_ADNEXA_BLUEPRINT_ID,
    practiceFamilyId: OCULAR_ADNEXA_PRACTICE_FAMILY_ID,
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

export function createOcularAdnexaWrittenSelection(
  seed: string,
): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: OCULAR_ADNEXA_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: [...OCULAR_ADNEXA_SECTIONS],
    formats: ['open_response'],
    difficulties: [...OCULAR_ADNEXA_DIFFICULTIES],
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}
