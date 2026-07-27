import { describe, expect, it } from 'vitest';
import {
  campaignReviewRows,
  campaignRowsToCsv,
  validateReviewerPack,
} from '@/lib/assessment/review/reviewerPack';
import { buildReviewDossier } from '@/lib/assessment/review/reviewPack';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

describe('reviewer-specific packs', () => {
  it('contains the exact 338-row evidence matrix with stable order and prefilled reviewer ID', () => {
    const manifest = syntheticCampaign();
    const first = campaignReviewRows(manifest, reviewTestContext.bank, 'reviewer-a');
    const second = campaignReviewRows(manifest, reviewTestContext.bank, 'reviewer-a');
    expect(first).toHaveLength(338);
    expect(first).toEqual(second);
    expect(first.every((row) => row.reviewerId === 'reviewer-a')).toBe(true);
    expect(first.every((row) => row.rating === '' && row.comment === '')).toBe(true);
    expect(new Set(first.map((row) => row.questionHash)).size).toBe(36);
  });

  it('keeps the complete expert dossier alongside campaign packs', () => {
    const dossier = buildReviewDossier(reviewTestContext.bank) as {
      questions: Array<{ question: { id: string }; objective: object; sources: object[] }>;
    };
    expect(dossier.questions).toHaveLength(36);
    expect(dossier.questions.every((item) => item.objective && item.sources.length > 0)).toBe(true);
  });
});

describe('reviewer-pack validation', () => {
  const validate = (csv: string, reviewerId = 'reviewer-a') =>
    validateReviewerPack({
      csv,
      manifest: syntheticCampaign(),
      bank: reviewTestContext.bank,
      expectedReviewerId: reviewerId,
    });

  it('accepts complete, partial, blank, comment-only, and multiline Unicode evidence', () => {
    const complete = validate(reviewerCsv('reviewer-a', { rating: '5' }));
    expect(complete.issues).toEqual([]);
    expect(complete.submissions).toHaveLength(338);
    expect(complete.submissions.every((row) => row.rating === 5)).toBe(true);

    const comment = 'Line one, with “quotes”\nLine two: Δ and ×';
    const commentOnly = validate(
      reviewerCsv('reviewer-a', {
        commentAt: {
          questionId: 'aqueous-angle-sba-001',
          criterion: 'clarity',
          comment,
        },
      }),
    );
    expect(commentOnly.issues).toEqual([]);
    expect(
      commentOnly.submissions.find(
        (row) =>
          row.questionId === 'aqueous-angle-sba-001' &&
          row.criterion === 'clarity',
      )?.comment,
    ).toBe(comment);
    expect(commentOnly.submissions.filter((row) => row.rating !== undefined)).toHaveLength(0);
  });

  it.each([
    ['wrong campaign', (csv: string) => csv.replace('test-aqueous-review', 'wrong-campaign'), 'REVIEW_CAMPAIGN_MISMATCH'],
    ['wrong reviewer', (csv: string) => csv.replaceAll(',reviewer-a,', ',reviewer-b,'), 'REVIEW_REVIEWER_MISMATCH'],
    ['stale hash', (csv: string) => csv.replace(/[a-f0-9]{64}/, '0'.repeat(64)), 'REVIEW_EVIDENCE_STALE'],
    ['wrong version', (csv: string) => csv.replace(',1,', ',2,'), 'REVIEW_EVIDENCE_STALE'],
    ['malformed rating', (csv: string) => csv.replace(',reviewer-a,,', ',reviewer-a,6,'), 'REVIEW_RATING_INVALID'],
    ['malformed quote', (csv: string) => `${csv}"unterminated`, 'UNTERMINATED_CSV_QUOTE'],
  ])('rejects %s', (_label, mutate, code) => {
    expect(validate(mutate(reviewerCsv('reviewer-a'))).issues.map((issue) => issue.code)).toContain(code);
  });

  it('detects missing, extra, and duplicate rows without silently repairing metadata', () => {
    const lines = reviewerCsv('reviewer-a').trimEnd().split('\n');
    expect(validate([...lines.slice(0, 2), ...lines.slice(3)].join('\n')).issues.map((issue) => issue.code)).toContain('REVIEW_PACK_ROW_MISSING');
    expect(validate(`${lines.join('\n')}\n${lines[1]}\n`).issues.map((issue) => issue.code)).toContain('REVIEW_PACK_DUPLICATE_ROW');
    const extra = campaignReviewRows(syntheticCampaign(), reviewTestContext.bank, 'reviewer-a');
    const unexpected = { ...extra[0], questionId: 'unexpected-question' };
    expect(validate(campaignRowsToCsv([...extra, unexpected])).issues.map((issue) => issue.code)).toContain('REVIEW_PACK_ROW_UNEXPECTED');
  });

  it('does not mutate the source pack', () => {
    const csv = reviewerCsv('reviewer-a', { rating: '5' });
    const before = csv.slice();
    validate(csv);
    expect(csv).toBe(before);
  });
});
