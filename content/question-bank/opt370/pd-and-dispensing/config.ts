export const COURSE_ID = 'dispensing-optics-ii' as const;
export const MODULE_ID = 'pd-and-dispensing' as const;
export const EXPERIENCE_ID = 'opt370-pd-and-dispensing' as const;
export const ROUTE_ID = 'opt370-pd-and-dispensing-practice' as const;
export const CONTENT_BLUEPRINT_ID = 'pd-and-dispensing-candidate-v1' as const;
export const PRACTICE_BLUEPRINT_ID = 'pd-and-dispensing-practice-50-v1' as const;

export const isCuratedPracticeEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_OPT370_PD_AND_DISPENSING === 'true';
