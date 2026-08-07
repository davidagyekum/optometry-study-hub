import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import {
  OPT370_COURSE_ID,
  OPT370_MODULE_CONFIGS,
  type Opt370ModuleId,
} from '@/lib/assessment/opt370/config';

function createSummary(moduleId: Opt370ModuleId): CuratedExperienceSummary {
  const config = OPT370_MODULE_CONFIGS[moduleId];
  return Object.freeze({
    experienceId: config.experienceId,
    courseId: OPT370_COURSE_ID,
    moduleId: config.moduleId,
    title: config.title + ' curated practice',
    shortTitle: config.shortTitle,
    courseCode: 'OPT 370',
    routeSegment: config.routeSegment,
    blueprintIds: [config.automaticBlueprintId, config.writtenBlueprintId],
    statusLabel: 'Course-aligned practice',
    enabled: false,
    supportsAutomaticPractice: true,
    supportsWrittenPractice: true,
    studyEntryTitle: 'Course-aligned practice',
    studyEntryDescription: 'Build mixed-format practice from 80 source-aligned OPT 370 questions.',
    documentTitles: {
      landing: config.shortTitle + ' Practice',
      session: config.shortTitle + ' Practice Session',
      result: config.shortTitle + ' Practice Result',
      unavailable: config.shortTitle + ' Practice Unavailable',
    },
    releaseStatus: {
      ariaLabel: config.shortTitle + ' practice release status',
      title: 'Course-aligned practice',
      lines: [
        'Built from the supplied OPT 370 course materials.',
        'Progress is stored on this device.',
      ],
    },
  });
}

export const opt370CuratedSummaries = Object.freeze({
  'schematic-eye-refractive-states': createSummary('schematic-eye-refractive-states'),
  'multifocal-foundations': createSummary('multifocal-foundations'),
  'progressive-addition-lenses': createSummary('progressive-addition-lenses'),
  'pd-and-dispensing': createSummary('pd-and-dispensing'),
  'special-lenses': createSummary('special-lenses'),
});
