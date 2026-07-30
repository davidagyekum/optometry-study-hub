import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import {
  environmentalVisionCuratedPracticeBlueprint,
  environmentalVisionWrittenPracticeBlueprint,
} from '@/lib/assessment/environmental-vision/practiceBlueprint';

const compatibility = createCuratedCompatibility({
  experienceName: 'OPT 508 Environmental Vision curated practice',
  courseId: environmentalVisionCuratedPracticeBlueprint.courseId,
  moduleId: environmentalVisionCuratedPracticeBlueprint.moduleId,
  automaticBlueprint: environmentalVisionCuratedPracticeBlueprint,
  writtenBlueprint: environmentalVisionWrittenPracticeBlueprint,
});

export const validateEnvironmentalVisionCuratedAttempt =
  compatibility.validateAttempt;
export const validateEnvironmentalVisionCuratedResult =
  compatibility.validateResult;
