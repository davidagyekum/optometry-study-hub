import { describe, expect, it } from 'vitest';
import {
  legacyRecentActivity,
  mergeProgressActivity,
} from '@/lib/progress/activity';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { ProgressActivity } from '@/lib/progress/types';

function event(
  id: string,
  timestamp: string,
  kind: ProgressActivity['kind'],
): ProgressActivity {
  const written = kind.startsWith('written');
  return {
    id,
    kind,
    moduleId: 'human-visual-perception',
    timestamp,
    label: id,
    detail: written ? 'Not scored' : undefined,
    actionLabel: 'Review exact result',
    destination: { view: 'assessment-result', moduleId: id },
  };
}

describe('unified recent activity', () => {
  it('merges before sorting and applies the maximum of eight afterward', () => {
    const legacy = Array.from({ length: 6 }, (_, index) => (
      event(`legacy-${index}`, `2026-07-${String(index + 1).padStart(2, '0')}T08:00:00.000Z`, 'legacy-completed')
    ));
    const curated = Array.from({ length: 6 }, (_, index) => (
      event(`curated-${index}`, `2026-07-${String(index + 7).padStart(2, '0')}T08:00:00.000Z`, 'curated-completed')
    ));
    const merged = mergeProgressActivity(legacy, curated);
    expect(merged).toHaveLength(8);
    expect(merged[0].id).toBe('curated-5');
    expect(merged.some((item) => item.id === 'legacy-5')).toBe(true);
  });

  it('uses deterministic ties and keeps Written Practice visibly unscored', () => {
    const timestamp = '2026-07-01T08:00:00.000Z';
    const first = mergeProgressActivity([
      event('legacy', timestamp, 'legacy-completed'),
    ], [
      event('written', timestamp, 'written-completed'),
      event('curated', timestamp, 'curated-completed'),
    ]);
    const second = mergeProgressActivity([
      event('legacy', timestamp, 'legacy-completed'),
    ], [
      event('written', timestamp, 'written-completed'),
      event('curated', timestamp, 'curated-completed'),
    ]);
    expect(first).toEqual(second);
    expect(first.find((item) => item.id === 'written')).toMatchObject({
      detail: 'Not scored',
    });
    expect(first.find((item) => item.id === 'written')?.scorePercentage).toBeUndefined();
  });

  it('routes only the current legacy result to the latest-result screen', () => {
    const store = createEmptyStoreV2();
    store.results['human-visual-perception'] = [
      {
        id: 'latest',
        moduleId: 'human-visual-perception',
        startedAt: '2026-07-02T07:00:00.000Z',
        submittedAt: '2026-07-02T08:00:00.000Z',
        score: 40,
        total: 50,
        order: [],
        optionOrder: {},
        answers: {},
        flags: [],
        current: 0,
      },
      {
        id: 'older',
        moduleId: 'human-visual-perception',
        startedAt: '2026-07-01T07:00:00.000Z',
        submittedAt: '2026-07-01T08:00:00.000Z',
        score: 30,
        total: 50,
        order: [],
        optionOrder: {},
        answers: {},
        flags: [],
        current: 0,
      },
    ];
    const activity = legacyRecentActivity(store);
    expect(activity.find((item) => item.id.endsWith(':latest'))).toMatchObject({
      actionLabel: 'Review latest',
      destination: { view: 'results' },
    });
    expect(activity.find((item) => item.id.endsWith(':older'))).toMatchObject({
      actionLabel: 'View module history',
      destination: { view: 'progress' },
    });
  });
});
