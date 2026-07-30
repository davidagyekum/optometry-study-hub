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

describe('release profiles', () => {
  it('parses only the five declared profiles', () => {
    expect(parseReleaseProfile('disabled')).toBe('disabled');
    expect(parseReleaseProfile('hvp-public-beta')).toBe('hvp-public-beta');
    expect(parseReleaseProfile('tissue-foundations-preview'))
      .toBe('tissue-foundations-preview');
    expect(parseReleaseProfile('hvp-tissue-preview')).toBe('hvp-tissue-preview');
    expect(parseReleaseProfile('neuro-anatomy-preview'))
      .toBe('neuro-anatomy-preview');
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
      assessmentPilot: true,
      hvpCuratedPractice: true, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false,
    })).toThrow(/Aqueous/i);
    expect(() => assertReleaseProfile('disabled', {
      assessmentPilot: false,
      hvpCuratedPractice: true, tissueFoundationsCuratedPractice: false, ocularAdnexaCuratedPractice: false, aqueousVitreousCuratedPractice: false, bloodSupplyCuratedPractice: false,
    })).toThrow(/does not match/i);
  });

  it('builds exact cross-platform environments for every profile', () => {
    for (const profile of [
      'disabled',
      'hvp-public-beta',
      'tissue-foundations-preview',
      'hvp-tissue-preview',
      'neuro-anatomy-preview',
    ] as const) {
      const environment = environmentForReleaseProfile(profile, { NODE_ENV: 'test' });
      expect(releaseFlagsFromEnvironment(environment)).toEqual(RELEASE_PROFILES[profile]);
      expect(environment.OPTOMETRY_RELEASE_PROFILE).toBe(profile);
    }
  });

  it('marks the Neuro Anatomy profile as preview-only', () => {
    expect(isPublishableReleaseProfile('hvp-public-beta')).toBe(true);
    expect(isPublishableReleaseProfile('neuro-anatomy-preview')).toBe(false);
    expect(assertPublishableReleaseProfile('hvp-public-beta'))
      .toBe('hvp-public-beta');
    expect(() => assertPublishableReleaseProfile('neuro-anatomy-preview'))
      .toThrow(/preview-only/i);
  });

  it('keeps committed defaults disabled', () => {
    const example = readFileSync('.env.example', 'utf8');
    expect(example).toContain('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false');
    expect(example).toContain('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false');
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
    expect(example).not.toMatch(/NEXT_PUBLIC_ENABLE_\w+=true/);
  });
});
