import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import {
  AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
  AQUEOUS_VITREOUS_CURATED_COURSE_ID,
  AQUEOUS_VITREOUS_CURATED_MODULE_ID,
  AQUEOUS_VITREOUS_CURATED_POLICY,
  AQUEOUS_VITREOUS_PRACTICE_FAMILY_ID,
  AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/aqueous-vitreous-curated/config';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';

export const AQUEOUS_VITREOUS_SECTIONS = [
  'media-chambers',
  'production',
  'flow',
  'iop',
  'vitreous-anatomy',
  'vitreous-clinical',
] as const;
export const AQUEOUS_VITREOUS_AUTOMATIC_FORMATS: QuestionFormat[] = [
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
export const AQUEOUS_VITREOUS_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];
export const AQUEOUS_VITREOUS_OBJECTIVE_IDS = aqueousVitreousCandidateBank.objectives
  .map((objective) => objective.id)
  .sort();

export const AQUEOUS_VITREOUS_SECTION_FORMAT_AVAILABILITY = Object.fromEntries(
  AQUEOUS_VITREOUS_SECTIONS.map((sectionId) => [
    sectionId,
    Object.fromEntries(AQUEOUS_VITREOUS_AUTOMATIC_FORMATS.map((format) => [
      format,
      aqueousVitreousCandidateBank.questions.filter(
        (question) => question.sectionId === sectionId
          && question.format === format,
      ).length,
    ])),
  ]),
);

export const AQUEOUS_VITREOUS_PROFILE_SECTION_FORMAT_ALLOCATIONS = {
  quick: {
    'media-chambers': { ordering: 1, image_hotspot: 1 },
    production: { single_best_answer: 1, true_false: 1 },
    flow: { single_best_answer: 1, multiple_response: 1 },
    iop: { single_best_answer: 1, short_answer: 1 },
    'vitreous-anatomy': { matching: 1 },
    'vitreous-clinical': { single_best_answer: 1 },
  },
  standard: {
    'media-chambers': {
      true_false: 1,
      image_hotspot: 1,
      image_label: 1,
      short_answer: 1,
    },
    production: { single_best_answer: 1, matching: 1, ordering: 2 },
    flow: { single_best_answer: 1, matching: 2, extended_matching: 2 },
    iop: { single_best_answer: 2, multiple_response: 1, short_answer: 1 },
    'vitreous-anatomy': {
      single_best_answer: 2,
      true_false: 1,
      multiple_response: 1,
    },
    'vitreous-clinical': { single_best_answer: 3, multiple_response: 1 },
  },
  full: {
    'media-chambers': {
      single_best_answer: 1,
      true_false: 1,
      multiple_response: 1,
      ordering: 1,
      image_hotspot: 1,
      image_label: 1,
      short_answer: 1,
    },
    production: {
      single_best_answer: 3,
      multiple_response: 2,
      matching: 2,
      ordering: 1,
    },
    flow: {
      single_best_answer: 3,
      matching: 1,
      extended_matching: 2,
      ordering: 2,
      image_hotspot: 1,
    },
    iop: {
      single_best_answer: 3,
      true_false: 1,
      multiple_response: 1,
      matching: 2,
      image_label: 1,
      short_answer: 1,
    },
    'vitreous-anatomy': {
      single_best_answer: 2,
      true_false: 1,
      multiple_response: 1,
      matching: 1,
      ordering: 1,
      image_hotspot: 1,
      image_label: 1,
    },
    'vitreous-clinical': {
      single_best_answer: 4,
      true_false: 1,
      multiple_response: 1,
      extended_matching: 2,
      short_answer: 1,
    },
  },
} as const;

export const aqueousVitreousCuratedPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
    practiceFamilyId: AQUEOUS_VITREOUS_PRACTICE_FAMILY_ID,
    courseId: AQUEOUS_VITREOUS_CURATED_COURSE_ID,
    moduleId: AQUEOUS_VITREOUS_CURATED_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: AQUEOUS_VITREOUS_CURATED_POLICY,
    eligibleFormats: AQUEOUS_VITREOUS_AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds: AQUEOUS_VITREOUS_SECTIONS,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: {
          'media-chambers': 2,
          production: 2,
          flow: 2,
          iop: 2,
          'vitreous-anatomy': 1,
          'vitreous-clinical': 1,
        },
        formatTargets: {
          single_best_answer: 4,
          true_false: 1,
          multiple_response: 1,
          matching: 1,
          ordering: 1,
          image_hotspot: 1,
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
          'media-chambers': 4,
          production: 4,
          flow: 5,
          iop: 4,
          'vitreous-anatomy': 4,
          'vitreous-clinical': 4,
        },
        formatTargets: {
          single_best_answer: 9,
          true_false: 2,
          multiple_response: 3,
          matching: 3,
          extended_matching: 2,
          ordering: 2,
          image_hotspot: 1,
          image_label: 1,
          short_answer: 2,
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
          'media-chambers': 7,
          production: 8,
          flow: 9,
          iop: 9,
          'vitreous-anatomy': 8,
          'vitreous-clinical': 9,
        },
        formatTargets: {
          single_best_answer: 16,
          true_false: 4,
          multiple_response: 6,
          matching: 6,
          extended_matching: 4,
          ordering: 5,
          image_hotspot: 3,
          image_label: 3,
          short_answer: 3,
        },
        difficultyTargets: {
          foundation: 13,
          intermediate: 26,
          advanced: 11,
        },
        higherOrderMinimum: 32,
        higherOrderMaximum: 42,
        requiredObjectiveIds: AQUEOUS_VITREOUS_OBJECTIVE_IDS,
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

export const aqueousVitreousWrittenPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: AQUEOUS_VITREOUS_PRACTICE_FAMILY_ID,
    courseId: AQUEOUS_VITREOUS_CURATED_COURSE_ID,
    moduleId: AQUEOUS_VITREOUS_CURATED_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: AQUEOUS_VITREOUS_CURATED_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds: AQUEOUS_VITREOUS_SECTIONS,
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

export function createAqueousVitreousPracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = [...AQUEOUS_VITREOUS_SECTIONS],
  formats = AQUEOUS_VITREOUS_AUTOMATIC_FORMATS,
  difficulties = AQUEOUS_VITREOUS_DIFFICULTIES,
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
    blueprintId: AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
    practiceFamilyId: AQUEOUS_VITREOUS_PRACTICE_FAMILY_ID,
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

export function createAqueousVitreousWrittenSelection(
  seed: string,
): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: AQUEOUS_VITREOUS_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: [...AQUEOUS_VITREOUS_SECTIONS],
    formats: ['open_response'],
    difficulties: [...AQUEOUS_VITREOUS_DIFFICULTIES],
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}
