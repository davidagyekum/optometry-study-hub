import { describe, expect, it } from 'vitest';
import { safeMarkdownJson } from '@/lib/assessment/review/markdown';
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

describe('Markdown JSON export safety', () => {
  it('uses a fence longer than untrusted backtick runs without changing JSON', () => {
    const comment = [
      '``` triple',
      '```` quadruple',
      '# heading',
      '[link](https://example.test)',
      '<strong>raw HTML</strong>',
      '</script><script>alert("x")</script>',
      'Unicode: Δ × £ “multiline”',
    ].join('\n');
    const value = {
      comment,
      rationale: `${comment}\nA final rationale line.`,
    };
    const markdown = safeMarkdownJson(value);
    const [opening, ...rest] = markdown.split('\n');
    const fence = opening.replace(/json$/, '');
    expect(fence).toBe('`'.repeat(5));
    expect(rest.at(-1)).toBe(fence);
    const json = rest.slice(0, -1).join('\n');
    expect(json).toBe(JSON.stringify(value, null, 2));
    expect(JSON.parse(json)).toEqual(value);
    expect(markdown).toContain('</script><script>');
  });
});
