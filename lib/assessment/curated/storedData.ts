import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export type HiddenCuratedData = {
  activeAttemptCount: number;
  resultCount: number;
  experienceIds: string[];
};

export function hiddenCuratedData(
  store: StoreV2,
  summaries: readonly CuratedExperienceSummary[],
): HiddenCuratedData {
  const disabled = summaries.filter((summary) => !summary.enabled);
  const blueprintOwners = new Map<string, string>();
  disabled.forEach((summary) => {
    summary.blueprintIds.forEach((blueprintId) => {
      blueprintOwners.set(blueprintId, summary.experienceId);
    });
  });
  const owners = new Set<string>();
  const attempts = Object.values(store.assessment.activeAttempts).filter(
    (attempt) => {
      const owner = blueprintOwners.get(attempt.blueprintId ?? '');
      if (owner) owners.add(owner);
      return Boolean(owner);
    },
  );
  const results = Object.values(store.assessment.results).filter((result) => {
    const owner = blueprintOwners.get(result.blueprintId ?? '');
    if (owner) owners.add(owner);
    return Boolean(owner);
  });
  return {
    activeAttemptCount: attempts.length,
    resultCount: results.length,
    experienceIds: [...owners].sort(),
  };
}
