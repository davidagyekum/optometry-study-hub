import {
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  analyzeReleaseClosures,
  calculateReleaseMetrics,
  HVP_ANALYTICS_ENTRY,
  HVP_CONTROLLED_ENTRY,
  validateBuildIdentity,
  type ViteManifest,
} from '@/lib/release/bundleAudit';
import {
  readReleaseBuildMetadata,
  releaseOutputDirectory,
} from '@/lib/release/buildIdentity';
import {
  releaseBuildMetadataSchema,
  type ReleaseBuildMetadata,
} from '@/lib/release/types';

const TISSUE_CONTROLLED_ENTRY =
  'lib/assessment/tissue-foundations/definition.tsx';
const TISSUE_ANALYTICS_ENTRY =
  'lib/progress/tissueFoundationsProgressModule.tsx';

const git = {
  commitSha: '1'.repeat(40),
  treeSha: '2'.repeat(40),
  dirty: false,
};

function metadata(
  overrides: Partial<ReleaseBuildMetadata> = {},
): ReleaseBuildMetadata {
  return {
    schemaVersion: 1,
    profile: 'hvp-public-beta',
    flags: { assessmentPilot: false, hvpCuratedPractice: true, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false },
    commitSha: git.commitSha,
    treeSha: git.treeSha,
    dirty: false,
    nodeVersion: 'v24.14.0',
    npmVersion: '11.9.0',
    builtAt: '2026-07-28T12:00:00.000Z',
    buildDurationMs: 100,
    outputFingerprint: 'a'.repeat(64),
    outputDirectory: 'tmp/release/builds/hvp-public-beta',
    ...overrides,
  };
}

function manifest(): ViteManifest {
  return {
    browser: {
      file: 'assets/browser.js',
      isEntry: true,
      imports: ['framework'],
      dynamicImports: ['app/StudyApp.tsx'],
    },
    framework: { file: 'assets/framework.js' },
    'app/StudyApp.tsx': {
      file: 'assets/study.js',
      isDynamicEntry: true,
      imports: ['framework'],
      dynamicImports: [
        HVP_CONTROLLED_ENTRY,
        HVP_ANALYTICS_ENTRY,
        TISSUE_CONTROLLED_ENTRY,
        TISSUE_ANALYTICS_ENTRY,
      ],
    },
    shared: { file: 'assets/shared.js' },
    controlledOnly: { file: 'assets/controlled-only.js' },
    analyticsOnly: { file: 'assets/analytics-only.js' },
    tissueControlledOnly: { file: 'assets/tissue-controlled-only.js' },
    tissueAnalyticsOnly: { file: 'assets/tissue-analytics-only.js' },
    [HVP_CONTROLLED_ENTRY]: {
      file: 'assets/controlled.js',
      isDynamicEntry: true,
      imports: ['shared', 'controlledOnly'],
    },
    [HVP_ANALYTICS_ENTRY]: {
      file: 'assets/analytics.js',
      isDynamicEntry: true,
      imports: ['shared', 'analyticsOnly'],
    },
    [TISSUE_CONTROLLED_ENTRY]: {
      file: 'assets/tissue-controlled.js',
      isDynamicEntry: true,
      imports: ['shared', 'tissueControlledOnly'],
    },
    [TISSUE_ANALYTICS_ENTRY]: {
      file: 'assets/tissue-analytics.js',
      isDynamicEntry: true,
      imports: ['shared', 'tissueAnalyticsOnly'],
    },
  };
}

describe('release build identity', () => {
  const malformedPath = resolve('tmp', 'release', 'test-metadata.json');

  afterEach(() => {
    rmSync(malformedPath, { force: true });
  });

  it('strictly validates complete clean metadata', () => {
    expect(releaseBuildMetadataSchema.parse(metadata())).toEqual(metadata());
    expect(() => releaseBuildMetadataSchema.parse({
      ...metadata(),
      dirty: true,
    })).toThrow();
  });

  it('rejects missing and malformed build metadata', () => {
    expect(() => readReleaseBuildMetadata('hvp-public-beta', malformedPath))
      .toThrow(/missing/i);
    mkdirSync(resolve('tmp', 'release'), { recursive: true });
    writeFileSync(malformedPath, '{not-json', 'utf8');
    expect(() => readReleaseBuildMetadata('hvp-public-beta', malformedPath))
      .toThrow(/malformed/i);
  });

  it.each([
    [
      'wrong requested profile',
      'disabled' as const,
      metadata(),
      git,
      'a'.repeat(64),
      /profile/i,
    ],
    [
      'wrong feature flags',
      'hvp-public-beta' as const,
      metadata({ flags: { assessmentPilot: false, hvpCuratedPractice: false, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false } }),
      git,
      'a'.repeat(64),
      /flags/i,
    ],
    [
      'Aqueous enabled',
      'hvp-public-beta' as const,
      metadata({ flags: { assessmentPilot: true, hvpCuratedPractice: true, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false } }),
      git,
      'a'.repeat(64),
      /Aqueous/i,
    ],
    [
      'stale commit',
      'hvp-public-beta' as const,
      metadata({ commitSha: '3'.repeat(40) }),
      git,
      'a'.repeat(64),
      /commit/i,
    ],
    [
      'wrong tree',
      'hvp-public-beta' as const,
      metadata({ treeSha: '4'.repeat(40) }),
      git,
      'a'.repeat(64),
      /tree/i,
    ],
    [
      'dirty current tree',
      'hvp-public-beta' as const,
      metadata(),
      { ...git, dirty: true },
      'a'.repeat(64),
      /clean Git/i,
    ],
    [
      'wrong fingerprint',
      'hvp-public-beta' as const,
      metadata(),
      git,
      'b'.repeat(64),
      /fingerprint/i,
    ],
    [
      'another build directory',
      'hvp-public-beta' as const,
      metadata({ outputDirectory: 'tmp/release/builds/disabled' }),
      git,
      'a'.repeat(64),
      /belongs to/i,
    ],
  ])(
    'rejects %s',
    (_name, profile, buildMetadata, currentGit, fingerprint, expected) => {
      expect(() => validateBuildIdentity(
        profile,
        releaseOutputDirectory(profile),
        buildMetadata,
        currentGit,
        fingerprint,
      )).toThrow(expected);
    },
  );

  it('rejects disabled and HVP artifacts labelled as each other', () => {
    expect(() => validateBuildIdentity(
      'disabled',
      releaseOutputDirectory('disabled'),
      metadata(),
      git,
      'a'.repeat(64),
    )).toThrow(/profile/i);
    expect(() => validateBuildIdentity(
      'hvp-public-beta',
      releaseOutputDirectory('hvp-public-beta'),
      metadata({
        profile: 'disabled',
        flags: { assessmentPilot: false, hvpCuratedPractice: false, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false },
        outputDirectory: 'tmp/release/builds/disabled',
      }),
      git,
      'a'.repeat(64),
    )).toThrow(/profile/i);
  });
});

