import { describe, expect, it } from 'vitest';
import type { Store } from '@/lib/legacy/types';
import {
  EMPTY_STORE,
  loadLegacyStore,
  saveLegacyStore,
  STORAGE_KEY,
  type LegacyStorage,
} from '@/lib/storage/legacyStore';

function memoryStorage(initial?: string): LegacyStorage {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(STORAGE_KEY, initial);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('legacy version-1 storage', () => {
  it('keeps the existing storage key', () => {
    expect(STORAGE_KEY).toBe('opt376-study-state:v1');
  });

  it('falls back for empty, malformed, and wrong-version values', () => {
    expect(loadLegacyStore(memoryStorage())).toBe(EMPTY_STORE);
    expect(loadLegacyStore(memoryStorage('{bad json'))).toBe(EMPTY_STORE);
    expect(loadLegacyStore(memoryStorage(JSON.stringify({ version: 2 })))).toBe(EMPTY_STORE);
  });

  it('loads valid version-1 data without schema migration', () => {
    const store: Store = {
      version: 1,
      read: { 'ocular-adnexa': ['landmarks'] },
      active: {},
      results: {},
    };
    expect(loadLegacyStore(memoryStorage(JSON.stringify(store)))).toEqual(store);
  });

  it('round-trips version-1 data', () => {
    const storage = memoryStorage();
    const store: Store = {
      version: 1,
      read: { 'blood-supply': ['retinal'] },
      active: {},
      results: {},
    };
    saveLegacyStore(store, storage);
    expect(loadLegacyStore(storage)).toEqual(store);
  });
});
