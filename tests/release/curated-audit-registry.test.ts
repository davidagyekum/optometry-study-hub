import { describe, expect, it } from 'vitest';
import {
  analyzeReleaseClosures,
  type ViteManifest,
} from '@/lib/release/bundleAudit';
import {
  curatedReleaseAuditRegistry,
  type CuratedReleaseAuditDefinition,
} from '@/lib/release/curatedAuditRegistry';

const markerProvider = () => ['marker'];
const definitions: CuratedReleaseAuditDefinition[] = [
  {
    experienceId: 'first',
    practiceEntry: 'first-practice.tsx',
    progressEntry: 'first-progress.tsx',
    authoredContentMarkers: markerProvider,
    answerIdentityMarkers: markerProvider,
    practiceUiMarkers: ['practice'],
    progressUiMarkers: ['progress'],
    allowedCrossBankMarkers: () => [],
    excludedCrossBankMarkers: markerProvider,
    enabledInProfile: () => true,
  },
  {
    experienceId: 'second',
    practiceEntry: 'second-practice.tsx',
    progressEntry: 'second-progress.tsx',
    authoredContentMarkers: markerProvider,
    answerIdentityMarkers: markerProvider,
    practiceUiMarkers: ['practice'],
    progressUiMarkers: ['progress'],
    allowedCrossBankMarkers: () => [],
    excludedCrossBankMarkers: markerProvider,
    enabledInProfile: () => false,
  },
];

const manifest: ViteManifest = {
  'browser.tsx': { file: 'browser.js', isEntry: true, imports: ['base.ts'] },
  'app/StudyApp.tsx': { file: 'study.js', imports: ['base.ts'] },
  'base.ts': { file: 'base.js' },
  'shared-curated.ts': { file: 'shared.js' },
  'first-bank.ts': { file: 'first-bank.js' },
  'second-bank.ts': { file: 'second-bank.js' },
  'first-practice.tsx': {
    file: 'first-practice.js',
    isDynamicEntry: true,
    imports: ['shared-curated.ts', 'first-bank.ts'],
  },
  'first-progress.tsx': {
    file: 'first-progress.js',
    isDynamicEntry: true,
    imports: ['shared-curated.ts', 'first-bank.ts'],
  },
  'second-practice.tsx': {
    file: 'second-practice.js',
    isDynamicEntry: true,
    imports: ['shared-curated.ts', 'second-bank.ts'],
  },
  'second-progress.tsx': {
    file: 'second-progress.js',
    isDynamicEntry: true,
    imports: ['shared-curated.ts', 'second-bank.ts'],
  },
};

describe('generic curated release-audit registry', () => {
  it('uses twelve unique, collision-resistant answer markers per real experience', () => {
    for (const definition of curatedReleaseAuditRegistry) {
      const markers = definition.answerIdentityMarkers();
      expect(markers).toHaveLength(12);
      expect(new Set(markers).size).toBe(12);
      expect(markers).not.toContain('anterior-chamber');
      expect(markers.some((marker) => (
        /^(?:option|choice|item|region|label|target|prompt|stem)-/.test(marker)
      ))).toBe(false);
      expect(definition.excludedCrossBankMarkers().some(
        (marker) => markers.includes(marker),
      )).toBe(false);
    }
  });
  it('analyzes two lazy boundaries and counts shared chunks once', () => {
    const closures = analyzeReleaseClosures(manifest, definitions);
    expect(Object.keys(closures.experiences)).toEqual(['first', 'second']);
    expect(closures.experiences.first.combined.has('shared-curated.ts')).toBe(true);
    expect(closures.experiences.second.combined.has('shared-curated.ts')).toBe(true);
    expect([...closures.allCurated].filter((item) => item === 'shared-curated.ts')).toHaveLength(1);
    expect(closures.initial.has('shared-curated.ts')).toBe(false);
  });
});
