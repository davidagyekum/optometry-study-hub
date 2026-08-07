export const COURSE_ID = 'dispensing-optics-ii' as const;
export const MODULE_ID = 'special-lenses' as const;
export const EXPERIENCE_ID = 'opt370-special-lenses' as const;
export const ROUTE_ID = 'opt370-special-lenses-practice' as const;
export const CONTENT_BLUEPRINT_ID = 'special-lenses-candidate-v1' as const;
export const PRACTICE_BLUEPRINT_ID = 'special-lenses-practice-50-v1' as const;

export const isCuratedPracticeEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_OPT370_SPECIAL_LENSES === 'true';
