import {
  createEmptyStoreV2,
  migrateV1ToV2,
} from '@/lib/storage/migrations';
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
} from '@/lib/storage/keys';
import {
  legacyStoreV1Schema,
  storeV2Schema,
  type StoreV2,
} from '@/lib/storage/schemas';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export type StorageDiagnostic = {
  code:
    | 'STORAGE_UNAVAILABLE'
    | 'MALFORMED_V1'
    | 'MALFORMED_V2'
    | 'V2_SAVE_FAILED'
    | 'INVALID_V2_SAVE';
  message: string;
};

export type StorageDiagnosticReporter = (diagnostic: StorageDiagnostic) => void;

function browserStorage(): StorageLike | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function developmentReporter(diagnostic: StorageDiagnostic): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${diagnostic.code}] ${diagnostic.message}`);
  }
}

function parseJson(raw: string): unknown {
  return JSON.parse(raw);
}

export function loadStore(
  storage?: StorageLike,
  report: StorageDiagnosticReporter = developmentReporter,
): StoreV2 {
  try {
    const resolvedStorage = storage ?? browserStorage();
    if (!resolvedStorage) return createEmptyStoreV2();

    const rawV2 = resolvedStorage.getItem(STORAGE_KEY);
    if (rawV2 !== null) {
      try {
        const parsedV2 = storeV2Schema.safeParse(parseJson(rawV2));
        if (parsedV2.success) return parsedV2.data;
      } catch {
        // The diagnostic below deliberately preserves the original stored value.
      }
      report({
        code: 'MALFORMED_V2',
        message: 'Version-2 study data is invalid and was left untouched.',
      });
      return createEmptyStoreV2();
    }

    const rawV1 = resolvedStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1 === null) return createEmptyStoreV2();

    try {
      const parsedV1 = legacyStoreV1Schema.safeParse(parseJson(rawV1));
      if (!parsedV1.success) {
        report({
          code: 'MALFORMED_V1',
          message: 'Version-1 study data is invalid and was left untouched.',
        });
        return createEmptyStoreV2();
      }

      const migrated = migrateV1ToV2(parsedV1.data);
      try {
        resolvedStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } catch {
        report({
          code: 'V2_SAVE_FAILED',
          message: 'Migration succeeded in memory but could not be saved.',
        });
      }
      return migrated;
    } catch {
      report({
        code: 'MALFORMED_V1',
        message: 'Version-1 study data is invalid and was left untouched.',
      });
      return createEmptyStoreV2();
    }
  } catch {
    report({
      code: 'STORAGE_UNAVAILABLE',
      message: 'Browser storage is unavailable; an in-memory empty store is being used.',
    });
    return createEmptyStoreV2();
  }
}

export function saveStore(
  store: StoreV2,
  storage?: StorageLike,
  report: StorageDiagnosticReporter = developmentReporter,
): boolean {
  const parsed = storeV2Schema.safeParse(store);
  if (!parsed.success) {
    report({
      code: 'INVALID_V2_SAVE',
      message: 'Invalid version-2 data was not written.',
    });
    return false;
  }

  try {
    const resolvedStorage = storage ?? browserStorage();
    if (!resolvedStorage) return false;
    resolvedStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
    return true;
  } catch {
    report({
      code: 'STORAGE_UNAVAILABLE',
      message: 'Browser storage is unavailable; study data could not be saved.',
    });
    return false;
  }
}
