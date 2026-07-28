import { describe, expect, it } from 'vitest';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { legacyRecommendations } from '@/lib/progress/recommendations';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { Result } from '@/lib/legacy/types';

const first = modules[0];

function saved(score: number): Result {
  return {
    id: 'saved',
    moduleId: first.id,
    startedAt: '2026-01-01T08:00:00.000Z',
    submittedAt: '2026-01-01T09:00:00.000Z',
    score,
    total: 50,
    order: [],
    optionOrder: {},
    answers: {},
    flags: [],
    current: 0,
  };
}

describe('legacy recommendations', () => {
  it('uses active, reading, first-quiz, low-score, then review priorities', () => {
    const store = createEmptyStoreV2();
    store.active[first.id] = {
      ...saved(0),
      answers: { one: 'answer' },
      flags: [],
    };
    expect(legacyRecommendations(store)[0].id).toBe(`resume-legacy:${first.id}`);

    delete store.active[first.id];
    expect(legacyRecommendations(store)[0].id).toBe(`continue-reading:${first.id}`);

    modules.forEach((module) => {
      store.read[module.id] = module.sections.map((section) => section.id);
    });
    expect(legacyRecommendations(store)[0].id).toBe(`first-legacy:${first.id}`);

    modules.forEach((module) => {
      store.results[module.id] = [{ ...saved(30), id: `low-${module.id}`, moduleId: module.id }];
    });
    expect(legacyRecommendations(store)[0].id).toBe(`retake-legacy:${first.id}`);

    modules.forEach((module) => {
      store.results[module.id] = [{ ...saved(45), id: `high-${module.id}`, moduleId: module.id }];
    });
    expect(legacyRecommendations(store)[0].id).toBe(`review-legacy:${first.id}`);
  });

  it('breaks equal-priority ties in authored course and module order', () => {
    const recommendations = legacyRecommendations(createEmptyStoreV2());
    const authoredOrder = courses.flatMap((course) => course.moduleIds);
    expect(recommendations.map((item) => item.moduleId)).toEqual(authoredOrder);
  });
});
