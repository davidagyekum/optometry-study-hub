import { multifocalFoundationsQuestionBank } from '@/content/question-bank/opt370/multifocal-foundations/bank';
import { multifocalFoundationsPracticeBlueprint } from '@/content/question-bank/opt370/multifocal-foundations/blueprint';
import { OPT370_MODULE_CONFIGS } from '@/lib/assessment/opt370/config';
import { createOpt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import { opt370CuratedSummaries } from '@/lib/assessment/opt370/summaries';

export const multifocalFoundationsExperience = createOpt370PracticeExperience({
  config: OPT370_MODULE_CONFIGS['multifocal-foundations'],
  summary: opt370CuratedSummaries['multifocal-foundations'],
  bank: multifocalFoundationsQuestionBank,
  fullSectionTargets: multifocalFoundationsPracticeBlueprint.sectionTargets,
});
