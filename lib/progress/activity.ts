import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import type { ProgressActivity } from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export function legacyRecentActivity(
  store: StoreV2,
  limit = 8,
): ProgressActivity[] {
  const items: ProgressActivity[] = [];
  modules.forEach((module) => {
    const active = store.active[module.id];
    if (active) {
      items.push({
        id: `legacy-started:${active.id}`,
        kind: 'legacy-started',
        moduleId: module.id,
        timestamp: active.startedAt,
        label: 'Legacy quiz started',
        destination: { view: 'quiz', moduleId: module.id },
      });
    }
    (store.results[module.id] ?? []).forEach((result) => {
      items.push({
        id: `legacy-completed:${result.id}`,
        kind: 'legacy-completed',
        moduleId: module.id,
        timestamp: result.submittedAt,
        label: 'Legacy quiz completed',
        scorePercentage: Math.round((result.score / result.total) * 100),
        destination: { view: 'results', moduleId: module.id },
      });
    });
  });
  return items
    .filter((item) => moduleMap.has(item.moduleId))
    .sort((left, right) => (
      right.timestamp.localeCompare(left.timestamp)
      || left.moduleId.localeCompare(right.moduleId)
      || left.id.localeCompare(right.id)
    ))
    .slice(0, limit);
}
