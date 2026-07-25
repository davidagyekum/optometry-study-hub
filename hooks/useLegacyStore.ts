'use client';

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { createStudyPersistenceCoordinator } from '@/lib/storage/persistenceCoordinator';
import type { StoreV2 } from '@/lib/storage/schemas';

export function useLegacyStore() {
  const [coordinator] = useState(createStudyPersistenceCoordinator);
  const [store, setStoreState] = useState<StoreV2>(createEmptyStoreV2);
  const [hydrated, setHydrated] = useState(false);
  const setStore = useCallback<Dispatch<SetStateAction<StoreV2>>>((update) => {
    coordinator.markDirty();
    setStoreState(update);
  }, [coordinator]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStoreState(coordinator.hydrate());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [coordinator]);

  useEffect(() => {
    if (hydrated) coordinator.persistIfDirty(store);
  }, [coordinator, store, hydrated]);

  return { store, setStore };
}
