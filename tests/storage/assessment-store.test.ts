import { describe, expect, it } from 'vitest';
import {
  finalizeAssessmentStore,
  getActiveAssessmentAttempt,
  getAssessmentResult,
  putActiveAssessmentAttempt,
  putAssessmentResult,
  removeActiveAssessmentAttempt,
} from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  storeV2Schema,
  type StoreV2,
} from '@/lib/storage/schemas';
import {
  makeAttempt,
  makeResult,
} from '@/tests/fixtures/session-engine';

function codes<T>(result: { ok: true; value: T } | { ok: false; issues: { code: string }[] }) {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function enrichedStore(): StoreV2 {
  return {
    ...createEmptyStoreV2(),
    read: { 'aqueous-vitreous': ['media-and-chambers'] },
    active: {},
    results: {},
    assessment: {
      activeAttempts: {},
      results: {},
      questionHistory: {
        'question-history-one': {
          questionId: 'question-history-one',
          version: 1,
          attemptCount: 2,
          correctCount: 1,
          lastAnsweredAt: '2026-07-25T08:00:00.000Z',
        },
      },
    },
  };
}

describe('immutable assessment StoreV2 helpers', () => {
  it('puts, replaces, retrieves, and removes active attempts without touching legacy data', () => {
    const source = enrichedStore();
    const sourceBefore = structuredClone(source);
    const attempt = makeAttempt();
    const added = putActiveAssessmentAttempt(source, attempt.id, attempt);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(source).toEqual(sourceBefore);
    expect(added.value.read).toEqual(source.read);
    expect(added.value.assessment.questionHistory).toEqual(source.assessment.questionHistory);

    const replacement = { ...attempt, currentIndex: 1 };
    const replaced = putActiveAssessmentAttempt(added.value, attempt.id, replacement);
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) return;
    const retrieved = getActiveAssessmentAttempt(replaced.value, attempt.id);
    expect(retrieved.ok).toBe(true);
    if (!retrieved.ok) return;
    expect(retrieved.value.currentIndex).toBe(1);
    expect(retrieved.value).not.toBe(replacement);

    const removed = removeActiveAssessmentAttempt(replaced.value, attempt.id);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.value.assessment.activeAttempts).toEqual({});
    expect(replaced.value.assessment.activeAttempts[attempt.id]).toBeDefined();
  });

  it('puts and retrieves assessment results without changing unrelated state', () => {
    const source = enrichedStore();
    const result = makeResult();
    const added = putAssessmentResult(source, result.id, result);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.read).toEqual(source.read);
    expect(added.value.assessment.questionHistory).toEqual(source.assessment.questionHistory);

    const retrieved = getAssessmentResult(added.value, result.id);
    expect(retrieved.ok).toBe(true);
    if (!retrieved.ok) return;
    expect(retrieved.value).toEqual(result);
    expect(retrieved.value).not.toBe(result);
  });

  it('atomically moves a matching active attempt to results', () => {
    const attempt = makeAttempt();
    const active = putActiveAssessmentAttempt(enrichedStore(), attempt.id, attempt);
    if (!active.ok) throw new Error('Active attempt should store');
    const result = makeResult(attempt);
    const finalized = finalizeAssessmentStore(active.value, attempt.id, result.id, result);
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.assessment.activeAttempts[attempt.id]).toBeUndefined();
    expect(finalized.value.assessment.results[result.id]).toEqual(result);
    expect(active.value.assessment.activeAttempts[attempt.id]).toEqual(attempt);
    expect(storeV2Schema.safeParse(finalized.value).success).toBe(true);
  });

  it('preserves unrelated assessment attempts and results during writes and finalization', () => {
    const firstAttempt = makeAttempt(undefined, {
      idFactory: () => 'attempt-first',
    });
    const otherAttempt = makeAttempt(undefined, {
      idFactory: () => 'attempt-other',
    });
    const firstResult = {
      ...makeResult(firstAttempt),
      id: 'result-first',
    };
    const existingResult = {
      ...makeResult(otherAttempt),
      id: 'result-other',
    };
    const source = enrichedStore();
    source.assessment.activeAttempts[otherAttempt.id] = otherAttempt;
    source.assessment.results[existingResult.id] = existingResult;

    const withFirst = putActiveAssessmentAttempt(source, firstAttempt.id, firstAttempt);
    if (!withFirst.ok) throw new Error('First attempt should store');
    const finalized = finalizeAssessmentStore(
      withFirst.value,
      firstAttempt.id,
      firstResult.id,
      firstResult,
    );
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.assessment.activeAttempts[otherAttempt.id]).toEqual(otherAttempt);
    expect(finalized.value.assessment.results[existingResult.id]).toEqual(existingResult);
  });

  it('rejects key mismatches, missing entries, and result-attempt mismatches', () => {
    const source = enrichedStore();
    const attempt = makeAttempt();
    const result = makeResult(attempt);
    expect(codes(putActiveAssessmentAttempt(source, 'wrong-key', attempt)))
      .toContain('ATTEMPT_STORE_KEY_MISMATCH');
    expect(codes(putAssessmentResult(source, 'wrong-key', result)))
      .toContain('RESULT_STORE_KEY_MISMATCH');
    expect(codes(getActiveAssessmentAttempt(source, attempt.id))).toContain('ATTEMPT_NOT_FOUND');
    expect(codes(getAssessmentResult(source, result.id))).toContain('RESULT_NOT_FOUND');

    const active = putActiveAssessmentAttempt(source, attempt.id, attempt);
    if (!active.ok) throw new Error('Active attempt should store');
    expect(codes(finalizeAssessmentStore(active.value, attempt.id, 'wrong-key', result)))
      .toContain('RESULT_STORE_KEY_MISMATCH');
    expect(codes(finalizeAssessmentStore(active.value, attempt.id, result.id, {
      ...result,
      attemptId: 'another-attempt',
    }))).toContain('RESULT_ATTEMPT_MISMATCH');
  });

  it('detects malformed keyed entries and rejects invalid result score pairs', () => {
    const attempt = makeAttempt();
    const malformed = enrichedStore();
    malformed.assessment.activeAttempts['wrong-key'] = attempt;
    expect(codes(getActiveAssessmentAttempt(malformed, 'wrong-key')))
      .toContain('ATTEMPT_STORE_KEY_MISMATCH');

    const result = makeResult(attempt);
    const malformedResult = enrichedStore();
    malformedResult.assessment.results['wrong-key'] = result;
    expect(codes(getAssessmentResult(malformedResult, 'wrong-key')))
      .toContain('RESULT_STORE_KEY_MISMATCH');
    expect(codes(putAssessmentResult(enrichedStore(), result.id, {
      ...result,
      score: 1,
      maxScore: null,
    }))).toContain('INVALID_STORE');
  });
});
