import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const TISSUE_CURATED_EXPERIENCE_ID =
  'opt376-tissue-foundations-curated-v1';
export const TISSUE_CURATED_ROUTE_ID = 'tissue-foundations-curated';
export const TISSUE_CURATED_BLUEPRINT_ID =
  'opt376-tissue-foundations-curated-blueprint-v1';
export const TISSUE_WRITTEN_BLUEPRINT_ID =
  'opt376-tissue-foundations-written-v1';
export const TISSUE_PRACTICE_FAMILY_ID =
  'opt376-tissue-foundations-practice';
export const TISSUE_CURATED_COURSE_ID = 'neuro-anatomy';
export const TISSUE_CURATED_MODULE_ID = 'tissue-foundations';
export const TISSUE_CURATED_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isTissueFoundationsCuratedPracticeEnabled(
  rawValue = process.env
    .NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}
