import { describe, expect, it } from 'vitest';
import {
  clearAttemptResponse,
  moveAttemptNext,
  moveAttemptPrevious,
  moveAttemptToIndex,
  setAttemptResponse,
  toggleAttemptFlag,
} from '@/lib/assessment/session/attemptActions';
import {
  makeAttempt,
  makeDraftRegistry,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('immutable assessment-attempt actions', () => {
  it('sets, replaces, and clears a validated response without mutating prior snapshots', () => {
    const registry = makeDraftRegistry();
    const question = questionByFormat('single_best_answer');
    const source = makeAttempt([question.id]);
    const original = structuredClone(source);

    const first = setAttemptResponse(source, registry, question.id, {
      format: 'single_best_answer',
      optionId: 'trabecular-meshwork',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(source).toEqual(original);
    expect(first.value).not.toBe(source);

    const second = setAttemptResponse(first.value, registry, question.id, {
      format: 'single_best_answer',
      optionId: 'posterior-chamber',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(first.value.responses[question.id]).toEqual({
      format: 'single_best_answer',
      optionId: 'trabecular-meshwork',
    });
    expect(second.value.responses[question.id]).toEqual({
      format: 'single_best_answer',
      optionId: 'posterior-chamber',
    });

    const cleared = clearAttemptResponse(second.value, question.id);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.responses).toEqual({});
    const clearedAgain = clearAttemptResponse(cleared.value, question.id);
    expect(clearedAgain).toEqual({ ok: true, value: cleared.value });
  });

  it('rejects invalid responses and questions outside the attempt', () => {
    const registry = makeDraftRegistry();
    const question = questionByFormat('single_best_answer');
    const attempt = makeAttempt([question.id]);

    expect(codes(setAttemptResponse(attempt, registry, question.id, {
      format: 'single_best_answer',
      optionId: 'missing-option',
    }))).toContain('RESPONSE_OPTION_NOT_FOUND');
    expect(codes(setAttemptResponse(attempt, registry, 'missing-question', {
      format: 'short_answer',
      text: 'answer',
    }))).toContain('QUESTION_NOT_IN_ATTEMPT');
    expect(codes(clearAttemptResponse(attempt, 'missing-question')))
      .toContain('QUESTION_NOT_IN_ATTEMPT');
    expect(codes(toggleAttemptFlag(attempt, 'missing-question')))
      .toContain('QUESTION_NOT_IN_ATTEMPT');
  });

  it('toggles each flag once while preserving the source snapshot', () => {
    const questionId = questionByFormat('single_best_answer').id;
    const source = makeAttempt([questionId]);
    const flagged = toggleAttemptFlag(source, questionId);
    expect(flagged.ok).toBe(true);
    if (!flagged.ok) return;
    expect(source.flags).toEqual([]);
    expect(flagged.value.flags).toEqual([questionId]);

    const unflagged = toggleAttemptFlag(flagged.value, questionId);
    expect(unflagged.ok).toBe(true);
    if (!unflagged.ok) return;
    expect(unflagged.value.flags).toEqual([]);
  });

  it('moves directly and clamps next and previous navigation at boundaries', () => {
    const ids = makeDraftRegistry().questionIds().slice(0, 3);
    const attempt = makeAttempt(ids);
    const moved = moveAttemptToIndex(attempt, 2);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(attempt.currentIndex).toBe(0);
    expect(moved.value.currentIndex).toBe(2);
    expect(moveAttemptNext(moved.value)).toEqual({ ok: true, value: moved.value });

    const middle = moveAttemptToIndex(attempt, 1);
    expect(middle.ok).toBe(true);
    if (!middle.ok) return;
    const previous = moveAttemptPrevious(middle.value);
    expect(previous.ok && previous.value.currentIndex).toBe(0);
    expect(moveAttemptPrevious(attempt)).toEqual({ ok: true, value: attempt });

    expect(codes(moveAttemptToIndex(attempt, -1))).toContain('CURRENT_INDEX_OUT_OF_RANGE');
    expect(codes(moveAttemptToIndex(attempt, 3))).toContain('CURRENT_INDEX_OUT_OF_RANGE');
    expect(codes(moveAttemptToIndex(attempt, 1.5))).toContain('CURRENT_INDEX_OUT_OF_RANGE');
  });
});