describe('release bundle closures', () => {
  const output = resolve('tmp', 'release', 'closure-fixture');

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('requires both lazy HVP entries and keeps them outside initial load', () => {
    const missingControlled = manifest();
    delete missingControlled[HVP_CONTROLLED_ENTRY];
    expect(() => analyzeReleaseClosures(missingControlled))
      .toThrow(/HvpPracticeRouter/);

    const missingAnalytics = manifest();
    delete missingAnalytics[HVP_ANALYTICS_ENTRY];
    expect(() => analyzeReleaseClosures(missingAnalytics))
      .toThrow(/HvpProgressPanel/);

    const notDynamic = manifest();
    notDynamic[HVP_ANALYTICS_ENTRY] = {
      ...notDynamic[HVP_ANALYTICS_ENTRY],
      isDynamicEntry: false,
    };
    expect(() => analyzeReleaseClosures(notDynamic)).toThrow(/not dynamic/i);

    const eagerlyImported = manifest();
    eagerlyImported['app/StudyApp.tsx'] = {
      ...eagerlyImported['app/StudyApp.tsx'],
      imports: ['framework', HVP_CONTROLLED_ENTRY],
    };
    expect(() => analyzeReleaseClosures(eagerlyImported)).toThrow(/initial/i);

    const eagerlyImportedAnalytics = manifest();
    eagerlyImportedAnalytics['app/StudyApp.tsx'] = {
      ...eagerlyImportedAnalytics['app/StudyApp.tsx'],
      imports: ['framework', HVP_ANALYTICS_ENTRY],
    };
    expect(() => analyzeReleaseClosures(eagerlyImportedAnalytics))
      .toThrow(/initial/i);
  });

  it('measures route closures without double-counting shared chunks', () => {
    const input = manifest();
    const sizes: Record<string, number> = {
      'assets/browser.js': 10,
      'assets/framework.js': 5,
      'assets/study.js': 20,
      'assets/shared.js': 7,
      'assets/controlled-only.js': 11,
      'assets/analytics-only.js': 13,
      'assets/controlled.js': 30,
      'assets/analytics.js': 40,
      'assets/tissue-controlled-only.js': 9,
      'assets/tissue-analytics-only.js': 8,
      'assets/tissue-controlled.js': 25,
      'assets/tissue-analytics.js': 31,
    };
    for (const [file, size] of Object.entries(sizes)) {
      const filePath = resolve(output, 'client', file);
      mkdirSync(resolve(filePath, '..'), { recursive: true });
      writeFileSync(filePath, 'x'.repeat(size), 'utf8');
    }
    const closures = analyzeReleaseClosures(input);
    const metrics = calculateReleaseMetrics(output, input, closures, 25);

    expect(metrics.initialHomeJavaScriptBytes).toBe(35);
    expect(metrics.disabledPracticeHubJavaScriptBytes).toBe(35);
    expect(metrics.disabledProgressHubJavaScriptBytes).toBe(35);
    expect(metrics.hvpEnabledPracticeHubJavaScriptBytes).toBe(95);
    expect(metrics.hvpEnabledProgressHubJavaScriptBytes).toBe(95);
    expect(metrics.incrementalControlledHvpJavaScriptBytes).toBe(48);
    expect(metrics.incrementalHvpAnalyticsJavaScriptBytes).toBe(60);
    expect(metrics.combinedIncrementalHvpJavaScriptBytes).toBe(101);
    expect(metrics.combinedIncrementalHvpJavaScriptBytes).toBeLessThan(
      metrics.incrementalControlledHvpJavaScriptBytes
      + metrics.incrementalHvpAnalyticsJavaScriptBytes,
    );
  });
});
