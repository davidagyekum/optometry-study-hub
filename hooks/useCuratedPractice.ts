'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type { SessionResult } from '@/lib/assessment/session/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export type CuratedTransactionValue<T> = {
  store: StoreV2;
  value: T;
};

export function useCuratedPractice({
  store,
  setStore,
}: {
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
}) {
  const latestStoreRef = useRef(store);
  useEffect(() => {
    latestStoreRef.current = store;
  }, [store]);

  const transact = useCallback(<T,>(
    operation: (
      latest: StoreV2,
    ) => SessionResult<CuratedTransactionValue<T>>,
  ): SessionResult<T> => {
    const result = operation(latestStoreRef.current);
    if (!result.ok) return result;
    latestStoreRef.current = result.value.store;
    setStore(result.value.store);
    return sessionSuccess(result.value.value);
  }, [setStore]);

  return { latestStoreRef, transact };
}
