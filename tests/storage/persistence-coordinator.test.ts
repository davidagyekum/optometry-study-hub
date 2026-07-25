import { describe, expect, it } from 'vitest';
import type { Store } from '@/lib/legacy/types';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '@/lib/storage/keys';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { createStudyPersistenceCoordinator } from '@/lib/storage/persistenceCoordinator';
import type { StorageLike } from '@/lib/storage/store';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const writes: Array<{ key: string; value: string }> = [];
  const storage: StorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      writes.push({ key, value });
      values.set(key, value);
    },
  };
  return { storage, values, writes };
}

function validV1(): Store {
  return {
    version: 1,
    read: { 'aqueous-vitreous': ['flow'] },
    active: {},
    results: {},
  };
}

describe('study persistence coordinator', () => {
  it.each([
    [LEGACY_STORAGE_KEY, '{malformed v1'],
    [STORAGE_KEY, '{malformed v2'],
  ])('does not rewrite malformed data during hydration at %s', (key, raw) => {
    const { storage, values, writes } = memoryStorage({ [key]: raw });
    const coordinator = createStudyPersistenceCoordinator(storage);

    const hydrated = coordinator.hydrate();
    expect(coordinator.persistIfDirty(hydrated)).toBe(false);
    expect(values.get(key)).toBe(raw);
    expect(writes).toEqual([]);
  });

  it('migrates valid V1 during hydration while retaining the original V1 bytes', () => {
    const rawV1 = JSON.stringify(validV1());
    const { storage, values, writes } = memoryStorage({ [LEGACY_STORAGE_KEY]: rawV1 });
    const coordinator = createStudyPersistenceCoordinator(storage);

    const hydrated = coordinator.hydrate();
    expect(coordinator.persistIfDirty(hydrated)).toBe(false);
    expect(values.get(LEGACY_STORAGE_KEY)).toBe(rawV1);
    expect(JSON.parse(values.get(STORAGE_KEY) ?? 'null')).toEqual(hydrated);
    expect(writes.map((write) => write.key)).toEqual([STORAGE_KEY]);
  });

  it('loads valid V2 without an unnecessary initial rewrite', () => {
    const stored = {
      ...createEmptyStoreV2(),
      read: { 'aqueous-vitreous': ['iop'] },
    };
    const rawV2 = JSON.stringify(stored);
    const { storage, values, writes } = memoryStorage({ [STORAGE_KEY]: rawV2 });
    const coordinator = createStudyPersistenceCoordinator(storage);

    const hydrated = coordinator.hydrate();
    expect(coordinator.persistIfDirty(hydrated)).toBe(false);
    expect(values.get(STORAGE_KEY)).toBe(rawV2);
    expect(writes).toEqual([]);
  });

  it('persists learner-originated updates after hydration', () => {
    const { storage, values, writes } = memoryStorage();
    const coordinator = createStudyPersistenceCoordinator(storage);
    const hydrated = coordinator.hydrate();
    const updated = {
      ...hydrated,
      read: { 'aqueous-vitreous': ['flow'] },
    };

    coordinator.markDirty();
    expect(coordinator.persistIfDirty(updated)).toBe(true);
    expect(JSON.parse(values.get(STORAGE_KEY) ?? 'null')).toEqual(updated);
    expect(writes.map((write) => write.key)).toEqual([STORAGE_KEY]);
  });

  it('does not crash when storage is unavailable', () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const coordinator = createStudyPersistenceCoordinator(storage);

    expect(() => coordinator.hydrate()).not.toThrow();
    coordinator.markDirty();
    expect(() => coordinator.persistIfDirty(createEmptyStoreV2())).not.toThrow();
    expect(coordinator.persistIfDirty(createEmptyStoreV2())).toBe(false);
  });
});
