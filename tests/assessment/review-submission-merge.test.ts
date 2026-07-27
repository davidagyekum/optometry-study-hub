import { describe, expect, it } from 'vitest';
import {
  mergeReviewerPacks,
  mergedSubmissionsHash,
} from '@/lib/assessment/review/mergeSubmissions';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

const pack = (reviewerId: string, rating = '5') => ({
  name: `${reviewerId}.csv`,
  csv: reviewerCsv(reviewerId, { rating }),
});

describe('review submission merging', () => {
  it.each([1, 2, 3])('merges %i reviewer packs with blank-row coverage preserved', (count) => {
    const result = mergeReviewerPacks({
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      packs: syntheticReviewers.slice(0, count).map((reviewer) => pack(reviewer.id)),
    });
    expect(result.issues).toEqual([]);
    expect(result.merged?.submissions).toHaveLength(338 * count);
  });

  it('is deterministic and independent of input-file order', () => {
    const input = [pack('reviewer-a'), pack('reviewer-b', '4'), pack('reviewer-c')];
    const first = mergeReviewerPacks({
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      packs: input,
    }).merged!;
    const second = mergeReviewerPacks({
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      packs: [...input].reverse(),
    }).merged!;
    expect(second).toEqual(first);
    expect(mergedSubmissionsHash(second)).toBe(mergedSubmissionsHash(first));
  });

  it('preserves comment-only evidence exactly', () => {
    const comment = '=UNTRUSTED("formula")\nSecond line, “quoted”';
    const result = mergeReviewerPacks({
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      packs: [
        {
          name: 'reviewer-a.csv',
          csv: reviewerCsv('reviewer-a', {
            commentAt: {
              questionId: 'aqueous-angle-sba-001',
              criterion: 'clarity',
              comment,
            },
          }),
        },
      ],
    });
    expect(result.issues).toEqual([]);
    expect(result.merged?.submissions.find((row) => row.comment)?.comment).toBe(comment);
    expect(result.merged?.submissions.find((row) => row.comment)?.rating).toBeUndefined();
  });

  it('rejects duplicate packs and reviewers outside the campaign', () => {
    const duplicate = mergeReviewerPacks({
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      packs: [pack('reviewer-a'), pack('reviewer-a')],
    });
    expect(duplicate.issues.map((issue) => issue.code)).toContain('REVIEW_PACK_DUPLICATE_REVIEWER');

    const restrictedManifest = syntheticCampaign(syntheticReviewers.slice(0, 2));
    const outside = mergeReviewerPacks({
      manifest: restrictedManifest,
      bank: reviewTestContext.bank,
      packs: [pack('reviewer-c')],
    });
    expect(outside.issues.map((issue) => issue.code)).toContain('REVIEW_REVIEWER_MISMATCH');
  });
});
