import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertReleaseProfile,
  environmentForReleaseProfile,
  parseReleaseFlag,
  parseReleaseProfile,
  releaseFlagsFromEnvironment,
  RELEASE_PROFILES,
} from '@/lib/release/profile';

describe('release profiles', () => {
  it('parses only the two declared profiles', () => {
    expect(parseReleaseProfile('disabled')).toBe('disabled');
    expect(parseReleaseProfile('hvp-public-beta')).toBe('hvp-public-beta');
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
      hvpCuratedPractice: true,
    })).toThrow(/Aqueous/i);
    expect(() => assertReleaseProfile('disabled', {
      assessmentPilot: false,
      hvpCuratedPractice: true,
    })).toThrow(/does not match/i);
  });

  it('builds exact cross-platform environments for both profiles', () => {
    for (const profile of ['disabled', 'hvp-public-beta'] as const) {
      const environment = environmentForReleaseProfile(profile, { NODE_ENV: 'test' });
      expect(releaseFlagsFromEnvironment(environment)).toEqual(RELEASE_PROFILES[profile]);
      expect(environment.OPTOMETRY_RELEASE_PROFILE).toBe(profile);
    }
  });

  it('keeps committed defaults disabled', () => {
    const example = readFileSync('.env.example', 'utf8');
    expect(example).toContain('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false');
    expect(example).toContain('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false');
    expect(example).not.toMatch(/NEXT_PUBLIC_ENABLE_\w+=true/);
  });
});
