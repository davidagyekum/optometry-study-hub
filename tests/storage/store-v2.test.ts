import { describe, expect, it } from 'vitest';
import type { Store } from '@/lib/legacy/types';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '@/lib/storage/keys';
import { loadLegacyStore } from '@/lib/storage/legacyStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  loadStore,
  resetAllStudyData,
  saveStore,
  type StorageDiagnostic,
  type StorageLike,
} from '@/lib/storage/store';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage: StorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  return { storage, values };
}

function validV1(): Store {
  return {
    version: 1,
    read: { 'aqueous-vitreous': ['flow'] },
    active: {},
    results: {},
  };
}

describe('version-2 storage wrapper', () => {
  it('returns an empty store when no data exists', () => {
    expect(loadStore(memoryStorage().storage)).toEqual(createEmptyStoreV2());
  });

  it('loads valid V2 data before considering V1', () => {
    const v2 = {
      ...createEmptyStoreV2(),
      read: { 'blood-supply': ['retinal'] },
    };
    const { storage } = memoryStorage({
      [STORAGE_KEY]: JSON.stringify(v2),
      [LEGACY_STORAGE_KEY]: JSON.stringify(validV1()),
    });
    expect(loadStore(storage)).toEqual(v2);
  });

  it('migrates valid V1, saves V2, and retains the old key', () => {
    const v1 = validV1();
    const rawV1 = JSON.stringify(v1);
    const { storage, values } = memoryStorage({ [LEGACY_STORAGE_KEY]: rawV1 });
    const migrated = loadStore(storage);

    expect(migrated.version).toBe(2);
    expect(migrated.read).toEqual(v1.read);
    expect(migrated.active).toEqual(v1.active);
    expect(migrated.results).toEqual(v1.results);
    expect(migrated.assessment).toEqual({
      activeAttempts: {},
      results: {},
      questionHistory: {},
    });
    expect(values.get(LEGACY_STORAGE_KEY)).toBe(rawV1);
    expect(JSON.parse(values.get(STORAGE_KEY) ?? 'null')).toEqual(migrated);
  });

  it('preserves malformed V1 and reports a diagnostic without throwing', () => {
    const diagnostics: StorageDiagnostic[] = [];
    const raw = '{bad json';
    const { storage, values } = memoryStorage({ [LEGACY_STORAGE_KEY]: raw });

    expect(() => loadStore(storage, (item) => diagnostics.push(item))).not.toThrow();
    expect(loadStore(storage, (item) => diagnostics.push(item))).toEqual(createEmptyStoreV2());
    expect(values.get(LEGACY_STORAGE_KEY)).toBe(raw);
    expect(values.has(STORAGE_KEY)).toBe(false);
    expect(diagnostics.some((item) => item.code === 'MALFORMED_V1')).toBe(true);
  });

  it('preserves malformed or wrong-version V2 without overwriting it from V1', () => {
    for (const rawV2 of ['{bad json', JSON.stringify({ version: 3 })]) {
      const diagnostics: StorageDiagnostic[] = [];
      const { storage, values } = memoryStorage({
        [STORAGE_KEY]: rawV2,
        [LEGACY_STORAGE_KEY]: JSON.stringify(validV1()),
      });

      expect(loadStore(storage, (item) => diagnostics.push(item))).toEqual(createEmptyStoreV2());
      expect(values.get(STORAGE_KEY)).toBe(rawV2);
      expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'MALFORMED_V2' }));
    }
  });

  it('keeps a successful in-memory migration when the V2 write throws', () => {
    const diagnostics: StorageDiagnostic[] = [];
    const v1 = validV1();
    const storage: StorageLike = {
      getItem: (key) => key === LEGACY_STORAGE_KEY ? JSON.stringify(v1) : null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    const migrated = loadStore(storage, (item) => diagnostics.push(item));
    expect(migrated.read).toEqual(v1.read);
    expect(migrated.active).toEqual(v1.active);
    expect(migrated.results).toEqual(v1.results);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'V2_SAVE_FAILED' }));
  });

  it('round-trips a valid V2 store', () => {
    const { storage } = memoryStorage();
    const store = {
      ...createEmptyStoreV2(),
      read: { 'ocular-adnexa': ['tears'] },
    };
    expect(saveStore(store, storage)).toBe(true);
    expect(loadStore(storage)).toEqual(store);
  });

  it('does not crash when getItem or setItem throws', () => {
    const diagnostics: StorageDiagnostic[] = [];
    const throwingStorage: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(loadStore(throwingStorage, (item) => diagnostics.push(item))).toEqual(createEmptyStoreV2());
    expect(saveStore(createEmptyStoreV2(), throwingStorage, (item) => diagnostics.push(item))).toBe(false);
    expect(diagnostics.some((item) => item.code === 'STORAGE_UNAVAILABLE')).toBe(true);
  });

  it('handles a throwing window.localStorage property getter', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const fakeWindow = {};
    Object.defineProperty(fakeWindow, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      },
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: fakeWindow,
    });

    try {
      expect(loadStore()).toEqual(createEmptyStoreV2());
      expect(saveStore(createEmptyStoreV2())).toBe(false);
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, 'window', originalWindow);
      } else {
        Reflect.deleteProperty(globalThis, 'window');
      }
    }
  });

  it('resets both current and legacy storage generations to valid empty stores', () => {
    const { storage, values } = memoryStorage({
      [LEGACY_STORAGE_KEY]: JSON.stringify(validV1()),
      [STORAGE_KEY]: JSON.stringify({
        ...createEmptyStoreV2(),
        read: { 'aqueous-vitreous': ['flow'] },
      }),
    });

    expect(resetAllStudyData(storage)).toBe(true);
    expect(loadStore(storage)).toEqual(createEmptyStoreV2());
    expect(loadLegacyStore(storage)).toEqual({
      version: 1,
      read: {},
      active: {},
      results: {},
    });
    expect(JSON.parse(values.get(LEGACY_STORAGE_KEY) ?? 'null')).toEqual({
      version: 1,
      read: {},
      active: {},
      results: {},
    });
  });

  it('does not crash when resetting either storage generation fails', () => {
    const diagnostics: StorageDiagnostic[] = [];
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(() => resetAllStudyData(storage, (item) => diagnostics.push(item))).not.toThrow();
    expect(resetAllStudyData(storage, (item) => diagnostics.push(item))).toBe(false);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'RESET_FAILED' }));
  });
});
