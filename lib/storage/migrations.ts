import type { Store } from '@/lib/legacy/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export function createEmptyStoreV2(): StoreV2 {
  return {
    version: 2,
    read: {},
    active: {},
    results: {},
    assessment: {
      activeAttempts: {},
      results: {},
      questionHistory: {},
    },
  };
}

export function migrateV1ToV2(v1: Store): StoreV2 {
  return {
    version: 2,
    read: v1.read,
    active: v1.active,
    results: v1.results,
    assessment: {
      activeAttempts: {},
      results: {},
      questionHistory: {},
    },
  };
}
