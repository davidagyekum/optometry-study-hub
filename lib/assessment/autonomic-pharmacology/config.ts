import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const AUTONOMIC_PHARMACOLOGY_EXPERIENCE_ID = 'autonomic-pharmacology';
export const AUTONOMIC_PHARMACOLOGY_ROUTE_ID = 'autonomic-pharmacology-curated';
export const AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID =
  'autonomic-pharmacology-curated-v1';
export const AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID =
  'autonomic-pharmacology-written-v1';
export const AUTONOMIC_PHARMACOLOGY_PRACTICE_FAMILY_ID =
  'autonomic-pharmacology-practice';
export const AUTONOMIC_PHARMACOLOGY_COURSE_ID = 'pharmacology';
export const AUTONOMIC_PHARMACOLOGY_MODULE_ID = 'autonomic-pharmacology';
export const AUTONOMIC_PHARMACOLOGY_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isAutonomicPharmacologyCuratedPracticeEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}
