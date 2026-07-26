import type { GradingPolicyReference } from '@/lib/assessment/grading/types';

export const AQUEOUS_PILOT_QUESTION_IDS = [
  'aqueous-flow-sba-001',
  'aqueous-production-mr-001',
  'aqueous-flow-ordering-001',
  'aqueous-flow-matching-001',
  'aqueous-iop-extended-matching-001',
  'aqueous-flow-hotspot-001',
  'aqueous-chambers-label-001',
  'aqueous-iop-short-answer-001',
  'vitreous-clinical-open-response-001',
] as const;

export const AQUEOUS_PILOT_COURSE_ID = 'neuro-anatomy';
export const AQUEOUS_PILOT_MODULE_ID = 'aqueous-vitreous';
export const AQUEOUS_PILOT_POLICY: GradingPolicyReference = Object.freeze({
  id: 'diagnostic',
  version: 1,
});
