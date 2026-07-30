import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const OCULAR_ADNEXA_EXPERIENCE_ID = 'ocular-adnexa';
export const OCULAR_ADNEXA_ROUTE_ID = 'ocular-adnexa-curated';
export const OCULAR_ADNEXA_BLUEPRINT_ID =
  'opt376-ocular-adnexa-curated-v1';
export const OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID =
  'opt376-ocular-adnexa-written-v1';
export const OCULAR_ADNEXA_PRACTICE_FAMILY_ID =
  'opt376-ocular-adnexa-practice';
export const OCULAR_ADNEXA_COURSE_ID = 'neuro-anatomy';
export const OCULAR_ADNEXA_MODULE_ID = 'ocular-adnexa';
export const OCULAR_ADNEXA_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isOcularAdnexaCuratedPracticeEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}
