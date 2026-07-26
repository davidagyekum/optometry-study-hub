import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { lockAttemptGradingPolicy } from '@/lib/assessment/grading/lockAttemptGradingPolicy';
import {
  finalizeAssessmentStore,
  putActiveAssessmentAttempt,
} from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { correctResponseFor } from '@/tests/fixtures/grading';
import {
  makeAttempt,
  makeDraftRegistry,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

const strict = { id: 'strict', version: 1 };
const now = () => new Date('2026-07-26T13:00:00.000Z');

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('historical attempt grading-policy adoption', () => {
  it('requires an explicit available policy and does not mutate the source attempt', () => {
    const historical = makeAttempt();
    delete historical.gradingPolicy;
    const before = structuredClone(historical);

    expect(codes(lockAttemptGradingPolicy({ attempt: historical })))
      .toContain('GRADING_POLICY_REQUIRED');
    expect(codes(lockAttemptGradingPolicy({
      attempt: historical,
      policy: { id: 'unknown', version: 1 },
    }))).toContain('GRADING_POLICY_NOT_FOUND');
    expect(codes(lockAttemptGradingPolicy({
      attempt: historical,
      policy: { id: 'strict', version: 2 },
    }))).toContain('GRADING_POLICY_VERSION_UNSUPPORTED');

    const locked = lockAttemptGradingPolicy({ attempt: historical, policy: strict });
    expect(locked.ok && locked.value.gradingPolicy).toEqual(strict);
    expect(locked.ok && locked.value).not.toBe(historical);
    expect(historical).toEqual(before);
  });

  it('accepts an existing matching lock and rejects a conflicting lock', () => {
    const attempt = makeAttempt();
    const before = structuredClone(attempt);
    const matched = lockAttemptGradingPolicy({
      attempt,
      policy: { id: 'diagnostic', version: 1 },
    });
    expect(matched.ok && matched.value.gradingPolicy).toEqual({
      id: 'diagnostic',
      version: 1,
    });
    expect(codes(lockAttemptGradingPolicy({ attempt, policy: strict })))
      .toContain('GRADING_POLICY_MISMATCH');
    expect(attempt).toEqual(before);
  });

  it('finalizes a historical attempt with its explicit policy and returns the lock', () => {
    const question = questionByFormat('single_best_answer');
    const historical = makeAttempt([question.id], { mode: 'exam' });
    delete historical.gradingPolicy;
    historical.responses[question.id] = correctResponseFor(question);
    const before = structuredClone(historical);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: historical,
      registry: makeDraftRegistry(),
      policy: strict,
      now,
      idFactory: () => 'result-historical-direct',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.lockedAttempt.gradingPolicy).toEqual(strict);
    expect(finalized.value.result.gradingPolicy).toEqual(strict);
    expect(finalized.value.result.score).toBe(1);
    expect(historical).toEqual(before);
  });

  it('supports explicit lock, grade, result, and atomic StoreV2 finalization', () => {
    const question = questionByFormat('single_best_answer');
    const historical = makeAttempt([question.id], { mode: 'exam' });
    delete historical.gradingPolicy;
    historical.responses[question.id] = correctResponseFor(question);
    const locked = lockAttemptGradingPolicy({ attempt: historical, policy: strict });
    if (!locked.ok) throw new Error('Historical policy lock should succeed');

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: locked.value,
      registry: makeDraftRegistry(),
      now,
      idFactory: () => 'result-historical-atomic',
    });
    if (!finalized.ok) throw new Error('Historical finalization should succeed');
    const active = putActiveAssessmentAttempt(
      createEmptyStoreV2(),
      finalized.value.lockedAttempt.id,
      finalized.value.lockedAttempt,
    );
    if (!active.ok) throw new Error('Locked historical attempt should store');
    const stored = finalizeAssessmentStore(
      active.value,
      finalized.value.lockedAttempt.id,
      finalized.value.result.id,
      finalized.value.result,
    );
    expect(stored.ok).toBe(true);
    if (!stored.ok) return;
    expect(stored.value.assessment.activeAttempts).toEqual({});
    expect(stored.value.assessment.results[finalized.value.result.id])
      .toEqual(finalized.value.result);
  });
});
