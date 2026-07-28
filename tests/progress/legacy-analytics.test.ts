import { describe, expect, it } from 'vitest';
import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import {
  legacyCourseAnalytics,
  legacyModuleAnalytics,
} from '@/lib/progress/legacyAnalytics';
import { legacyRecentActivity } from '@/lib/progress/activity';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { Attempt, Result } from '@/lib/legacy/types';

const targetModule = moduleMap.get('human-visual-perception')!;
const multiModuleCourse = courses.find((candidate) => candidate.moduleIds.length > 1)!;

function result(id: string, score: number, submittedAt: string): Result {
  return {
    id,
    moduleId: targetModule.id,
    startedAt: '2026-01-01T08:00:00.000Z',
    submittedAt,
    score,
    total: 50,
    order: [],
    optionOrder: {},
    answers: {},
    flags: [],
    current: 0,
  };
}

function attempt(): Attempt {
  return {
    id: 'active-hvp',
    moduleId: targetModule.id,
    startedAt: '2026-01-04T08:00:00.000Z',
    order: [],
    optionOrder: {},
    answers: { q1: 'a', q2: 'b' },
    flags: ['q2'],
    current: 1,
  };
}

describe('legacy progress analytics', () => {
  it('returns truthful empty-store values', () => {
    const analytics = legacyModuleAnalytics(targetModule, createEmptyStoreV2());
    expect(analytics).toMatchObject({
      readingCompleted: 0,
      readingTotal: targetModule.sections.length,
      readingPercentage: 0,
      savedResultCount: 0,
    });
    expect(analytics.latestPercentage).toBeUndefined();
    expect(analytics.bestPercentage).toBeUndefined();
  });

  it('sorts saved results and calculates latest, best, and arithmetic recent average', () => {
    const store = createEmptyStoreV2();
    store.read[targetModule.id] = targetModule.sections.slice(0, 2).map((section) => section.id);
    store.results[targetModule.id] = [
      result('older', 20, '2026-01-01T09:00:00.000Z'),
      result('latest', 30, '2026-01-03T09:00:00.000Z'),
      result('best', 40, '2026-01-02T09:00:00.000Z'),
    ];
    store.active[targetModule.id] = attempt();
    const analytics = legacyModuleAnalytics(targetModule, store);
    expect(analytics.latestResult?.id).toBe('latest');
    expect(analytics.latestPercentage).toBe(60);
    expect(analytics.bestPercentage).toBe(80);
    expect(analytics.recentAveragePercentage).toBe(60);
    expect(analytics.activeAttempt).toMatchObject({ answeredCount: 2, flaggedCount: 1 });
  });

  it('aggregates course percentages by saved session, not raw cross-module scores', () => {
    const store = createEmptyStoreV2();
    const first = moduleMap.get(multiModuleCourse.moduleIds[0])!;
    const second = moduleMap.get(multiModuleCourse.moduleIds[1])!;
    store.results[first.id] = [{ ...result('first', 25, '2026-01-01T09:00:00.000Z'), moduleId: first.id }];
    store.results[second.id] = [{
      ...result('second', 45, '2026-01-02T09:00:00.000Z'),
      moduleId: second.id,
    }];
    const analytics = legacyCourseAnalytics(multiModuleCourse, store);
    expect(analytics.savedResultCount).toBe(2);
    expect(analytics.recentAveragePercentage).toBe(70);
    expect(analytics.latestPercentage).toBe(90);
  });

  it('reports only the retained saved history and limits real-timestamp activity', () => {
    const store = createEmptyStoreV2();
    store.results[targetModule.id] = Array.from({ length: 20 }, (_, index) => result(
      `saved-${index}`,
      index,
      `2026-01-${String(index + 1).padStart(2, '0')}T09:00:00.000Z`,
    ));
    expect(legacyModuleAnalytics(targetModule, store).savedResultCount).toBe(20);
    const activity = legacyRecentActivity(store);
    expect(activity).toHaveLength(8);
    expect(activity[0].timestamp > activity[7].timestamp).toBe(true);
  });
});
