import {
  HVP_PRACTICE_DIFFICULTY_TARGETS,
  HVP_PRACTICE_FORMAT_TARGETS,
  HVP_PRACTICE_SECTION_TARGETS,
} from '@/lib/assessment/hvp/assembler';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
  HVP_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/hvp/config';
import { largestRemainderAllocation } from '@/lib/assessment/practice/allocation';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeSelectionSnapshot,
  PracticeStrategy,
} from '@/lib/assessment/practice/types';
import type {
  Difficulty,
  QuestionFormat,
} from '@/lib/assessment/types';

export const HVP_WRITTEN_PRACTICE_ID = 'human-visual-perception-written';
export const HVP_PRACTICE_FAMILY_ID = 'opt374-hvp-practice';
export const HVP_SECTIONS = Object.keys(HVP_PRACTICE_SECTION_TARGETS);
export const HVP_AUTOMATIC_FORMATS = Object.keys(
  HVP_PRACTICE_FORMAT_TARGETS,
) as QuestionFormat[];
export const HVP_DIFFICULTIES: Difficulty[] = [
  'foundation',
  'intermediate',
  'advanced',
];

function proportionalProfile(id: 'quick' | 'standard', label: string, count: 10 | 25) {
  return {
    id,
    label,
    count,
    sectionTargets: largestRemainderAllocation(HVP_PRACTICE_SECTION_TARGETS, count),
    formatTargets: largestRemainderAllocation(HVP_PRACTICE_FORMAT_TARGETS, count),
    difficultyTargets: largestRemainderAllocation(HVP_PRACTICE_DIFFICULTY_TARGETS, count),
    higherOrderMinimum: count === 10 ? 4 : 10,
  };
}

export const hvpCuratedPracticeBlueprint: PracticeBlueprint = practiceBlueprintSchema.parse({
  schemaVersion: 1,
  id: HVP_CURATED_BLUEPRINT_ID,
  practiceFamilyId: HVP_PRACTICE_FAMILY_ID,
  courseId: HVP_CURATED_COURSE_ID,
  moduleId: HVP_CURATED_MODULE_ID,
  allowedReviewStatuses: ['draft'],
  defaultMode: 'study',
  gradingPolicy: HVP_CURATED_POLICY,
  eligibleFormats: HVP_AUTOMATIC_FORMATS,
  resultMode: 'automatic',
  sectionIds: HVP_SECTIONS,
  profiles: [
    proportionalProfile('quick', 'Quick practice', 10),
    proportionalProfile('standard', 'Standard practice', 25),
    {
      id: 'full',
      label: 'Full practice',
      count: 50,
      sectionTargets: HVP_PRACTICE_SECTION_TARGETS,
      formatTargets: HVP_PRACTICE_FORMAT_TARGETS,
      difficultyTargets: HVP_PRACTICE_DIFFICULTY_TARGETS,
      higherOrderMinimum: 20,
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

export const hvpWrittenPracticeBlueprint: PracticeBlueprint = practiceBlueprintSchema.parse({
  schemaVersion: 1,
  id: HVP_WRITTEN_BLUEPRINT_ID,
  practiceFamilyId: HVP_PRACTICE_FAMILY_ID,
  courseId: HVP_CURATED_COURSE_ID,
  moduleId: HVP_CURATED_MODULE_ID,
  allowedReviewStatuses: ['draft'],
  defaultMode: 'study',
  gradingPolicy: HVP_CURATED_POLICY,
  eligibleFormats: ['open_response'],
  resultMode: 'manual-only',
  sectionIds: HVP_SECTIONS,
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

export function createHvpPracticeSelection({
  profileId,
  strategy = 'mixed',
  requestedCount,
  sectionIds = HVP_SECTIONS,
  formats = HVP_AUTOMATIC_FORMATS,
  difficulties = HVP_DIFFICULTIES,
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
    blueprintId: HVP_CURATED_BLUEPRINT_ID,
    practiceFamilyId: HVP_PRACTICE_FAMILY_ID,
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

export function createHvpWrittenSelection(seed: string): PracticeSelectionSnapshot {
  return {
    schemaVersion: 1,
    blueprintId: HVP_WRITTEN_BLUEPRINT_ID,
    practiceFamilyId: HVP_PRACTICE_FAMILY_ID,
    profileId: 'written',
    strategy: 'mixed',
    requestedCount: 2,
    sectionIds: HVP_SECTIONS,
    formats: ['open_response'],
    difficulties: HVP_DIFFICULTIES,
    seed,
    resultMode: 'manual-only',
    historyPolicy: 'encounter-and-manual',
  };
}

export { HVP_WRITTEN_BLUEPRINT_ID };
