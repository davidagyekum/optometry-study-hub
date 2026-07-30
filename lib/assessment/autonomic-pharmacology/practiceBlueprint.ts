import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import {
  AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
  AUTONOMIC_PHARMACOLOGY_COURSE_ID,
  AUTONOMIC_PHARMACOLOGY_MODULE_ID,
  AUTONOMIC_PHARMACOLOGY_POLICY,
  AUTONOMIC_PHARMACOLOGY_PRACTICE_FAMILY_ID,
  AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/autonomic-pharmacology/config';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';

export const AUTONOMIC_PHARMACOLOGY_SECTIONS = [
  'pharm-adrenergic',
  'pharm-cholinergic',
] as const;
export const AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS: QuestionFormat[] = [
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
export const AUTONOMIC_PHARMACOLOGY_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];
export const AUTONOMIC_PHARMACOLOGY_OBJECTIVE_IDS =
  autonomicPharmacologyCandidateBank.objectives
    .map((objective) => objective.id)
    .sort();

export const AUTONOMIC_PHARMACOLOGY_SECTION_FORMAT_AVAILABILITY =
  Object.fromEntries(
    AUTONOMIC_PHARMACOLOGY_SECTIONS.map((sectionId) => [
      sectionId,
      Object.fromEntries(AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS.map(
        (format) => [
          format,
          autonomicPharmacologyCandidateBank.questions.filter(
            (question) => question.sectionId === sectionId
              && question.format === format,
          ).length,
        ],
      )),
    ]),
  );

export const AUTONOMIC_PHARMACOLOGY_PROFILE_SECTION_FORMAT_ALLOCATIONS = {
  quick: {
    'pharm-adrenergic': { single_best_answer: 3, multiple_response: 1, short_answer: 1 },
    'pharm-cholinergic': { single_best_answer: 3, true_false: 1, matching: 1 },
  },
  standard: {
    'pharm-adrenergic': {
      single_best_answer: 6,
      true_false: 1,
      multiple_response: 1,
      matching: 2,
      image_hotspot: 1,
      short_answer: 1,
    },
    'pharm-cholinergic': {
      single_best_answer: 8,
      true_false: 1,
      multiple_response: 2,
      extended_matching: 1,
      ordering: 1,
    },
  },
  full: {
    'pharm-adrenergic': {
      single_best_answer: 16,
      true_false: 2,
      multiple_response: 2,
      matching: 1,
      extended_matching: 1,
      ordering: 1,
      image_label: 1,
      short_answer: 1,
    },
    'pharm-cholinergic': {
      single_best_answer: 12,
      true_false: 1,
      multiple_response: 3,
      matching: 3,
      extended_matching: 1,
      ordering: 1,
      image_hotspot: 2,
      image_label: 1,
      short_answer: 1,
    },
  },
} as const;

export const autonomicPharmacologyCuratedPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
    practiceFamilyId: AUTONOMIC_PHARMACOLOGY_PRACTICE_FAMILY_ID,
    courseId: AUTONOMIC_PHARMACOLOGY_COURSE_ID,
    moduleId: AUTONOMIC_PHARMACOLOGY_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: AUTONOMIC_PHARMACOLOGY_POLICY,
    eligibleFormats: AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS,
    resultMode: 'automatic',
    sectionIds: AUTONOMIC_PHARMACOLOGY_SECTIONS,
    profiles: [
      {
        id: 'quick',
        label: 'Quick practice',
        count: 10,
        sectionTargets: {
          'pharm-adrenergic': 5,
          'pharm-cholinergic': 5,
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
          'pharm-adrenergic': 12,
          'pharm-cholinergic': 13,
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
        higherOrderMinimum: 18,
        higherOrderMaximum: 25,
      },
      {
        id: 'full',
        label: 'Full practice',
        count: 50,
        sectionTargets: {
          'pharm-adrenergic': 25,
          'pharm-cholinergic': 25,
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
        higherOrderMinimum: 36,
        higherOrderMaximum: 50,
        requiredObjectiveIds: AUTONOMIC_PHARMACOLOGY_OBJECTIVE_IDS,
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

export const autonomicPharmacologyWrittenPracticeBlueprint: PracticeBlueprint =
  practiceBlueprintSchema.parse({
    schemaVersion: 1,
    id: AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: AUTONOMIC_PHARMACOLOGY_PRACTICE_FAMILY_ID,
    courseId: AUTONOMIC_PHARMACOLOGY_COURSE_ID,
    moduleId: AUTONOMIC_PHARMACOLOGY_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    defaultMode: 'study',
    gradingPolicy: AUTONOMIC_PHARMACOLOGY_POLICY,
    eligibleFormats: ['open_response'],
    resultMode: 'manual-only',
    sectionIds: AUTONOMIC_PHARMACOLOGY_SECTIONS,
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

export function createAutonomicPharmacologyPracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = [...AUTONOMIC_PHARMACOLOGY_SECTIONS],
  formats = AUTONOMIC_PHARMACOLOGY_AUTOMATIC_FORMATS,
  difficulties = AUTONOMIC_PHARMACOLOGY_DIFFICULTIES,
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
    blueprintId: AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
    practiceFamilyId: AUTONOMIC_PHARMACOLOGY_PRACTICE_FAMILY_ID,
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

export function createAutonomicPharmacologyWrittenSelection(
  seed: string,
): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: AUTONOMIC_PHARMACOLOGY_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: [...AUTONOMIC_PHARMACOLOGY_SECTIONS],
    formats: ['open_response'],
    difficulties: [...AUTONOMIC_PHARMACOLOGY_DIFFICULTIES],
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}
