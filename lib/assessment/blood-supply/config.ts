import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const BLOOD_SUPPLY_EXPERIENCE_ID = 'blood-supply';
export const BLOOD_SUPPLY_ROUTE_ID = 'blood-supply-curated';
export const BLOOD_SUPPLY_BLUEPRINT_ID =
  'opt376-blood-supply-curated-v1';
export const BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID =
  'opt376-blood-supply-written-v1';
export const BLOOD_SUPPLY_PRACTICE_FAMILY_ID =
  'opt376-blood-supply-practice';
export const BLOOD_SUPPLY_COURSE_ID = 'neuro-anatomy';
export const BLOOD_SUPPLY_MODULE_ID = 'blood-supply';
export const BLOOD_SUPPLY_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isBloodSupplyCuratedPracticeEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_BLOOD_SUPPLY_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}
