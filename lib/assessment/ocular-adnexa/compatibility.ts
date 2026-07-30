import { createCuratedCompatibility } from '@/lib/assessment/curated/compatibility';
import {
  ocularAdnexaCuratedPracticeBlueprint,
  ocularAdnexaWrittenPracticeBlueprint,
} from '@/lib/assessment/ocular-adnexa/practiceBlueprint';

const compatibility = createCuratedCompatibility({
  experienceName: 'OPT 376 Ocular Adnexa curated practice',
  courseId: ocularAdnexaCuratedPracticeBlueprint.courseId,
  moduleId: ocularAdnexaCuratedPracticeBlueprint.moduleId,
  automaticBlueprint: ocularAdnexaCuratedPracticeBlueprint,
  writtenBlueprint: ocularAdnexaWrittenPracticeBlueprint,
});

export const validateOcularAdnexaCuratedAttempt =
  compatibility.validateAttempt;
export const validateOcularAdnexaCuratedResult =
  compatibility.validateResult;
