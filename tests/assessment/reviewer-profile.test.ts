import { describe, expect, it } from 'vitest';
import { validateReviewerProfiles } from '@/lib/assessment/review/reviewerProfiles';
import { syntheticReviewers } from './reviewTestFixtures';

describe('reviewer profiles', () => {
  it('normalizes stable IDs and accepts consent-free pseudonymous fixtures', () => {
    const result = validateReviewerProfiles([
      {
        ...syntheticReviewers[0],
        id: ' Reviewer-A ',
        roles: ['subject-matter-expert', 'review-chair'],
      },
    ]);
    expect(result.issues).toEqual([]);
    expect(result.profiles[0].id).toBe('reviewer-a');
    expect(result.profiles[0].displayName).toBeUndefined();
  });

  it.each([
    [[syntheticReviewers[0], syntheticReviewers[0]], 'REVIEWER_ID_DUPLICATE'],
    [[{ ...syntheticReviewers[0], id: 'bad_id' }], 'REVIEWER_PROFILE_INVALID'],
    [[{ ...syntheticReviewers[0], roles: [] }], 'REVIEWER_PROFILE_INVALID'],
    [[{ ...syntheticReviewers[0], expertiseTags: [] }], 'REVIEWER_PROFILE_INVALID'],
    [[{ ...syntheticReviewers[0], independentReviewAttestation: false }], 'REVIEWER_ATTESTATION_REQUIRED'],
    [[{ ...syntheticReviewers[0], displayName: 'A Person' }], 'REVIEWER_ATTRIBUTION_CONSENT_REQUIRED'],
  ])('rejects invalid reviewer registration', (profiles, code) => {
    expect(validateReviewerProfiles(profiles).issues.map((issue) => issue.code)).toContain(code);
  });

  it('requires at least one registered review chair', () => {
    expect(
      validateReviewerProfiles([syntheticReviewers[0]]).issues.map(
        (issue) => issue.code,
      ),
    ).toContain('REVIEW_CHAIR_REQUIRED');
  });

  it('accepts a declared conflict as explicit non-independent evidence', () => {
    const result = validateReviewerProfiles([
      {
        ...syntheticReviewers[0],
        independentReviewAttestation: false,
        roles: ['subject-matter-expert', 'review-chair'],
        conflictOfInterest: { status: 'declared', description: 'Synthetic fixture conflict.' },
      },
    ]);
    expect(result.issues).toEqual([]);
  });
});
