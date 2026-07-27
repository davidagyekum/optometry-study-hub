import { describe, expect, it } from 'vitest';
import {
  mergeReviewerPacks,
  validateMergedReviewSubmissions,
} from '@/lib/assessment/review/mergeSubmissions';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

function completeEvidence() {
  const manifest = syntheticCampaign();
  const merged = mergeReviewerPacks({
    manifest,
    bank: reviewTestContext.bank,
    packs: ['reviewer-a', 'reviewer-b', 'reviewer-c'].map((reviewerId) => ({
      name: `${reviewerId}.csv`,
      csv: reviewerCsv(reviewerId, { manifest, rating: '5' }),
    })),
  }).merged!;
  return { manifest, merged };
}

describe('review-analysis evidence diagnostics', () => {
  it('rejects missing criterion rows before analysis', () => {
    const { manifest, merged } = completeEvidence();
    const result = validateMergedReviewSubmissions({
      value: {
        ...merged,
        submissions: merged.submissions.filter(
          (row, index) => index !== 0,
        ),
      },
      manifest,
      bank: reviewTestContext.bank,
    });
    expect(result.merged).toBeUndefined();
    expect(result.issues.map((issue) => issue.code)).toContain(
      'MERGED_REVIEW_MATRIX_INCOMPLETE',
    );
  });

  it('rejects stale question hashes before Aiken or coverage calculations', () => {
    const { manifest, merged } = completeEvidence();
    const result = validateMergedReviewSubmissions({
      value: {
        ...merged,
        submissions: merged.submissions.map((submission, index) =>
          index === 0
            ? { ...submission, questionHash: '0'.repeat(64) }
            : submission,
        ),
      },
      manifest,
      bank: reviewTestContext.bank,
    });
    expect(result.merged).toBeUndefined();
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'MERGED_REVIEW_PROTECTED_METADATA_MISMATCH',
        'MERGED_REVIEW_HASH_MISMATCH',
      ]),
    );
  });
});
