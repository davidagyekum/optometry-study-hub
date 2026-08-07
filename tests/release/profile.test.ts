import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertPublishableReleaseProfile,
  assertReleaseProfile,
  environmentForReleaseProfile,
  isPublishableReleaseProfile,
  parseReleaseFlag,
  parseReleaseProfile,
  releaseFlagsFromEnvironment,
  RELEASE_PROFILES,
} from '@/lib/release/profile';

const OPT370_DISABLED = {
  opt370SchematicEyeRefractiveStates: false,
  opt370MultifocalFoundations: false,
  opt370ProgressiveAdditionLenses: false,
  opt370PdAndDispensing: false,
  opt370SpecialLenses: false,
} as const;

describe('release profiles', () => {
  it('parses only the eleven declared profiles', () => {
    expect(parseReleaseProfile('disabled')).toBe('disabled');
    expect(parseReleaseProfile('hvp-public-beta')).toBe('hvp-public-beta');
    expect(parseReleaseProfile('tissue-foundations-preview'))
      .toBe('tissue-foundations-preview');
    expect(parseReleaseProfile('hvp-tissue-preview')).toBe('hvp-tissue-preview');
    expect(parseReleaseProfile('neuro-anatomy-preview'))
      .toBe('neuro-anatomy-preview');
    expect(parseReleaseProfile('environmental-vision-preview'))
      .toBe('environmental-vision-preview');
    expect(parseReleaseProfile('autonomic-pharmacology-preview'))
      .toBe('autonomic-pharmacology-preview');
    expect(parseReleaseProfile('systemic-pathology-preview'))
      .toBe('systemic-pathology-preview');
    expect(parseReleaseProfile('full-curated-preview'))
      .toBe('full-curated-preview');
    expect(parseReleaseProfile('full-curated-public-beta'))
      .toBe('full-curated-public-beta');
    expect(parseReleaseProfile('all-course-content-public'))
      .toBe('all-course-content-public');
    expect(() => parseReleaseProfile('production')).toThrow(/unknown release profile/i);
  });

  it('accepts only exact boolean flag strings', () => {
    expect(parseReleaseFlag('FLAG', 'true')).toBe(true);
    expect(parseReleaseFlag('FLAG', 'false')).toBe(false);
    for (const value of [undefined, '', 'TRUE', '1', 'yes']) {
      expect(() => parseReleaseFlag('FLAG', value)).toThrow(/exact string/i);
    }
  });

  it('rejects Aqueous exposure and mismatched profile flags', () => {
    expect(() => assertReleaseProfile('hvp-public-beta', {
      ...OPT370_DISABLED,
      assessmentPilot: true,
      hvpCuratedPractice: true, hvpDepthColourExpansion: false, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false, environmentalVisionCuratedPractice: false, autonomicPharmacologyCuratedPractice: false, systemicPathologyCuratedPractice: false,
    })).toThrow(/Aqueous/i);
    expect(() => assertReleaseProfile('disabled', {
      ...OPT370_DISABLED,
      assessmentPilot: false,
      hvpCuratedPractice: true, hvpDepthColourExpansion: false, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false, environmentalVisionCuratedPractice: false, autonomicPharmacologyCuratedPractice: false, systemicPathologyCuratedPractice: false,
    })).toThrow(/does not match/i);
    expect(() => assertReleaseProfile('disabled', {
      ...RELEASE_PROFILES.disabled,
      hvpDepthColourExpansion: true,
    })).toThrow(/does not match/i);
  });

  it('builds exact cross-platform environments for every profile', () => {
    for (const profile of [
      'disabled',
      'hvp-public-beta',
      'tissue-foundations-preview',
      'hvp-tissue-preview',
      'neuro-anatomy-preview',
      'environmental-vision-preview',
      'autonomic-pharmacology-preview',
      'systemic-pathology-preview',
      'full-curated-preview',
      'full-curated-public-beta',
      'all-course-content-public',
    ] as const) {
      const environment = environmentForReleaseProfile(profile, { NODE_ENV: 'test' });
      expect(releaseFlagsFromEnvironment(environment)).toEqual(RELEASE_PROFILES[profile]);
      const allContent = profile === 'all-course-content-public';
      expect(RELEASE_PROFILES[profile].hvpDepthColourExpansion).toBe(allContent);
      expect(RELEASE_PROFILES[profile].opt370SchematicEyeRefractiveStates).toBe(allContent);
      expect(RELEASE_PROFILES[profile].opt370MultifocalFoundations).toBe(allContent);
      expect(RELEASE_PROFILES[profile].opt370ProgressiveAdditionLenses).toBe(allContent);
      expect(RELEASE_PROFILES[profile].opt370PdAndDispensing).toBe(allContent);
      expect(RELEASE_PROFILES[profile].opt370SpecialLenses).toBe(allContent);
      expect(environment.OPTOMETRY_RELEASE_PROFILE).toBe(profile);
    }
  });

  it('preserves every historical profile flag matrix exactly', () => {
    const expectedEnabledFlags = {
      disabled: [],
      'hvp-public-beta': ['hvpCuratedPractice'],
      'tissue-foundations-preview': ['tissueFoundationsCuratedPractice'],
      'hvp-tissue-preview': ['hvpCuratedPractice', 'tissueFoundationsCuratedPractice'],
      'neuro-anatomy-preview': [
        'tissueFoundationsCuratedPractice',
        'ocularAdnexaCuratedPractice',
        'aqueousVitreousCuratedPractice',
        'bloodSupplyCuratedPractice',
      ],
      'environmental-vision-preview': ['environmentalVisionCuratedPractice'],
      'autonomic-pharmacology-preview': ['autonomicPharmacologyCuratedPractice'],
      'systemic-pathology-preview': ['systemicPathologyCuratedPractice'],
      'full-curated-preview': [
        'hvpCuratedPractice',
        'tissueFoundationsCuratedPractice',
        'ocularAdnexaCuratedPractice',
        'aqueousVitreousCuratedPractice',
        'bloodSupplyCuratedPractice',
        'environmentalVisionCuratedPractice',
        'autonomicPharmacologyCuratedPractice',
        'systemicPathologyCuratedPractice',
      ],
      'full-curated-public-beta': [
        'hvpCuratedPractice',
        'tissueFoundationsCuratedPractice',
        'ocularAdnexaCuratedPractice',
        'aqueousVitreousCuratedPractice',
        'bloodSupplyCuratedPractice',
        'environmentalVisionCuratedPractice',
        'autonomicPharmacologyCuratedPractice',
        'systemicPathologyCuratedPractice',
      ],
    } as const;

    for (const [profile, expected] of Object.entries(expectedEnabledFlags)) {
      const enabled = Object.entries(
        RELEASE_PROFILES[profile as keyof typeof expectedEnabledFlags],
      ).filter(([, value]) => value).map(([key]) => key);
      expect(enabled).toEqual(expected);
    }
  });

  it('marks the Neuro Anatomy profile as preview-only', () => {
    expect(isPublishableReleaseProfile('hvp-public-beta')).toBe(true);
    expect(isPublishableReleaseProfile('full-curated-public-beta')).toBe(true);
    expect(isPublishableReleaseProfile('all-course-content-public')).toBe(true);
    expect(isPublishableReleaseProfile('neuro-anatomy-preview')).toBe(false);
    expect(isPublishableReleaseProfile('environmental-vision-preview')).toBe(false);
    expect(isPublishableReleaseProfile('autonomic-pharmacology-preview')).toBe(false);
    expect(isPublishableReleaseProfile('systemic-pathology-preview')).toBe(false);
    expect(isPublishableReleaseProfile('full-curated-preview')).toBe(false);
    expect(assertPublishableReleaseProfile('hvp-public-beta'))
      .toBe('hvp-public-beta');
    expect(assertPublishableReleaseProfile('full-curated-public-beta'))
      .toBe('full-curated-public-beta');
    expect(assertPublishableReleaseProfile('all-course-content-public'))
      .toBe('all-course-content-public');
    expect(() => assertPublishableReleaseProfile('neuro-anatomy-preview'))
      .toThrow(/preview-only/i);
  });

  it('keeps committed defaults disabled', () => {
    const example = readFileSync('.env.example', 'utf8');
    expect(example).toContain('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false');
    expect(example).toContain('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false');
    expect(example).toContain('NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION=false');
    expect(example).toContain(
      'NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE=false',
    );
    expect(example).toContain(
      'NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE=false',
    );
    expect(example).toContain(
      'NEXT_PUBLIC_ENABLE_AQUEOUS_VITREOUS_CURATED_PRACTICE=false',
    );
    expect(example).toContain(
      'NEXT_PUBLIC_ENABLE_BLOOD_SUPPLY_CURATED_PRACTICE=false',
    );
    expect(example).toContain(
      'NEXT_PUBLIC_ENABLE_ENVIRONMENTAL_VISION_CURATED_PRACTICE=false',
    );
    expect(example).toContain(
      'NEXT_PUBLIC_ENABLE_AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE=false',
    );
    expect(example).toContain(
      'NEXT_PUBLIC_ENABLE_SYSTEMIC_PATHOLOGY_CURATED_PRACTICE=false',
    );
    expect(example).not.toMatch(/NEXT_PUBLIC_ENABLE_\w+=true/);
  });
});
