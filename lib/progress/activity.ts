import { modules } from '@/content/legacy/moduleCatalog';
import { safeLegacyPercentage } from '@/lib/progress/legacyAnalytics';
import type { ProgressActivity } from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

const moduleOrder = new Map(modules.map((module, index) => [module.id, index]));
const kindOrder: Record<ProgressActivity['kind'], number> = {
  'curated-started': 0,
  'written-started': 1,
  'legacy-started': 2,
  'curated-completed': 3,
  'written-completed': 4,
  'legacy-completed': 5,
};

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

export function sortProgressActivity(items: ProgressActivity[]): ProgressActivity[] {
  return [...items].sort((left, right) => (
    timestamp(right.timestamp) - timestamp(left.timestamp)
    || kindOrder[left.kind] - kindOrder[right.kind]
    || (moduleOrder.get(left.moduleId) ?? 999) - (moduleOrder.get(right.moduleId) ?? 999)
    || left.id.localeCompare(right.id)
  ));
}

export function mergeProgressActivity(
  legacy: ProgressActivity[],
  curated: ProgressActivity[],
  limit = 8,
): ProgressActivity[] {
  const unique = new Map<string, ProgressActivity>();
  [...legacy, ...curated].forEach((item) => {
    if (!unique.has(item.id)) unique.set(item.id, item);
  });
  return sortProgressActivity([...unique.values()]).slice(0, limit);
}

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
        actionLabel: 'Resume quiz',
        destination: { view: 'quiz', moduleId: module.id },
      });
    }
    const moduleResults = store.results[module.id] ?? [];
    const currentLatestId = moduleResults[0]?.id;
    moduleResults.forEach((result) => {
      const isLatest = result.id === currentLatestId;
      const percentage = safeLegacyPercentage(result);
      items.push({
        id: `legacy-completed:${result.id}`,
        kind: 'legacy-completed',
        moduleId: module.id,
        timestamp: result.submittedAt,
        label: 'Legacy quiz completed',
        detail: Number.isFinite(result.score) && Number.isFinite(result.total) && result.total > 0
          ? `${result.score}/${result.total}`
          : undefined,
        scorePercentage: percentage,
        actionLabel: isLatest ? 'Review latest' : 'View module history',
        destination: isLatest
          ? { view: 'results', moduleId: module.id }
          : { view: 'progress', moduleId: module.id },
      });
    });
  });
  return sortProgressActivity(items).slice(0, limit);
}
