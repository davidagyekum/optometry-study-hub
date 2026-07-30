import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import {
  systemicPathologyCuratedPracticeBlueprint,
  systemicPathologyWrittenPracticeBlueprint,
} from '@/lib/assessment/systemic-pathology/practiceBlueprint';

const compatibility = createCuratedCompatibility({
  experienceName: 'Systemic Pathology curated practice',
  courseId: systemicPathologyCuratedPracticeBlueprint.courseId,
  moduleId: systemicPathologyCuratedPracticeBlueprint.moduleId,
  automaticBlueprint: systemicPathologyCuratedPracticeBlueprint,
  writtenBlueprint: systemicPathologyWrittenPracticeBlueprint,
});

export const validateSystemicPathologyCuratedAttempt =
  compatibility.validateAttempt;
export const validateSystemicPathologyCuratedResult =
  compatibility.validateResult;
