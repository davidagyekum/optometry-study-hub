import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const HVP_CURATED_PRACTICE_ID = 'human-visual-perception-curated';
export const HVP_CURATED_BLUEPRINT_ID = 'opt374-hvp-curated-v1';
export const HVP_WRITTEN_BLUEPRINT_ID = 'opt374-hvp-written-v1';
export const HVP_CURATED_COURSE_ID = 'human-visual-perception';
export const HVP_CURATED_MODULE_ID = 'human-visual-perception';
export const HVP_CURATED_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isHvpCuratedPracticeEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}
