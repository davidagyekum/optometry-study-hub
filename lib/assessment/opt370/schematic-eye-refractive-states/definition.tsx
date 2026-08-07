import { schematicEyeRefractiveStatesQuestionBank } from '@/content/question-bank/opt370/schematic-eye-refractive-states/bank';
import { schematicEyeRefractiveStatesPracticeBlueprint } from '@/content/question-bank/opt370/schematic-eye-refractive-states/blueprint';
import { OPT370_MODULE_CONFIGS } from '@/lib/assessment/opt370/config';
import { createOpt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import { opt370CuratedSummaries } from '@/lib/assessment/opt370/summaries';

export const schematicEyeRefractiveStatesExperience = createOpt370PracticeExperience({
  config: OPT370_MODULE_CONFIGS['schematic-eye-refractive-states'],
  summary: opt370CuratedSummaries['schematic-eye-refractive-states'],
  bank: schematicEyeRefractiveStatesQuestionBank,
  fullSectionTargets: schematicEyeRefractiveStatesPracticeBlueprint.sectionTargets,
});
