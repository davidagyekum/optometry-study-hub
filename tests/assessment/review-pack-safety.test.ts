import { describe, expect, it } from 'vitest';
import {
  campaignReviewRows,
  campaignRowsToCsv,
  MAX_REVIEW_COMMENT_LENGTH,
  validateReviewerPack,
} from '@/lib/assessment/review/reviewerPack';
import {
  reviewTestContext,
  syntheticCampaign,
} from './reviewTestFixtures';

function withComment(comment: string): string {
  const manifest = syntheticCampaign();
  const rows = campaignReviewRows(
    manifest,
    reviewTestContext.bank,
    'reviewer-a',
  ).map((row, index) => (index === 0 ? { ...row, comment } : row));
  return campaignRowsToCsv(rows);
}

describe('review comment safety', () => {
  it('rejects comments beyond the documented limit', () => {
    const result = validateReviewerPack({
      csv: withComment('x'.repeat(MAX_REVIEW_COMMENT_LENGTH + 1)),
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      expectedReviewerId: 'reviewer-a',
    });
    expect(result.issues.map((issue) => issue.code)).toContain(
      'REVIEW_COMMENT_TOO_LONG',
    );
  });

  it('rejects unsafe control characters while preserving ordinary Unicode', () => {
    const result = validateReviewerPack({
      csv: withComment('ordinary Δ text\u0001'),
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      expectedReviewerId: 'reviewer-a',
    });
    expect(result.issues.map((issue) => issue.code)).toContain(
      'REVIEW_CONTROL_CHARACTER',
    );
  });
});
