import { describe, expect, it } from 'vitest';
import {
  createReviewCampaignManifest,
} from '@/lib/assessment/review/campaignManifest';
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
  syntheticReviewers,
} from './reviewTestFixtures';

describe('reviewer-specific packs', () => {
  it('contains the exact immutable 741-row evidence matrix', () => {
    const manifest = syntheticCampaign();
    const rows = campaignReviewRows(
      manifest,
      reviewTestContext.bank,
      'reviewer-a',
    );
    expect(rows).toHaveLength(741);
    expect(rows.every((row) => row.reviewerId === 'reviewer-a')).toBe(true);
    expect(rows.every((row) => row.campaignHash === manifest.campaignHash)).toBe(true);
    expect(rows.every((row) => row.rating === '' && row.comment === '')).toBe(true);
    expect(new Set(rows.map((row) => row.questionHash)).size).toBe(80);
  });

  it('keeps the complete expert dossier alongside campaign packs', () => {
    const dossier = buildReviewDossier(reviewTestContext.bank) as {
      questions: Array<{ question: { id: string }; objective: object; sources: object[] }>;
    };
    expect(dossier.questions).toHaveLength(80);
    expect(
      dossier.questions.every(
        (item) => item.objective && item.sources.length > 0,
      ),
    ).toBe(true);
  });
});

describe('reviewer-pack validation', () => {
  const validate = (
    csv: string,
    manifest = syntheticCampaign(),
    reviewerId = 'reviewer-a',
  ) =>
    validateReviewerPack({
      csv,
      manifest,
      bank: reviewTestContext.bank,
      expectedReviewerId: reviewerId,
    });

  it('accepts complete, blank, comment-only, multiline Unicode, and whitespace-only evidence', () => {
    const manifest = syntheticCampaign();
    const complete = validate(
      reviewerCsv('reviewer-a', { manifest, rating: '5' }),
      manifest,
    );
    expect(complete.issues).toEqual([]);
    expect(complete.submissions).toHaveLength(741);
    expect(complete.packHash).toMatch(/^[a-f0-9]{64}$/);

    const comment = 'Line one, with “quotes”\nLine two: Δ and ×';
    const commentOnly = validate(
      reviewerCsv('reviewer-a', {
        manifest,
        commentAt: {
          questionId: 'aqueous-angle-sba-001',
          criterion: 'clarity',
          comment,
        },
      }),
      manifest,
    );
    expect(commentOnly.issues).toEqual([]);
    expect(commentOnly.submissions.find((row) => row.comment)?.comment).toBe(comment);
    expect(commentOnly.submissions.filter((row) => row.rating !== undefined)).toHaveLength(0);

    const whitespace = reviewerCsv('reviewer-a', {
      manifest,
      commentAt: {
        questionId: 'aqueous-angle-sba-001',
        criterion: 'clarity',
        comment: '   ',
      },
    });
    expect(
      validate(whitespace, manifest).submissions.some(
        (row) => row.comment !== undefined,
      ),
    ).toBe(false);
  });

  it('makes old packs stale after reviewer, timestamp, or policy changes', () => {
    const original = syntheticCampaign();
    const oldPack = reviewerCsv('reviewer-a', { manifest: original });
    const changedPolicy = {
      ...reviewTestContext.policy,
      flagBelowAikenV: 0.81,
    };
    const manifests = [
      syntheticCampaign(undefined, {
        createdAt: '2001-01-01T00:00:00.000Z',
      }),
      syntheticCampaign(
        syntheticReviewers.map((reviewer, index) =>
          index === 0
            ? {
                ...reviewer,
                conflictOfInterest: {
                  status: 'declared' as const,
                  description: 'Synthetic conflict.',
                },
              }
            : reviewer,
        ),
      ),
      syntheticCampaign(
        syntheticReviewers.map((reviewer, index) =>
          index === 0
            ? {
                ...reviewer,
                independentReviewAttestation: false,
                conflictOfInterest: {
                  status: 'declared' as const,
                  description: 'Synthetic independence change.',
                },
              }
            : reviewer,
        ),
      ),
      syntheticCampaign(
        syntheticReviewers.map((reviewer, index) =>
          index === 0
            ? { ...reviewer, roles: ['assessment-reviewer'] }
            : reviewer,
        ),
      ),
      syntheticCampaign(
        syntheticReviewers.map((reviewer, index) =>
          index === 0
            ? { ...reviewer, consentToAttribution: true }
            : reviewer,
        ),
      ),
      createReviewCampaignManifest({
        campaignId: original.id,
        createdAt: original.createdAt,
        bank: reviewTestContext.bank,
        blueprint: reviewTestContext.blueprint,
        policy: changedPolicy,
        reviewers: syntheticReviewers,
      }),
    ];
    for (const manifest of manifests) {
      expect(
        validate(oldPack, manifest).issues.map((issue) => issue.code),
      ).toContain('REVIEW_CAMPAIGN_MISMATCH');
    }
  });

  it.each([
    ['wrong campaign ID', (csv: string) => csv.replace('test-aqueous-review', 'wrong-campaign'), 'REVIEW_CAMPAIGN_MISMATCH'],
    ['wrong campaign hash', (csv: string, manifest: ReturnType<typeof syntheticCampaign>) => csv.replace(manifest.campaignHash, '0'.repeat(64)), 'REVIEW_CAMPAIGN_MISMATCH'],
    ['wrong reviewer', (csv: string) => csv.replaceAll(',reviewer-a,', ',reviewer-b,'), 'REVIEW_REVIEWER_MISMATCH'],
    ['stale question hash', (csv: string, manifest: ReturnType<typeof syntheticCampaign>) => csv.replace(manifest.questions[0].questionHash, '0'.repeat(64)), 'REVIEW_EVIDENCE_STALE'],
    ['malformed rating', (csv: string) => csv.replace(',reviewer-a,,', ',reviewer-a,6,'), 'REVIEW_RATING_INVALID'],
    ['malformed quote', (csv: string) => `${csv}"unterminated`, 'UNTERMINATED_CSV_QUOTE'],
  ])('rejects %s', (_label, mutate, code) => {
    const manifest = syntheticCampaign();
    const csv = reviewerCsv('reviewer-a', { manifest });
    expect(
      validate(mutate(csv, manifest), manifest).issues.map((issue) => issue.code),
    ).toContain(code);
  });

  it('detects missing, extra, and duplicate rows', () => {
    const manifest = syntheticCampaign();
    const lines = reviewerCsv('reviewer-a', { manifest }).trimEnd().split('\n');
    expect(
      validate([...lines.slice(0, 2), ...lines.slice(3)].join('\n'), manifest)
        .issues.map((issue) => issue.code),
    ).toContain('REVIEW_PACK_ROW_MISSING');
    expect(
      validate(`${lines.join('\n')}\n${lines[1]}\n`, manifest).issues.map(
        (issue) => issue.code,
      ),
    ).toContain('REVIEW_PACK_DUPLICATE_ROW');
    const extra = campaignReviewRows(
      manifest,
      reviewTestContext.bank,
      'reviewer-a',
    );
    expect(
      validate(
        campaignRowsToCsv([
          ...extra,
          { ...extra[0], questionId: 'unexpected-question' },
        ]),
        manifest,
      ).issues.map((issue) => issue.code),
    ).toContain('REVIEW_PACK_ROW_UNEXPECTED');
  });
});
