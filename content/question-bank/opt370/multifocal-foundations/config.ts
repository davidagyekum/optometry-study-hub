export const COURSE_ID = 'dispensing-optics-ii' as const;
export const MODULE_ID = 'multifocal-foundations' as const;
export const EXPERIENCE_ID = 'opt370-multifocal-foundations' as const;
export const ROUTE_ID = 'opt370-multifocal-foundations-practice' as const;
export const CONTENT_BLUEPRINT_ID = 'multifocal-foundations-candidate-v1' as const;
export const PRACTICE_BLUEPRINT_ID = 'multifocal-foundations-practice-50-v1' as const;

export const isCuratedPracticeEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_OPT370_MULTIFOCAL_FOUNDATIONS === 'true';
