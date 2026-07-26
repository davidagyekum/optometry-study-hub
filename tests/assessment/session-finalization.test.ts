import { describe, expect, it } from 'vitest';
import { finalizeAssessmentAttempt } from '@/lib/assessment/session/finalizeAttempt';
import { assessmentResultSnapshotSchema } from '@/lib/storage/schemas';
import { makeAttempt } from '@/tests/fixtures/session-engine';

function finalize(score: number | null, maxScore: number | null) {
  return finalizeAssessmentAttempt({
    attempt: makeAttempt(),
    evaluation: { score, maxScore },
    now: () => new Date('2026-07-26T10:00:00.000Z'),
    idFactory: () => 'result-session-test',
  });
}

function codes(result: ReturnType<typeof finalize>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('externally evaluated assessment finalization', () => {
  it('finalizes an unscored result without doing grading in the engine', () => {
    const attempt = makeAttempt();
    const result = finalizeAssessmentAttempt({
      attempt,
      evaluation: { score: null, maxScore: null },
      now: () => new Date('2026-07-26T10:00:00.000Z'),
      idFactory: () => 'result-session-test',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(expect.objectContaining({
      id: 'result-session-test',
      attemptId: attempt.id,
      submittedAt: '2026-07-26T10:00:00.000Z',
      score: null,
      maxScore: null,
    }));
    expect(result.value.orderedQuestionIds).toEqual(attempt.orderedQuestionIds);
    expect(result.value.questionVersions).toEqual(attempt.questionVersions);
    expect(result.value.responses).toEqual(attempt.responses);
    expect(result.value.orderedQuestionIds).not.toBe(attempt.orderedQuestionIds);
    expect(assessmentResultSnapshotSchema.safeParse(result.value).success).toBe(true);
  });

  it('accepts an externally supplied bounded numeric score', () => {
    const result = finalize(7, 9);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.score).toBe(7);
    expect(result.value.maxScore).toBe(9);
  });

  it('rejects mixed, nonpositive, nonfinite, negative, and excessive evaluations', () => {
    expect(codes(finalize(null, 9))).toContain('EVALUATION_PAIR_MISMATCH');
    expect(codes(finalize(7, null))).toContain('EVALUATION_PAIR_MISMATCH');
    expect(codes(finalize(0, 0))).toContain('EVALUATION_MAX_INVALID');
    expect(codes(finalize(0, -1))).toContain('EVALUATION_MAX_INVALID');
    expect(codes(finalize(0, Number.POSITIVE_INFINITY))).toContain('EVALUATION_MAX_INVALID');
    expect(codes(finalize(-1, 9))).toContain('EVALUATION_SCORE_INVALID');
    expect(codes(finalize(10, 9))).toContain('EVALUATION_SCORE_INVALID');
    expect(codes(finalize(Number.NaN, 9))).toContain('EVALUATION_SCORE_INVALID');
  });

  it('rejects invalid result identifiers and clocks', () => {
    const attempt = makeAttempt();
    expect(codes(finalizeAssessmentAttempt({
      attempt,
      evaluation: { score: null, maxScore: null },
      idFactory: () => 'Invalid Result ID',
    }))).toContain('INVALID_RESULT_ID');
    expect(codes(finalizeAssessmentAttempt({
      attempt,
      evaluation: { score: null, maxScore: null },
      now: () => new Date('invalid'),
      idFactory: () => 'result-valid',
    }))).toContain('INVALID_TIMESTAMP');
  });
});
