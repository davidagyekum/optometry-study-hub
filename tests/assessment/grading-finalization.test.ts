import { describe, expect, it } from 'vitest';
import {
  attachGradingSnapshot,
  finalizeGradedAssessmentAttempt,
} from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  finalizeAssessmentStore,
  putActiveAssessmentAttempt,
} from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { assessmentResultSnapshotSchema } from '@/lib/storage/schemas';
import {
  correctResponseFor,
  incorrectResponseFor,
} from '@/tests/fixtures/grading';
import {
  makeAttempt,
  makeDraftRegistry,
  makeResult,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

const now = () => new Date('2026-07-26T12:00:00.000Z');
const idFactory = () => 'result-graded';

function finalize(attempt: ReturnType<typeof makeAttempt>) {
  return finalizeGradedAssessmentAttempt({
    attempt,
    registry: makeDraftRegistry(),
    now,
    idFactory,
  });
}

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('grading-aware finalization', () => {
  it('creates a complete strict result with policy and grading snapshot', () => {
    const question = questionByFormat('single_best_answer');
    const attempt = makeAttempt([question.id], { mode: 'exam' });
    attempt.responses[question.id] = correctResponseFor(question);
    const finalized = finalize(attempt);
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.result).toEqual(expect.objectContaining({
      attemptId: attempt.id,
      gradingPolicy: { id: 'strict', version: 1 },
      orderedQuestionIds: attempt.orderedQuestionIds,
      questionVersions: attempt.questionVersions,
      responses: attempt.responses,
      score: 1,
      maxScore: 1,
      grading: expect.objectContaining({
        schemaVersion: 1,
        status: 'complete',
        score: 1,
        maxScore: 1,
      }),
    }));
    expect(assessmentResultSnapshotSchema.safeParse(finalized.value.result).success)
      .toBe(true);
  });

  it('preserves deterministic diagnostic fractional scores', () => {
    const question = questionByFormat('matching');
    const attempt = makeAttempt([question.id]);
    attempt.responses[question.id] = incorrectResponseFor(question);
    const finalized = finalize(attempt);
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.result.score).toBe(0.333333);
    expect(finalized.value.result.maxScore).toBe(1);
    expect(finalized.value.result.grading?.partialCount).toBe(1);
  });

  it('keeps answered open responses manual with null top-level totals', () => {
    const question = questionByFormat('open_response');
    const attempt = makeAttempt([question.id]);
    attempt.responses[question.id] = correctResponseFor(question);
    const finalized = finalize(attempt);
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.result).toEqual(expect.objectContaining({
      score: null,
      maxScore: null,
      grading: expect.objectContaining({
        status: 'manual_required',
        score: null,
        maxScore: null,
        autoScore: 0,
        autoMaxScore: 0,
        manualRequiredCount: 1,
      }),
    }));
  });

  it('rejects invalid externally supplied grading reports', () => {
    const attached = attachGradingSnapshot(makeResult(), {
      status: 'complete',
      questionGrades: {},
    });
    expect(codes(attached)).toContain('GRADING_REPORT_INVALID');
  });

  it('atomically stores a valid graded result and rejects snapshot tampering', () => {
    const question = questionByFormat('single_best_answer');
    const attempt = makeAttempt([question.id], { mode: 'exam' });
    attempt.responses[question.id] = correctResponseFor(question);
    const finalized = finalize(attempt);
    if (!finalized.ok) throw new Error('Graded finalization should succeed');
    const active = putActiveAssessmentAttempt(
      createEmptyStoreV2(),
      attempt.id,
      attempt,
    );
    if (!active.ok) throw new Error('Attempt should store');
    const stored = finalizeAssessmentStore(
      active.value,
      attempt.id,
      finalized.value.result.id,
      finalized.value.result,
    );
    expect(stored.ok).toBe(true);

    const policyTampered = structuredClone(finalized.value.result);
    policyTampered.gradingPolicy = { id: 'diagnostic', version: 1 };
    expect(codes(finalizeAssessmentStore(
      active.value,
      attempt.id,
      policyTampered.id,
      policyTampered,
    ))).toContain('RESULT_ATTEMPT_SNAPSHOT_MISMATCH');

    const responseTampered = structuredClone(finalized.value.result);
    responseTampered.responses[question.id] = incorrectResponseFor(question);
    expect(codes(finalizeAssessmentStore(
      active.value,
      attempt.id,
      responseTampered.id,
      responseTampered,
    ))).toContain('RESULT_ATTEMPT_SNAPSHOT_MISMATCH');
  });
});
