import { isHvpPracticeBlueprintId } from '@/lib/assessment/hvp/selectors';
import type { ClientView } from '@/lib/navigation/clientRoute';

export type ControlledExperienceKind = 'hvp' | 'aqueous' | 'unknown';

export function controlledExperienceKind(
  view: ClientView,
  blueprintId?: string,
): ControlledExperienceKind {
  if (view === 'practice' || isHvpPracticeBlueprintId(blueprintId)) return 'hvp';
  if (view === 'pilot' || blueprintId === 'aqueous-vitreous-pilot-v1') return 'aqueous';
  return 'unknown';
}
