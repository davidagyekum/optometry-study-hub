import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import {
  tissueCuratedPracticeBlueprint,
  tissueWrittenPracticeBlueprint,
} from '@/lib/assessment/tissue-foundations/practiceBlueprint';

const compatibility = createCuratedCompatibility({
  experienceName: 'OPT 376 Tissue Foundations curated practice',
  courseId: tissueCuratedPracticeBlueprint.courseId,
  moduleId: tissueCuratedPracticeBlueprint.moduleId,
  automaticBlueprint: tissueCuratedPracticeBlueprint,
  writtenBlueprint: tissueWrittenPracticeBlueprint,
});

export const validateTissueCuratedAttempt = compatibility.validateAttempt;
export const validateTissueCuratedResult = compatibility.validateResult;
