'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadCuratedProgressModule } from '@/lib/assessment/curated/loaders';
import { isCuratedExperienceEnabled } from '@/lib/assessment/curated/experienceRegistry';
import type {
  CuratedExperienceAdapter,
  CuratedProgressContribution,
} from '@/lib/assessment/curated/types';
import type { StoreV2 } from '@/lib/storage/schemas';

type ContributionState = {
  sourceStore?: StoreV2;
  sourceExperienceIds: string;
  contributions: CuratedProgressContribution[];
  failureCount: number;
};

const EMPTY = {
  loading: false,
  contributions: [] as CuratedProgressContribution[],
  failureCount: 0,
};

export function useCuratedProgressContributions(
  registry: readonly CuratedExperienceAdapter[],
  store: StoreV2,
) {
  const enabled = useMemo(
    () => registry.filter(isCuratedExperienceEnabled),
    [registry],
  );
  const sourceExperienceIds = enabled.map(
    (adapter) => adapter.summary.experienceId,
  ).join('|');
  const [state, setState] = useState<ContributionState>({
    sourceExperienceIds: '',
    contributions: [],
    failureCount: 0,
  });

  useEffect(() => {
    let active = true;
    if (!enabled.length) {
      return () => {
        active = false;
      };
    }
    Promise.all(enabled.map(async (adapter) => {
      try {
        const loaded = await loadCuratedProgressModule(adapter);
        return { contribution: loaded.getContribution(store) };
      } catch {
        return { failed: true as const };
      }
    })).then((results) => {
      if (!active) return;
      setState({
        sourceStore: store,
        sourceExperienceIds,
        contributions: results.flatMap((result) => (
          'contribution' in result && result.contribution
            ? [result.contribution]
            : []
        )),
        failureCount: results.filter((result) => 'failed' in result).length,
      });
    });
    return () => {
      active = false;
    };
  }, [enabled, sourceExperienceIds, store]);

  if (!enabled.length) return EMPTY;
  if (
    state.sourceStore !== store
    || state.sourceExperienceIds !== sourceExperienceIds
  ) {
    return { ...EMPTY, loading: true };
  }
  return { ...state, loading: false };
}
