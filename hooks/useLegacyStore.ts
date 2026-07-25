'use client';

import { useEffect, useState } from 'react';
import type { Store } from '@/lib/legacy/types';
import {
  EMPTY_STORE,
  loadLegacyStore,
  saveLegacyStore,
} from '@/lib/storage/legacyStore';

export function useLegacyStore() {
  const [store, setStore] = useState<Store>(EMPTY_STORE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStore(loadLegacyStore());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) saveLegacyStore(store);
  }, [store, hydrated]);

  return { store, setStore };
}
