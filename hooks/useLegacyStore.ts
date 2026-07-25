'use client';

import { useEffect, useState } from 'react';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';
import { loadStore, saveStore } from '@/lib/storage/store';

export function useLegacyStore() {
  const [store, setStore] = useState<StoreV2>(createEmptyStoreV2);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStore(loadStore());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) saveStore(store);
  }, [store, hydrated]);

  return { store, setStore };
}
