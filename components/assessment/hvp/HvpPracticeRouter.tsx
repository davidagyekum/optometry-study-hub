'use client';

import type { Dispatch, SetStateAction } from 'react';
import { CuratedDefinitionRouter } from '@/components/assessment/curated/CuratedDefinitionRouter';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { hvpPracticeDefinition } from '@/lib/assessment/hvp/definition';
import type { ClientView } from '@/lib/navigation/clientRoute';
import type { StoreV2 } from '@/lib/storage/schemas';

export function HvpPracticeRouter({
  view,
  resourceId,
  store,
  setStore,
  go,
}: {
  view: ClientView;
  resourceId: string;
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  return (
    <CuratedDefinitionRouter
      definition={hvpPracticeDefinition}
      go={go}
      resourceId={resourceId}
      setStore={setStore}
      store={store}
      view={view}
    />
  );
}
