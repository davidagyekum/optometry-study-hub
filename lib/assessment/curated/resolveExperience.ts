import { curatedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import type {
  CuratedExperienceAdapter,
  CuratedExperienceSummary,
} from '@/lib/assessment/curated/types';
import type { ClientView } from '@/lib/navigation/clientRoute';

export function resolveCuratedExperienceById(
  experienceId: string,
  registry: readonly CuratedExperienceAdapter[] = curatedExperienceRegistry,
): CuratedExperienceAdapter | undefined {
  return registry.find((entry) => entry.summary.experienceId === experienceId);
}

export function resolveCuratedExperienceByRoute(
  routeSegment: string,
  registry: readonly CuratedExperienceAdapter[] = curatedExperienceRegistry,
): CuratedExperienceAdapter | undefined {
  return registry.find((entry) => entry.summary.routeSegment === routeSegment);
}

export function resolveCuratedExperienceByBlueprint(
  blueprintId: string | undefined,
  registry: readonly CuratedExperienceAdapter[] = curatedExperienceRegistry,
): CuratedExperienceAdapter | undefined {
  if (!blueprintId) return undefined;
  return registry.find((entry) => entry.summary.blueprintIds.includes(blueprintId));
}

export function resolveCuratedExperienceByModule(
  moduleId: string,
  registry: readonly CuratedExperienceAdapter[] = curatedExperienceRegistry,
): CuratedExperienceAdapter | undefined {
  return registry.find((entry) => entry.summary.moduleId === moduleId);
}

export function resolveCuratedExperienceForControlledRoute(
  view: ClientView,
  resourceId: string,
  blueprintId?: string,
  registry: readonly CuratedExperienceAdapter[] = curatedExperienceRegistry,
): CuratedExperienceAdapter | undefined {
  if (view === 'practice') {
    return resolveCuratedExperienceByRoute(resourceId, registry);
  }
  if (view === 'assessment' || view === 'assessment-result') {
    return resolveCuratedExperienceByBlueprint(blueprintId, registry);
  }
  return undefined;
}

export function summaryForModule(
  moduleId: string,
  summaries: readonly CuratedExperienceSummary[],
): CuratedExperienceSummary | undefined {
  return summaries.find((summary) => summary.moduleId === moduleId);
}
