import { pdAndDispensingQuestionBank } from '@/content/question-bank/opt370/pd-and-dispensing/bank';
import { pdAndDispensingPracticeBlueprint } from '@/content/question-bank/opt370/pd-and-dispensing/blueprint';
import { OPT370_MODULE_CONFIGS } from '@/lib/assessment/opt370/config';
import { createOpt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import { opt370CuratedSummaries } from '@/lib/assessment/opt370/summaries';

export const pdAndDispensingExperience = createOpt370PracticeExperience({
  config: OPT370_MODULE_CONFIGS['pd-and-dispensing'],
  summary: opt370CuratedSummaries['pd-and-dispensing'],
  bank: pdAndDispensingQuestionBank,
  fullSectionTargets: pdAndDispensingPracticeBlueprint.sectionTargets,
});
