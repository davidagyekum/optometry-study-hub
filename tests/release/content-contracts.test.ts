import { describe, expect, it } from 'vitest';
import {
  aqueousPilotHashes,
  assertReleaseAssertions,
  collectReleaseAssertions,
  EXPECTED_AQUEOUS_PILOT_HASHES,
  EXPECTED_HVP_CHECKSUM,
  hvpChecksum,
  trackedEnabledReleaseEnvironmentFiles,
} from '@/lib/release/assertions';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '@/lib/storage/keys';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('release content and storage contracts', () => {
  it('passes every canonical release assertion', () => {
    const assertions = collectReleaseAssertions();
    expect(assertions).not.toContainEqual(expect.objectContaining({ passed: false }));
    expect(assertReleaseAssertions(assertions)).toEqual(assertions);
  });

  it('preserves HVP and Aqueous semantic identities', () => {
    expect(hvpChecksum()).toBe(EXPECTED_HVP_CHECKSUM);
    expect(aqueousPilotHashes()).toEqual(EXPECTED_AQUEOUS_PILOT_HASHES);
  });

  it('rejects tracked production enablement', () => {
    expect(trackedEnabledReleaseEnvironmentFiles()).toEqual([]);
  });

  it('adds no storage migration or key change', () => {
    expect(STORAGE_KEY).toBe('optometry-study-hub:v2');
    expect(LEGACY_STORAGE_KEY).toBe('opt376-study-state:v1');
    expect(createEmptyStoreV2()).toEqual({
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
});
