import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import {
  SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
  SYSTEMIC_PATHOLOGY_COURSE_ID,
  SYSTEMIC_PATHOLOGY_MODULE_ID,
  SYSTEMIC_PATHOLOGY_POLICY,
  SYSTEMIC_PATHOLOGY_PRACTICE_FAMILY_ID,
  SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/systemic-pathology/config';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';

export const SYSTEMIC_PATHOLOGY_SECTIONS = [
  'path-breast',
  'path-cardio',
  'path-endocrine',
  'path-gi',
  'path-renal',
] as const;
export const SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS: QuestionFormat[] = [
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
export const SYSTEMIC_PATHOLOGY_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];
export const SYSTEMIC_PATHOLOGY_OBJECTIVE_IDS =
  systemicPathologyCandidateBank.objectives
    .map((objective) => objective.id)
    .sort();

export const SYSTEMIC_PATHOLOGY_SECTION_FORMAT_AVAILABILITY =
  Object.fromEntries(
    SYSTEMIC_PATHOLOGY_SECTIONS.map((sectionId) => [
      sectionId,
      Object.fromEntries(SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS.map(
        (format) => [
          format,
          systemicPathologyCandidateBank.questions.filter(
            (question) => question.sectionId === sectionId
              && question.format === format,
          ).length,
        ],
      )),
    ]),
  );

export const SYSTEMIC_PATHOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS = {
  quick: {
    'path-breast': { true_false: 1, short_answer: 1 },
    'path-cardio': { single_best_answer: 1, multiple_response: 1 },
    'path-endocrine': { single_best_answer: 2 },
    'path-gi': { single_best_answer: 1, matching: 1 },
    'path-renal': { single_best_answer: 2 },
  },
  standard: {
    'path-breast': { single_best_answer: 4, multiple_response: 1 },
    'path-cardio': { single_best_answer: 3, matching: 1, image_hotspot: 1 },
    'path-endocrine': { single_best_answer: 2, multiple_response: 1, extended_matching: 1, short_answer: 1 },
    'path-gi': { single_best_answer: 2, true_false: 1, multiple_response: 1, ordering: 1 },
    'path-renal': { single_best_answer: 3, true_false: 1, matching: 1 },
  },
  full: {
    'path-breast': { single_best_answer: 4, true_false: 1, multiple_response: 1, matching: 1, extended_matching: 1, ordering: 1, short_answer: 1 },
    'path-cardio': { single_best_answer: 7, multiple_response: 1, matching: 1, image_hotspot: 1 },
    'path-endocrine': { single_best_answer: 3, true_false: 1, multiple_response: 1, matching: 1, extended_matching: 1, ordering: 1, image_label: 1, short_answer: 1 },
    'path-gi': { single_best_answer: 7, true_false: 1, multiple_response: 1, image_label: 1 },
    'path-renal': { single_best_answer: 7, multiple_response: 1, matching: 1, image_hotspot: 1 },
  },
} as const;

export const systemicPathologyCuratedPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
    practiceFamilyId: SYSTEMIC_PATHOLOGY_PRACTICE_FAMILY_ID,
    courseId: SYSTEMIC_PATHOLOGY_COURSE_ID,
    moduleId: SYSTEMIC_PATHOLOGY_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: SYSTEMIC_PATHOLOGY_POLICY,
    eligibleFormats: SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds: SYSTEMIC_PATHOLOGY_SECTIONS,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: {
          'path-breast': 2,
          'path-cardio': 2,
          'path-endocrine': 2,
          'path-gi': 2,
          'path-renal': 2,
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
          'path-breast': 5,
          'path-cardio': 5,
          'path-endocrine': 5,
          'path-gi': 5,
          'path-renal': 5,
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
          'path-breast': 10,
          'path-cardio': 10,
          'path-endocrine': 10,
          'path-gi': 10,
          'path-renal': 10,
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
        requiredObjectiveIds: SYSTEMIC_PATHOLOGY_OBJECTIVE_IDS,
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

export const systemicPathologyWrittenPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: SYSTEMIC_PATHOLOGY_PRACTICE_FAMILY_ID,
    courseId: SYSTEMIC_PATHOLOGY_COURSE_ID,
    moduleId: SYSTEMIC_PATHOLOGY_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: SYSTEMIC_PATHOLOGY_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds: SYSTEMIC_PATHOLOGY_SECTIONS,
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

export function createSystemicPathologyPracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = [...SYSTEMIC_PATHOLOGY_SECTIONS],
  formats = SYSTEMIC_PATHOLOGY_AUTOMATIC_FORMATS,
  difficulties = SYSTEMIC_PATHOLOGY_DIFFICULTIES,
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
    blueprintId: SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
    practiceFamilyId: SYSTEMIC_PATHOLOGY_PRACTICE_FAMILY_ID,
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

export function createSystemicPathologyWrittenSelection(
  seed: string,
): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: SYSTEMIC_PATHOLOGY_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: [...SYSTEMIC_PATHOLOGY_SECTIONS],
    formats: ['open_response'],
    difficulties: [...SYSTEMIC_PATHOLOGY_DIFFICULTIES],
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}
