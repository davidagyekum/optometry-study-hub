import {
  resolveCuratedExperienceByBlueprint,
  resolveCuratedExperienceByRoute,
} from '@/lib/assessment/curated/resolveExperience';
import type { ClientView } from '@/lib/navigation/clientRoute';

export type ControlledExperienceKind = 'curated' | 'aqueous' | 'unknown';

export function controlledExperienceKind(
  view: ClientView,
  blueprintId?: string,
  resourceId = '',
): ControlledExperienceKind {
  const curated = view === 'practice'
    ? resolveCuratedExperienceByRoute(resourceId)
    : resolveCuratedExperienceByBlueprint(blueprintId);
  if (curated) return 'curated';
  if (view === 'pilot' || blueprintId === 'aqueous-vitreous-pilot-v1') return 'aqueous';
  return 'unknown';
}
