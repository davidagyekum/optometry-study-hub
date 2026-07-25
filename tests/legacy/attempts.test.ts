import { describe, expect, it } from 'vitest';
import { modules } from '@/content/legacy/moduleCatalog';
import {
  calculateScore,
  countUnanswered,
  createAttempt,
  shuffle,
} from '@/lib/legacy/attempts';
import { questionsFor } from '@/lib/legacy/questionGenerator';

describe('legacy attempt helpers', () => {
  it('supports deterministic Fisher-Yates shuffling without mutating input', () => {
    const input = [1, 2, 3, 4];
    expect(shuffle(input, () => 0)).toEqual([2, 3, 4, 1]);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('creates a complete deterministic attempt representation', () => {
    const studyModule = modules[0];
    const questions = questionsFor(studyModule);
    const now = new Date('2026-01-02T03:04:05.000Z');
    const attempt = createAttempt(studyModule, () => 0, () => now);

    expect(attempt.id).toBe(`${studyModule.id}-${now.getTime()}`);
    expect(attempt.startedAt).toBe(now.toISOString());
    expect(attempt.order).toHaveLength(questions.length);
    expect(new Set(attempt.order)).toEqual(new Set(questions.map((question) => question.id)));
    expect(Object.keys(attempt.optionOrder)).toHaveLength(questions.length);
    questions.forEach((question) => {
      expect(new Set(attempt.optionOrder[question.id])).toEqual(new Set(question.options));
    });
    expect(attempt.answers).toEqual({});
    expect(attempt.flags).toEqual([]);
    expect(attempt.current).toBe(0);
  });

  it('scores answered questions exactly and leaves unanswered questions incorrect', () => {
    const studyModule = modules[0];
    const questions = questionsFor(studyModule);
    const byId = new Map(questions.map((question) => [question.id, question]));
    const attempt = createAttempt(studyModule, () => 0, () => new Date(0));
    attempt.answers[attempt.order[0]] = byId.get(attempt.order[0])!.correct;
    attempt.answers[attempt.order[1]] = 'Definitely incorrect';
    attempt.flags = [attempt.order[2]];
    attempt.current = 2;

    expect(calculateScore(attempt, byId)).toBe(1);
    expect(countUnanswered(attempt)).toBe(48);
    expect(attempt.flags).toEqual([attempt.order[2]]);
    expect(attempt.current).toBe(2);
  });
});
