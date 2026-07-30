import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import {
  autonomicPharmacologyCuratedPracticeBlueprint,
  autonomicPharmacologyWrittenPracticeBlueprint,
} from '@/lib/assessment/autonomic-pharmacology/practiceBlueprint';

const compatibility = createCuratedCompatibility({
  experienceName: 'Autonomic Pharmacology curated practice',
  courseId: autonomicPharmacologyCuratedPracticeBlueprint.courseId,
  moduleId: autonomicPharmacologyCuratedPracticeBlueprint.moduleId,
  automaticBlueprint: autonomicPharmacologyCuratedPracticeBlueprint,
  writtenBlueprint: autonomicPharmacologyWrittenPracticeBlueprint,
});

export const validateAutonomicPharmacologyCuratedAttempt =
  compatibility.validateAttempt;
export const validateAutonomicPharmacologyCuratedResult =
  compatibility.validateResult;
