import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const SYSTEMIC_PATHOLOGY_EXPERIENCE_ID = 'systemic-pathology';
export const SYSTEMIC_PATHOLOGY_ROUTE_ID = 'systemic-pathology-curated';
export const SYSTEMIC_PATHOLOGY_BLUEPRINT_ID =
  'systemic-pathology-curated-v1';
export const SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID =
  'systemic-pathology-written-v1';
export const SYSTEMIC_PATHOLOGY_PRACTICE_FAMILY_ID =
  'systemic-pathology-practice';
export const SYSTEMIC_PATHOLOGY_COURSE_ID = 'systemic-pathology';
export const SYSTEMIC_PATHOLOGY_MODULE_ID = 'systemic-pathology';
export const SYSTEMIC_PATHOLOGY_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isSystemicPathologyCuratedPracticeEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_SYSTEMIC_PATHOLOGY_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}
