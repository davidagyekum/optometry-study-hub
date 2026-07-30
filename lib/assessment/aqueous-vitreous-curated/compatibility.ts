import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import {
  aqueousVitreousCuratedPracticeBlueprint,
  aqueousVitreousWrittenPracticeBlueprint,
} from '@/lib/assessment/aqueous-vitreous-curated/practiceBlueprint';

const compatibility = createCuratedCompatibility({
  experienceName: 'OPT 376 Aqueous and Vitreous curated practice',
  courseId: aqueousVitreousCuratedPracticeBlueprint.courseId,
  moduleId: aqueousVitreousCuratedPracticeBlueprint.moduleId,
  automaticBlueprint: aqueousVitreousCuratedPracticeBlueprint,
  writtenBlueprint: aqueousVitreousWrittenPracticeBlueprint,
});

export const validateAqueousVitreousCuratedAttempt = compatibility.validateAttempt;
export const validateAqueousVitreousCuratedResult = compatibility.validateResult;