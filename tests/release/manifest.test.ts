import { describe, expect, it } from 'vitest';
import { RELEASE_BASELINES, RELEASE_BUDGETS } from '@/lib/release/budgets';
import type { BundleAuditResult } from '@/lib/release/bundleAudit';
import {
  assertCleanReleaseTree,
  assertManifestHasNoSensitivePaths,
  createReleaseManifest,
  releaseManifestIdentity,
  renderReleaseReport,
} from '@/lib/release/manifest';
import { releaseManifestSchema } from '@/lib/release/types';

function audit(): BundleAuditResult {
  return {
    profile: 'hvp-public-beta',
    outputDirectory: 'tmp/release/builds/hvp-public-beta',
    fingerprint: 'a'.repeat(64),
    metrics: RELEASE_BASELINES['hvp-public-beta'],
    budget: RELEASE_BUDGETS['hvp-public-beta'],
    initialFiles: ['assets/index.js'],
    hvpLazyFiles: ['assets/hvp.js'],
    assertions: [{ id: 'test-audit', passed: true, detail: 'Fixture passed.' }],
  };
}

const git = {
  commitSha: '1'.repeat(40),
  treeSha: '2'.repeat(40),
  dirty: false,
};

describe('release manifest', () => {
  it('validates the complete HVP public-beta manifest', () => {
    const manifest = createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: audit(),
      git,
      builtAt: '2026-07-28T12:00:00.000Z',
      nodeVersion: 'v24.14.0',
      npmVersion: '11.9.0',
    });
    expect(releaseManifestSchema.parse(manifest)).toEqual(manifest);
    expect(manifest.flags).toEqual({
      assessmentPilot: false,
      hvpCuratedPractice: true,
    });
    expect(manifest.hosting).toMatchObject({ d1: null, r2: null });
    expect(manifest.content.academicStatus).toMatch(/not lecturer-approved/i);
    expect(() => assertManifestHasNoSensitivePaths(manifest)).not.toThrow();
    expect(renderReleaseReport(manifest)).toContain('Aqueous pilot: disabled');
  });

  it('keeps deterministic identity stable across timestamps and runtimes', () => {
    const first = createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: audit(),
      git,
      builtAt: '2026-07-28T12:00:00.000Z',
      nodeVersion: 'v24.14.0',
      npmVersion: '11.9.0',
    });
    const second = createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: {
        ...audit(),
        metrics: { ...audit().metrics, buildDurationMs: 9999 },
      },
      git,
      builtAt: '2026-07-29T12:00:00.000Z',
      nodeVersion: 'v22.13.0',
      npmVersion: '10.0.0',
    });
    expect(releaseManifestIdentity(first)).toBe(releaseManifestIdentity(second));
  });

  it('rejects dirty final release trees', () => {
    expect(() => assertCleanReleaseTree({ ...git, dirty: true })).toThrow(/clean Git/i);
    expect(() => createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: audit(),
      git: { ...git, dirty: true },
    })).toThrow(/clean Git/i);
  });
});
