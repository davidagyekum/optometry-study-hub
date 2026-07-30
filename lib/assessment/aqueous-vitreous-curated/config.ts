import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const AQUEOUS_VITREOUS_CURATED_EXPERIENCE_ID = 'aqueous-vitreous-curated';
export const AQUEOUS_VITREOUS_CURATED_ROUTE_ID = 'aqueous-vitreous-curated';
export const AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID = 'opt376-aqueous-vitreous-curated-v1';
export const AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID = 'opt376-aqueous-vitreous-written-v1';
export const AQUEOUS_VITREOUS_PRACTICE_FAMILY_ID = 'opt376-aqueous-vitreous-practice';
export const AQUEOUS_VITREOUS_CURATED_COURSE_ID = 'neuro-anatomy';
export const AQUEOUS_VITREOUS_CURATED_MODULE_ID = 'aqueous-vitreous';
export const AQUEOUS_VITREOUS_CURATED_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isAqueousVitreousCuratedPracticeEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_AQUEOUS_VITREOUS_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}