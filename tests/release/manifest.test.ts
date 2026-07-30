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
import type { ReleaseBuildMetadata } from '@/lib/release/types';
import { releaseManifestSchema } from '@/lib/release/types';

const git = {
  commitSha: '1'.repeat(40),
  treeSha: '2'.repeat(40),
  dirty: false,
};

function identity(
  overrides: Partial<ReleaseBuildMetadata> = {},
): ReleaseBuildMetadata {
  return {
    schemaVersion: 1,
    profile: 'hvp-public-beta',
    flags: { assessmentPilot: false, hvpCuratedPractice: true, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false, environmentalVisionCuratedPractice: false },
    commitSha: git.commitSha,
    treeSha: git.treeSha,
    dirty: false,
    nodeVersion: 'v24.14.0',
    npmVersion: '11.9.0',
    builtAt: '2026-07-28T12:00:00.000Z',
    buildDurationMs: 5_940,
    outputFingerprint: 'a'.repeat(64),
    outputDirectory: 'tmp/release/builds/hvp-public-beta',
    ...overrides,
  };
}

function audit(
  identityOverrides: Partial<ReleaseBuildMetadata> = {},
  auditOverrides: Partial<BundleAuditResult> = {},
): BundleAuditResult {
  const buildIdentity = identity(identityOverrides);
  return {
    profile: 'hvp-public-beta',
    outputDirectory: 'tmp/release/builds/hvp-public-beta',
    fingerprint: buildIdentity.outputFingerprint,
    buildIdentity,
    metrics: {
      ...RELEASE_BASELINES['hvp-public-beta'],
      buildDurationMs: buildIdentity.buildDurationMs,
    },
    budget: RELEASE_BUDGETS['hvp-public-beta'],
    initialFiles: ['assets/index.js'],
    controlledHvpFiles: ['assets/hvp-practice.js'],
    hvpAnalyticsFiles: ['assets/hvp-analytics.js'],
    combinedHvpFiles: ['assets/hvp-practice.js', 'assets/hvp-analytics.js'],
    assertions: [{ id: 'test-audit', passed: true, detail: 'Fixture passed.' }],
    ...auditOverrides,
  };
}

describe('release manifest', () => {
  it('validates a source-bound HVP public-beta manifest', () => {
    const manifest = createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: audit(),
      git,
    });
    expect(releaseManifestSchema.parse(manifest)).toEqual(manifest);
    expect(manifest.flags).toEqual({
      assessmentPilot: false,
      hvpCuratedPractice: true, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false, environmentalVisionCuratedPractice: false,
    });
    expect(manifest.build.identity.commitSha).toBe(git.commitSha);
    expect(manifest.build.identity.treeSha).toBe(git.treeSha);
    expect(manifest.build.identity.outputFingerprint).toBe(
      manifest.build.outputFingerprint,
    );
    expect(manifest.hosting).toMatchObject({ d1: null, r2: null });
    expect(manifest.content.academicStatus).toMatch(/not lecturer-approved/i);
    expect(() => assertManifestHasNoSensitivePaths(manifest)).not.toThrow();
    const report = renderReleaseReport(manifest);
    expect(report).toContain('Aqueous pilot: disabled');
    expect(report).toContain('exact output fingerprint');
  });

  it('keeps deterministic identity stable across timestamps and runtimes', () => {
    const first = createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: audit(),
      git,
    });
    const secondIdentity = identity({
      builtAt: '2026-07-29T12:00:00.000Z',
      nodeVersion: 'v22.13.0',
      npmVersion: '10.0.0',
      buildDurationMs: 9_999,
    });
    const second = createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: audit(secondIdentity, {
        buildIdentity: secondIdentity,
        metrics: {
          ...RELEASE_BASELINES['hvp-public-beta'],
          buildDurationMs: 9_999,
        },
      }),
      git,
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

  it.each([
    ['audit profile', audit({}, { profile: 'disabled' }), /audit/i],
    [
      'build profile',
      audit({
        profile: 'disabled',
        flags: { assessmentPilot: false, hvpCuratedPractice: false, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false, environmentalVisionCuratedPractice: false },
        outputDirectory: 'tmp/release/builds/disabled',
      }),
      /build identity/i,
    ],
    [
      'feature flags',
      audit({ flags: { assessmentPilot: false, hvpCuratedPractice: false, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false, environmentalVisionCuratedPractice: false } }),
      /flags/i,
    ],
    ['build commit', audit({ commitSha: '3'.repeat(40) }), /Git identity/i],
    ['build tree', audit({ treeSha: '4'.repeat(40) }), /Git identity/i],
    [
      'fingerprint',
      audit({}, { fingerprint: 'b'.repeat(64) }),
      /fingerprint/i,
    ],
  ])('rejects a mismatched %s', (_name, suppliedAudit, expected) => {
    expect(() => createReleaseManifest({
      profile: 'hvp-public-beta',
      audit: suppliedAudit,
      git,
    })).toThrow(expected);
  });
});
