import { specialLensesQuestionBank } from '@/content/question-bank/opt370/special-lenses/bank';
import { specialLensesPracticeBlueprint } from '@/content/question-bank/opt370/special-lenses/blueprint';
import { OPT370_MODULE_CONFIGS } from '@/lib/assessment/opt370/config';
import { createOpt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import { opt370CuratedSummaries } from '@/lib/assessment/opt370/summaries';

export const specialLensesExperience = createOpt370PracticeExperience({
  config: OPT370_MODULE_CONFIGS['special-lenses'],
  summary: opt370CuratedSummaries['special-lenses'],
  bank: specialLensesQuestionBank,
  fullSectionTargets: specialLensesPracticeBlueprint.sectionTargets,
});
