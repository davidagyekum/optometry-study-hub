import { describe, expect, it } from 'vitest';
import {
  mergeReviewerPacks,
  mergedSubmissionsHash,
  validateMergedReviewSubmissions,
} from '@/lib/assessment/review/mergeSubmissions';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

const pack = (
  reviewerId: string,
  manifest = syntheticCampaign(),
  rating = '5',
) => ({
  name: `${reviewerId}.csv`,
  csv: reviewerCsv(reviewerId, { manifest, rating }),
});

describe('review submission merging', () => {
  it.each([1, 2, 3])(
    'merges %i reviewer packs with complete blank-row coverage and receipts',
    (count) => {
      const manifest = syntheticCampaign();
      const result = mergeReviewerPacks({
        manifest,
        bank: reviewTestContext.bank,
        packs: syntheticReviewers
          .slice(0, count)
          .map((reviewer) => pack(reviewer.id, manifest)),
      });
      expect(result.issues).toEqual([]);
      expect(result.merged?.submissions).toHaveLength(338 * count);
      expect(result.merged?.sourcePacks).toHaveLength(count);
      expect(result.merged?.campaignHash).toBe(manifest.campaignHash);
      expect(result.merged?.mergedHash).toBe(
        mergedSubmissionsHash(result.merged!),
      );
    },
  );

  it('is deterministic and independent of input-file order', () => {
    const manifest = syntheticCampaign();
    const input = [
      pack('reviewer-a', manifest),
      pack('reviewer-b', manifest, '4'),
      pack('reviewer-c', manifest),
    ];
    const first = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: input,
    }).merged!;
    const second = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: [...input].reverse(),
    }).merged!;
    expect(second).toEqual(first);
  });

  it('preserves comment-only evidence and treats whitespace-only comments as blank', () => {
    const manifest = syntheticCampaign();
    const comment = '=UNTRUSTED("formula")\nSecond line, “quoted”';
    const commented = reviewerCsv('reviewer-a', {
      manifest,
      commentAt: {
        questionId: 'aqueous-angle-sba-001',
        criterion: 'clarity',
        comment,
      },
    });
    const whitespace = reviewerCsv('reviewer-a', {
      manifest,
      commentAt: {
        questionId: 'aqueous-angle-sba-001',
        criterion: 'clarity',
        comment: '   ',
      },
    });
    const exact = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: [{ name: 'reviewer-a.csv', csv: commented }],
    }).merged!;
    const blank = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: [{ name: 'reviewer-a.csv', csv: whitespace }],
    }).merged!;
    expect(exact.submissions.find((row) => row.comment)?.comment).toBe(comment);
    expect(blank.submissions.some((row) => row.comment !== undefined)).toBe(false);
  });

  it.each([
    [
      'duplicate row',
      (merged: Record<string, unknown> & { submissions: unknown[] }) => ({
        ...merged,
        submissions: [...merged.submissions, merged.submissions[0]],
      }),
      'MERGED_REVIEW_DUPLICATE_ROW',
    ],
    [
      'removed row',
      (merged: Record<string, unknown> & { submissions: unknown[] }) => ({
        ...merged,
        submissions: merged.submissions.slice(1),
      }),
      'MERGED_REVIEW_MATRIX_INCOMPLETE',
    ],
    [
      'changed protected metadata',
      (merged: Record<string, unknown> & { submissions: Array<Record<string, unknown>> }) => ({
        ...merged,
        submissions: merged.submissions.map((row, index) =>
          index === 0 ? { ...row, objectiveId: 'unknown-objective' } : row,
        ),
      }),
      'MERGED_REVIEW_PROTECTED_METADATA_MISMATCH',
    ],
    [
      'unknown reviewer',
      (merged: Record<string, unknown> & { submissions: Array<Record<string, unknown>> }) => ({
        ...merged,
        submissions: merged.submissions.map((row, index) =>
          index === 0 ? { ...row, reviewerId: 'outsider' } : row,
        ),
      }),
      'MERGED_REVIEW_REVIEWER_UNKNOWN',
    ],
  ])('rejects %s even when an attacker leaves the old merged hash', (_label, mutate, code) => {
    const manifest = syntheticCampaign();
    const merged = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: [pack('reviewer-a', manifest)],
    }).merged!;
    const result = validateMergedReviewSubmissions({
      value: mutate(structuredClone(merged) as never),
      manifest,
      bank: reviewTestContext.bank,
    });
    expect(result.issues.map((issue) => issue.code)).toContain(code);
    expect(result.issues.map((issue) => issue.code)).toContain(
      'MERGED_REVIEW_HASH_MISMATCH',
    );
  });

  it('rejects stale campaign, source-pack receipt, nondeterministic order, and malformed runtime rows', () => {
    const manifest = syntheticCampaign();
    const merged = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: [pack('reviewer-a', manifest)],
    }).merged!;
    const variants = [
      { ...merged, campaignHash: '0'.repeat(64) },
      {
        ...merged,
        sourcePacks: merged.sourcePacks.map((receipt) => ({
          ...receipt,
          packHash: '0'.repeat(64),
        })),
      },
      { ...merged, submissions: [...merged.submissions].reverse() },
      {
        ...merged,
        submissions: merged.submissions.map((submission, index) =>
          index === 0 ? { ...submission, rating: 9 } : submission,
        ),
      },
    ];
    const codes = variants.map((value) =>
      validateMergedReviewSubmissions({
        value,
        manifest,
        bank: reviewTestContext.bank,
      }).issues.map((issue) => issue.code),
    );
    expect(codes[0]).toContain('MERGED_REVIEW_CAMPAIGN_MISMATCH');
    expect(codes[1]).toContain('MERGED_REVIEW_SOURCE_PACK_STALE');
    expect(codes[2]).toContain('MERGED_REVIEW_ORDER_INVALID');
    expect(codes[3]).toContain('MERGED_REVIEW_SCHEMA_INVALID');
  });
});
