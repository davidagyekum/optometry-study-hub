import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const ENVIRONMENTAL_VISION_EXPERIENCE_ID = 'environmental-vision';
export const ENVIRONMENTAL_VISION_ROUTE_ID = 'environmental-vision-curated';
export const ENVIRONMENTAL_VISION_BLUEPRINT_ID =
  'opt508-environmental-vision-curated-v1';
export const ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID =
  'opt508-environmental-vision-written-v1';
export const ENVIRONMENTAL_VISION_PRACTICE_FAMILY_ID =
  'opt508-environmental-vision-practice';
export const ENVIRONMENTAL_VISION_COURSE_ID = 'environmental-vision';
export const ENVIRONMENTAL_VISION_MODULE_ID = 'environmental-vision';
export const ENVIRONMENTAL_VISION_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});

export function isEnvironmentalVisionCuratedPracticeEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_ENVIRONMENTAL_VISION_CURATED_PRACTICE,
): boolean {
  return rawValue === 'true';
}
