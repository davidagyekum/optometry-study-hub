import {
  resolveCuratedExperienceByBlueprint,
  resolveCuratedExperienceByRoute,
} from '@/lib/assessment/curated/resolveExperience';
import type { ClientView } from '@/lib/navigation/clientRoute';

export type ControlledExperienceKind = 'hvp' | 'aqueous' | 'unknown';

export function controlledExperienceKind(
  view: ClientView,
  blueprintId?: string,
  resourceId = '',
): ControlledExperienceKind {
  const curated = view === 'practice'
    ? resolveCuratedExperienceByRoute(resourceId)
    : resolveCuratedExperienceByBlueprint(blueprintId);
  if (curated?.summary.experienceId === 'human-visual-perception') return 'hvp';
  if (view === 'pilot' || blueprintId === 'aqueous-vitreous-pilot-v1') return 'aqueous';
  return 'unknown';
}
