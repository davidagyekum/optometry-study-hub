'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { CuratedPracticeRequest } from '@/lib/assessment/curated/definition';
import { hvpPracticeDefinition } from '@/lib/assessment/hvp/definition';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { useCuratedPracticeController } from '@/hooks/useCuratedPracticeController';
import type { StoreV2 } from '@/lib/storage/schemas';

export type HvpPracticeRequest = CuratedPracticeRequest;

export function useHvpCuratedPractice({
  store,
  setStore,
  go,
}: {
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  return useCuratedPracticeController({
    definition: hvpPracticeDefinition,
    store,
    setStore,
    go,
  });
}
