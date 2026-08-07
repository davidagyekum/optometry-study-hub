import { progressiveAdditionLensesQuestionBank } from '@/content/question-bank/opt370/progressive-addition-lenses/bank';
import { progressiveAdditionLensesPracticeBlueprint } from '@/content/question-bank/opt370/progressive-addition-lenses/blueprint';
import { OPT370_MODULE_CONFIGS } from '@/lib/assessment/opt370/config';
import { createOpt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import { opt370CuratedSummaries } from '@/lib/assessment/opt370/summaries';

export const progressiveAdditionLensesExperience = createOpt370PracticeExperience({
  config: OPT370_MODULE_CONFIGS['progressive-addition-lenses'],
  summary: opt370CuratedSummaries['progressive-addition-lenses'],
  bank: progressiveAdditionLensesQuestionBank,
  fullSectionTargets: progressiveAdditionLensesPracticeBlueprint.sectionTargets,
});
