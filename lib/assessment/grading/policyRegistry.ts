import {
  gradingFailure,
  gradingIssue,
  gradingSuccess,
} from '@/lib/assessment/grading/errors';
import {
  BUILT_IN_GRADING_POLICIES,
  MODE_DEFAULT_GRADING_POLICIES,
} from '@/lib/assessment/grading/policies';
import type {
  GradingPolicy,
  GradingPolicyReference,
  GradingResult,
} from '@/lib/assessment/grading/types';
import type { AssessmentAttemptSnapshot } from '@/lib/storage/schemas';

export interface GradingPolicyRegistry {
  lookup(reference: GradingPolicyReference): GradingResult<GradingPolicy>;
  defaultForMode(
    mode: AssessmentAttemptSnapshot['mode'],
  ): GradingResult<GradingPolicyReference>;
  references(): GradingPolicyReference[];
}

function policyKey(reference: GradingPolicyReference): string {
  return `${reference.id}@${reference.version}`;
}

function copyPolicy(policy: GradingPolicy): GradingPolicy {
  return {
    id: policy.id,
    version: policy.version,
    diagnosticPartialFormats: [...policy.diagnosticPartialFormats],
  };
}

const policies: ReadonlyMap<string, GradingPolicy> = new Map(
  BUILT_IN_GRADING_POLICIES.map((policy) => [policyKey(policy), copyPolicy(policy)]),
);

function lookupPolicy(
  reference: GradingPolicyReference,
): GradingResult<GradingPolicy> {
  const policy = policies.get(policyKey(reference));
  if (policy) return gradingSuccess(copyPolicy(policy));

  const knownId = BUILT_IN_GRADING_POLICIES.some(
    (candidate) => candidate.id === reference.id,
  );
  return gradingFailure(gradingIssue(
    knownId
      ? 'GRADING_POLICY_VERSION_UNSUPPORTED'
      : 'GRADING_POLICY_NOT_FOUND',
    knownId
      ? `Grading policy "${reference.id}" does not support version ${reference.version}.`
      : `Grading policy "${reference.id}" is not registered.`,
    { path: 'gradingPolicy' },
  ));
}

const registry: GradingPolicyRegistry = Object.freeze({
  lookup: lookupPolicy,
  defaultForMode(
    mode: AssessmentAttemptSnapshot['mode'],
  ): GradingResult<GradingPolicyReference> {
    const reference = MODE_DEFAULT_GRADING_POLICIES[mode];
    return gradingSuccess({ ...reference });
  },
  references(): GradingPolicyReference[] {
    return BUILT_IN_GRADING_POLICIES.map(({ id, version }) => ({ id, version }));
  },
});

export function gradingPolicyRegistry(): GradingPolicyRegistry {
  return registry;
}

export function resolveGradingPolicy(
  reference: GradingPolicyReference,
): GradingResult<GradingPolicy> {
  return registry.lookup(reference);
}

export function defaultGradingPolicyForMode(
  mode: AssessmentAttemptSnapshot['mode'],
): GradingResult<GradingPolicyReference> {
  return registry.defaultForMode(mode);
}

export function policyReferencesEqual(
  left: GradingPolicyReference,
  right: GradingPolicyReference,
): boolean {
  return left.id === right.id && left.version === right.version;
}

export function resolveSnapshotGradingPolicy(
  locked: GradingPolicyReference | undefined,
  explicit: GradingPolicyReference | undefined,
): GradingResult<GradingPolicyReference> {
  if (locked && explicit && !policyReferencesEqual(locked, explicit)) {
    return gradingFailure(gradingIssue(
      'GRADING_POLICY_MISMATCH',
      `Explicit grading policy "${policyKey(explicit)}" does not match locked policy "${policyKey(locked)}".`,
      { path: 'gradingPolicy' },
    ));
  }
  const selected = locked ?? explicit;
  if (!selected) {
    return gradingFailure(gradingIssue(
      'GRADING_POLICY_REQUIRED',
      'Historical assessment snapshots without a locked policy require an explicit policy.',
      { path: 'gradingPolicy' },
    ));
  }
  const resolved = resolveGradingPolicy(selected);
  return resolved.ok
    ? gradingSuccess({ id: resolved.value.id, version: resolved.value.version })
    : resolved;
}
