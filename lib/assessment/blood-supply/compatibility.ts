import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import {
  bloodSupplyCuratedPracticeBlueprint,
  bloodSupplyWrittenPracticeBlueprint,
} from '@/lib/assessment/blood-supply/practiceBlueprint';

const compatibility = createCuratedCompatibility({
  experienceName: 'OPT 376 Blood Supply curated practice',
  courseId: bloodSupplyCuratedPracticeBlueprint.courseId,
  moduleId: bloodSupplyCuratedPracticeBlueprint.moduleId,
  automaticBlueprint: bloodSupplyCuratedPracticeBlueprint,
  writtenBlueprint: bloodSupplyWrittenPracticeBlueprint,
});

export const validateBloodSupplyCuratedAttempt =
  compatibility.validateAttempt;
export const validateBloodSupplyCuratedResult =
  compatibility.validateResult;
