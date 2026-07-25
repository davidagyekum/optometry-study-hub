import { describe, expect, it } from 'vitest';
import type { Store } from '@/lib/legacy/types';
import {
  createEmptyStoreV2,
  migrateV1ToV2,
} from '@/lib/storage/migrations';
import { storeV2Schema } from '@/lib/storage/schemas';

function populatedV1Store(): Store {
  return {
    version: 1,
    read: { 'aqueous-vitreous': ['flow', 'iop'] },
    active: {
      'aqueous-vitreous': {
        id: 'attempt-1',
        moduleId: 'aqueous-vitreous',
        startedAt: '2026-07-25T10:00:00.000Z',
        order: ['aqueous-vitreous-1'],
        optionOrder: { 'aqueous-vitreous-1': ['answer-a', 'answer-b'] },
        answers: { 'aqueous-vitreous-1': 'answer-a' },
        flags: ['aqueous-vitreous-1'],
        current: 0,
      },
    },
    results: {
      'aqueous-vitreous': [{
        id: 'result-1',
        moduleId: 'aqueous-vitreous',
        startedAt: '2026-07-24T10:00:00.000Z',
        submittedAt: '2026-07-24T10:30:00.000Z',
        order: ['aqueous-vitreous-1'],
        optionOrder: { 'aqueous-vitreous-1': ['answer-a', 'answer-b'] },
        answers: { 'aqueous-vitreous-1': 'answer-a' },
        flags: [],
        current: 0,
        score: 1,
        total: 1,
      }],
    },
  };
}

describe('version-1 to version-2 migration', () => {
  it('creates a valid empty version-2 store', () => {
    const empty = createEmptyStoreV2();
    expect(storeV2Schema.safeParse(empty).success).toBe(true);
    expect(empty).toEqual({
      version: 2,
      read: {},
      active: {},
      results: {},
      assessment: {
        activeAttempts: {},
        results: {},
        questionHistory: {},
      },
    });
  });

  it('preserves every legacy top-level field exactly and initializes assessment state', () => {
    const source = populatedV1Store();
    const snapshot = structuredClone(source);
    const migrated = migrateV1ToV2(source);

    expect(source).toEqual(snapshot);
    expect(migrated.read).toEqual(source.read);
    expect(migrated.active).toEqual(source.active);
    expect(migrated.results).toEqual(source.results);
    expect(migrated.assessment).toEqual({
      activeAttempts: {},
      results: {},
      questionHistory: {},
    });
    expect(storeV2Schema.safeParse(migrated).success).toBe(true);
  });
});
