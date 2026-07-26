import { describe, expect, it } from 'vitest';
import {
  authoredPresentationIds,
  createPresentationOrder,
  isExactPermutation,
  shuffleIds,
} from '@/lib/assessment/session/ordering';
import {
  fixedRandom,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

const shuffleableFormats = [
  'single_best_answer',
  'multiple_response',
  'ordering',
  'matching',
  'extended_matching',
  'image_label',
] as const;

describe('format-specific presentation ordering', () => {
  it.each(shuffleableFormats)('creates an exact deterministic permutation for %s', (format) => {
    const question = questionByFormat(format);
    const before = structuredClone(question);
    const authored = authoredPresentationIds(question);
    const first = createPresentationOrder(question, fixedRandom());
    const second = createPresentationOrder(question, fixedRandom());

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok || !authored) return;
    expect(isExactPermutation(first.value ?? [], authored)).toBe(true);
    expect(second.value).toEqual(first.value);
    expect(question).toEqual(before);
  });

  it.each(['image_hotspot', 'short_answer', 'open_response'] as const)(
    'does not invent presentation order for %s',
    (format) => {
      const question = questionByFormat(format);
      const result = createPresentationOrder(question, fixedRandom());
      expect(result).toEqual({ ok: true, value: undefined });
    },
  );

  it('never mutates the source array and rejects an invalid injected random value', () => {
    const source = ['alpha', 'beta', 'gamma'];
    const snapshot = [...source];
    const valid = shuffleIds(source, fixedRandom());
    expect(valid.ok).toBe(true);
    expect(source).toEqual(snapshot);

    const invalid = shuffleIds(source, () => Number.NaN);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.issues[0].code).toBe('INVALID_RANDOM_VALUE');
  });
});
