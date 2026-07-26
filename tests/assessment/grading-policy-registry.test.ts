import { describe, expect, it } from 'vitest';
import {
  defaultGradingPolicyForMode,
  gradingPolicyRegistry,
  resolveGradingPolicy,
} from '@/lib/assessment/grading/policyRegistry';
import * as policyRegistryModule from '@/lib/assessment/grading/policyRegistry';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { assessmentAttemptSnapshotSchema } from '@/lib/storage/schemas';
import {
  FIXED_NOW,
  PILOT_COURSE_ID,
  PILOT_MODULE_ID,
  fixedRandom,
  makeAttempt,
  makeDraftRegistry,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function createForMode(
  mode: 'study' | 'exam' | 'mastery',
  gradingPolicy?: { id: string; version: number },
) {
  const registry = makeDraftRegistry();
  return createAssessmentAttempt({
    registry,
    questionIds: [registry.questionIds()[0]],
    mode,
    courseId: PILOT_COURSE_ID,
    moduleId: PILOT_MODULE_ID,
    gradingPolicy,
    allowedReviewStatuses: ['draft'],
    random: fixedRandom(),
    now: () => FIXED_NOW,
    idFactory: () => `attempt-${mode}`,
  });
}

describe('versioned grading-policy registry', () => {
  it('provides strict v1 and diagnostic v1 without a public raw constructor', () => {
    expect('BuiltInGradingPolicyRegistry' in policyRegistryModule).toBe(false);
    expect(gradingPolicyRegistry().references()).toEqual([
      { id: 'strict', version: 1 },
      { id: 'diagnostic', version: 1 },
    ]);
    expect(resolveGradingPolicy({ id: 'strict', version: 1 }).ok).toBe(true);
    expect(resolveGradingPolicy({ id: 'diagnostic', version: 1 }).ok).toBe(true);
  });

  it.each([
    ['study', { id: 'diagnostic', version: 1 }],
    ['exam', { id: 'strict', version: 1 }],
    ['mastery', { id: 'strict', version: 1 }],
  ] as const)('defaults %s mode immutably', (mode, expected) => {
    const first = defaultGradingPolicyForMode(mode);
    const second = defaultGradingPolicyForMode(mode);
    expect(first).toEqual({ ok: true, value: expected });
    expect(second).toEqual(first);
    if (!first.ok || !second.ok) return;
    expect(second.value).not.toBe(first.value);
    first.value.id = 'mutated';
    expect(defaultGradingPolicyForMode(mode)).toEqual({ ok: true, value: expected });
  });

  it('distinguishes unknown IDs from unsupported versions without fallback', () => {
    expect(codes(resolveGradingPolicy({ id: 'unknown', version: 1 })))
      .toContain('GRADING_POLICY_NOT_FOUND');
    expect(codes(resolveGradingPolicy({ id: 'strict', version: 2 })))
      .toContain('GRADING_POLICY_VERSION_UNSUPPORTED');
  });

  it('returns structured failures for malformed runtime references', () => {
    expect(() => resolveGradingPolicy(null as never)).not.toThrow();
    expect(codes(resolveGradingPolicy(null as never)))
      .toContain('GRADING_POLICY_NOT_FOUND');
    expect(codes(resolveGradingPolicy({ id: 'strict', version: 0 })))
      .toContain('GRADING_POLICY_VERSION_UNSUPPORTED');
    expect(codes(resolveGradingPolicy({
      id: 42 as unknown as string,
      version: 1,
    }))).toContain('GRADING_POLICY_NOT_FOUND');
  });

  it('returns defensive policy copies that cannot alter later lookup', () => {
    const first = resolveGradingPolicy({ id: 'diagnostic', version: 1 });
    const second = resolveGradingPolicy({ id: 'diagnostic', version: 1 });
    if (!first.ok || !second.ok) throw new Error('Policies should resolve');
    expect(second.value).toEqual(first.value);
    expect(second.value).not.toBe(first.value);
    (first.value.diagnosticPartialFormats as string[]).push('ordering');
    const later = resolveGradingPolicy({ id: 'diagnostic', version: 1 });
    expect(later.ok && later.value.diagnosticPartialFormats).toEqual([
      'matching',
      'extended_matching',
      'image_label',
    ]);
  });

  it('exposes a frozen registry without mutable implementation fields', () => {
    const exposed = gradingPolicyRegistry();
    expect(Object.isFrozen(exposed)).toBe(true);
    expect(Object.keys(exposed).sort()).toEqual([
      'defaultForMode',
      'lookup',
      'references',
    ]);
    expect(() => Object.assign(exposed, { lookup: () => ({ ok: true }) })).toThrow();
    expect(resolveGradingPolicy({ id: 'strict', version: 1 }).ok).toBe(true);
  });
});

describe('attempt grading-policy locking', () => {
  it.each([
    ['study', { id: 'diagnostic', version: 1 }],
    ['exam', { id: 'strict', version: 1 }],
    ['mastery', { id: 'strict', version: 1 }],
  ] as const)('locks the %s mode default', (mode, expected) => {
    const created = createForMode(mode);
    expect(created.ok).toBe(true);
    if (created.ok) expect(created.value.gradingPolicy).toEqual(expected);
  });

  it('accepts an explicit valid override and copies caller input', () => {
    const supplied = { id: 'diagnostic', version: 1 };
    const created = createForMode('exam', supplied);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    supplied.id = 'mutated';
    expect(created.value.gradingPolicy).toEqual({ id: 'diagnostic', version: 1 });
    expect(created.value.gradingPolicy).not.toBe(supplied);
  });

  it('rejects unavailable explicit policies', () => {
    expect(codes(createForMode('study', { id: 'unknown', version: 1 })))
      .toContain('GRADING_POLICY_NOT_FOUND');
    expect(codes(createForMode('study', { id: 'strict', version: 2 })))
      .toContain('GRADING_POLICY_VERSION_UNSUPPORTED');
  });

  it('keeps historical attempts without gradingPolicy schema-valid', () => {
    const historical = structuredClone(makeAttempt());
    delete historical.gradingPolicy;
    expect(assessmentAttemptSnapshotSchema.safeParse(historical).success).toBe(true);
  });
});
