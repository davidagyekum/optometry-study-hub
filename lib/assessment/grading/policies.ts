import type { GradingPolicy } from '@/lib/assessment/grading/types';

function immutablePolicy(policy: GradingPolicy): GradingPolicy {
  return Object.freeze({
    ...policy,
    diagnosticPartialFormats: Object.freeze([...policy.diagnosticPartialFormats]),
  });
}

export const BUILT_IN_GRADING_POLICIES: readonly GradingPolicy[] = Object.freeze([
  immutablePolicy({
    id: 'strict',
    version: 1,
    diagnosticPartialFormats: [],
  }),
  immutablePolicy({
    id: 'diagnostic',
    version: 1,
    diagnosticPartialFormats: [
      'matching',
      'extended_matching',
      'image_label',
    ],
  }),
]);

export const MODE_DEFAULT_GRADING_POLICIES = Object.freeze({
  study: Object.freeze({ id: 'diagnostic', version: 1 }),
  exam: Object.freeze({ id: 'strict', version: 1 }),
  mastery: Object.freeze({ id: 'strict', version: 1 }),
});
