import type { StoreV2 } from '@/lib/storage/schemas';
import {
  loadStore,
  saveStore,
  type StorageDiagnosticReporter,
  type StorageLike,
} from '@/lib/storage/store';

export type StudyPersistenceCoordinator = {
  hydrate: () => StoreV2;
  markDirty: () => void;
  persistIfDirty: (store: StoreV2) => boolean;
};

export function createStudyPersistenceCoordinator(
  storage?: StorageLike,
  report?: StorageDiagnosticReporter,
): StudyPersistenceCoordinator {
  let dirty = false;

  return {
    hydrate() {
      dirty = false;
      return report ? loadStore(storage, report) : loadStore(storage);
    },
    markDirty() {
      dirty = true;
    },
    persistIfDirty(store) {
      if (!dirty) return false;
      dirty = false;
      return report ? saveStore(store, storage, report) : saveStore(store, storage);
    },
  };
}
