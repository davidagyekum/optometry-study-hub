export const COURSE_ID = 'dispensing-optics-ii' as const;
export const MODULE_ID = 'schematic-eye-refractive-states' as const;
export const EXPERIENCE_ID = 'opt370-schematic-eye-refractive-states' as const;
export const ROUTE_ID = 'opt370-schematic-eye-refractive-states-practice' as const;
export const CONTENT_BLUEPRINT_ID = 'schematic-eye-refractive-states-candidate-v1' as const;
export const PRACTICE_BLUEPRINT_ID = 'schematic-eye-refractive-states-practice-50-v1' as const;

export const isCuratedPracticeEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_OPT370_SCHEMATIC_EYE_REFRACTIVE_STATES === 'true';
