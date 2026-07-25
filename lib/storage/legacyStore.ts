import type { Store } from '@/lib/legacy/types';

export const STORAGE_KEY = 'opt376-study-state:v1';
export const EMPTY_STORE: Store = { version: 1, read: {}, active: {}, results: {} };

export type LegacyStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): LegacyStorage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

export function loadLegacyStore(storage?: LegacyStorage): Store {
  try {
    const resolvedStorage = storage ?? browserStorage();
    if (!resolvedStorage) return EMPTY_STORE;
    const parsed = JSON.parse(resolvedStorage.getItem(STORAGE_KEY) ?? 'null');
    return parsed?.version === 1 ? parsed : EMPTY_STORE;
  } catch {
    return EMPTY_STORE;
  }
}

export function saveLegacyStore(
  store: Store,
  storage: LegacyStorage | undefined = browserStorage(),
): void {
  storage?.setItem(STORAGE_KEY, JSON.stringify(store));
}
