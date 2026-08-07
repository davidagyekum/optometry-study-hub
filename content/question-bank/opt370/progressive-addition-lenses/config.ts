export const COURSE_ID = 'dispensing-optics-ii' as const;
export const MODULE_ID = 'progressive-addition-lenses' as const;
export const EXPERIENCE_ID = 'opt370-progressive-addition-lenses' as const;
export const ROUTE_ID = 'opt370-progressive-addition-lenses-practice' as const;
export const CONTENT_BLUEPRINT_ID = 'progressive-addition-lenses-candidate-v1' as const;
export const PRACTICE_BLUEPRINT_ID = 'progressive-addition-lenses-practice-50-v1' as const;

export const isCuratedPracticeEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_OPT370_PROGRESSIVE_ADDITION_LENSES === 'true';
