import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import {
  HVP_DEPTH_COLOUR_COURSE_ID,
  HVP_DEPTH_COLOUR_MODULE_CONFIGS,
  type HvpDepthColourModuleId,
} from '@/lib/assessment/hvp-depth-colour/config';

function createSummary(moduleId: HvpDepthColourModuleId): CuratedExperienceSummary {
  const config = HVP_DEPTH_COLOUR_MODULE_CONFIGS[moduleId];
  return Object.freeze({
    experienceId: config.experienceId,
    courseId: HVP_DEPTH_COLOUR_COURSE_ID,
    moduleId: config.moduleId,
    title: `${config.title} curated practice`,
    shortTitle: config.shortTitle,
    courseCode: 'OPT 374',
    routeSegment: config.routeSegment,
    blueprintIds: [config.automaticBlueprintId, config.writtenBlueprintId],
    statusLabel: 'Draft course extension',
    enabled: false,
    supportsAutomaticPractice: true,
    supportsWrittenPractice: true,
    studyEntryTitle: 'Course-aligned draft practice',
    studyEntryDescription:
      `Build mixed-format practice from 80 source-aligned ${config.shortTitle} questions.`,
    documentTitles: {
      landing: `${config.shortTitle} Practice`,
      session: `${config.shortTitle} Practice Session`,
      result: `${config.shortTitle} Practice Result`,
      unavailable: `${config.shortTitle} Practice Unavailable`,
    },
    releaseStatus: {
      ariaLabel: `${config.shortTitle} practice release status`,
      title: 'Draft course extension',
      lines: [
        'Built from the supplied lecture materials; lecturer review is pending.',
        'Progress is stored on this device.',
      ],
    },
  });
}

export const hvpDepthColourSummaries = Object.freeze({
  'hvp-depth-perception': createSummary('hvp-depth-perception'),
  'hvp-colour-perception': createSummary('hvp-colour-perception'),
});
