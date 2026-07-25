import { describe, expect, it } from 'vitest';
import { modules } from '@/content/legacy/moduleCatalog';
import {
  bestScore,
  bestScorePercentage,
  courseReadingCompletion,
  latestResult,
  moduleReadingPercentage,
  overallReadingCompletion,
  scorePercentage,
} from '@/lib/legacy/progress';
import type { Result, Store } from '@/lib/legacy/types';

const emptyStore = (): Store => ({ version: 1, read: {}, active: {}, results: {} });

function result(score: number, submittedAt: string): Result {
  return {
    id: submittedAt,
    moduleId: modules[0].id,
    startedAt: submittedAt,
    submittedAt,
    order: [],
    optionOrder: {},
    answers: {},
    flags: [],
    current: 0,
    score,
    total: 50,
  };
}

describe('legacy progress helpers', () => {
  it('calculates module reading progress for none, some, and all sections', () => {
    const studyModule = modules[0];
    expect(moduleReadingPercentage(studyModule, [])).toBe(0);
    expect(moduleReadingPercentage(studyModule, studyModule.sections.slice(0, 2).map((section) => section.id))).toBe(
      Math.round((2 / studyModule.sections.length) * 100),
    );
    expect(moduleReadingPercentage(studyModule, studyModule.sections.map((section) => section.id))).toBe(100);
  });

  it('calculates course and overall reading completion', () => {
    const selected = modules.slice(0, 2);
    const store = emptyStore();
    expect(courseReadingCompletion(selected, store)).toEqual({
      completed: 0,
      total: selected.reduce((sum, item) => sum + item.sections.length, 0),
      percentage: 0,
    });

    store.read[selected[0].id] = [selected[0].sections[0].id];
    const partial = courseReadingCompletion(selected, store);
    expect(partial.completed).toBe(1);
    expect(partial.percentage).toBe(Math.round((1 / partial.total) * 100));

    modules.forEach((item) => {
      store.read[item.id] = item.sections.map((section) => section.id);
    });
    expect(overallReadingCompletion(modules, store).percentage).toBe(100);
  });

  it('selects latest and best results while preserving current score formulas', () => {
    expect(latestResult([])).toBeUndefined();
    expect(bestScore([])).toBeUndefined();
    expect(bestScorePercentage([])).toBeUndefined();

    const older = result(25, '2026-01-01T00:00:00.000Z');
    const latest = result(40, '2026-02-01T00:00:00.000Z');
    const best = result(45, '2026-01-15T00:00:00.000Z');

    expect(latestResult([older])).toBe(older);
    expect(latestResult([latest, older, best])).toBe(latest);
    expect(bestScore([latest, older, best])).toBe(45);
    expect(scorePercentage(latest)).toBe(80);
    expect(bestScorePercentage([latest, older, best])).toBe(90);
  });
});
