import { describe, expect, it } from 'vitest';
import { modules } from '@/content/legacy/moduleCatalog';
import { legacyModuleAnalytics } from '@/lib/progress/legacyAnalytics';
import { legacyRecommendations } from '@/lib/progress/recommendations';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('legacy safety and reading recommendation ordering', () => {
  it('compares reading percentages before authored-order ties', () => {
    const store = createEmptyStoreV2();
    modules.forEach((module) => {
      store.read[module.id] = module.sections.map((section) => section.id);
    });
    const first = modules[0];
    const second = modules[1];
    store.read[first.id] = first.sections.slice(0, Math.ceil(first.sections.length / 2))
      .map((section) => section.id);
    store.read[second.id] = [];
    expect(legacyRecommendations(store)[0].moduleId).toBe(second.id);

    store.read[first.id] = [];
    expect(legacyRecommendations(store)[0].moduleId).toBe(first.id);
  });

  it('preserves malformed raw results while excluding them from score math', () => {
    const store = createEmptyStoreV2();
    const targetModule = modules[0];
    store.results[targetModule.id] = [{
      id: 'invalid-score',
      moduleId: targetModule.id,
      startedAt: 'bad-start',
      submittedAt: 'bad-submit',
      score: Number.NaN,
      total: 0,
      order: [],
      optionOrder: {},
      answers: {},
      flags: [],
      current: 0,
    }];
    const before = structuredClone(store);
    const analytics = legacyModuleAnalytics(targetModule, store);
    legacyRecommendations(store);
    expect(analytics.latestPercentage).toBeUndefined();
    expect(analytics.bestPercentage).toBeUndefined();
    expect(analytics.recentAveragePercentage).toBeUndefined();
    expect(Number.isNaN(store.results[targetModule.id][0].score)).toBe(true);
    expect(store.results[targetModule.id][0]).toEqual(before.results[targetModule.id][0]);
  });
});
