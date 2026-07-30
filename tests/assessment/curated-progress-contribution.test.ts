import { describe, expect, it } from 'vitest';
import {
  validateCuratedProgressContribution,
} from '@/lib/assessment/curated/progressContribution';
import type { CuratedProgressContribution } from '@/lib/assessment/curated/types';
import {
  makeDummyCuratedExperience,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

function validContribution(): CuratedProgressContribution {
  return {
    experienceId: 'dummy-curated',
    moduleId: 'dummy-module',
    recommendationCandidates: [],
    activity: [],
    hasStoredData: false,
    integrityOmissionCount: 0,
  };
}

describe('curated progress contribution validation', () => {
  it('accepts a structurally valid contribution owned by its adapter', () => {
    const adapter = makeDummyCuratedExperience();
    const contribution = validContribution();
    expect(validateCuratedProgressContribution(adapter, contribution))
      .toEqual(contribution);
  });

  it.each([
    ['experienceId', { ...validContribution(), experienceId: 'wrong-experience' }],
    ['moduleId', { ...validContribution(), moduleId: 'wrong-module' }],
  ])('rejects a contribution with the wrong %s', (_field, contribution) => {
    expect(() => validateCuratedProgressContribution(
      makeDummyCuratedExperience(),
      contribution,
    )).toThrow('CURATED_PROGRESS_CONTRIBUTION_OWNERSHIP_MISMATCH');
  });

  it.each([
    ['null contribution', null],
    ['recommendation array', {
      ...validContribution(),
      recommendationCandidates: null,
    }],
    ['activity array', {
      ...validContribution(),
      activity: {},
    }],
    ['stored-data flag', {
      ...validContribution(),
      hasStoredData: 'yes',
    }],
    ['negative omission count', {
      ...validContribution(),
      integrityOmissionCount: -1,
    }],
    ['fractional omission count', {
      ...validContribution(),
      integrityOmissionCount: 0.5,
    }],
    ['infinite omission count', {
      ...validContribution(),
      integrityOmissionCount: Number.POSITIVE_INFINITY,
    }],
  ])('rejects malformed %s', (_case, contribution) => {
    expect(() => validateCuratedProgressContribution(
      makeDummyCuratedExperience(),
      contribution,
    )).toThrow('CURATED_PROGRESS_CONTRIBUTION_INVALID');
  });
});
