import { describe, expect, it } from 'vitest';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import {
  campaignReviewRows,
  campaignRowsToCsv,
} from '@/lib/assessment/review/reviewerPack';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

function mergedFor(
  reviewerIds: string[],
  rowRating: (row: { questionId: string; criterion: string }, reviewerId: string) => string = () => '5',
  reviewers = syntheticReviewers,
) {
  const manifest = syntheticCampaign(reviewers);
  const packs = reviewerIds.map((reviewerId) => ({
    name: `${reviewerId}.csv`,
    csv: campaignRowsToCsv(
      campaignReviewRows(manifest, reviewTestContext.bank, reviewerId).map((row) => ({
        ...row,
        rating: rowRating(row, reviewerId),
      })),
    ),
  }));
  const merged = mergeReviewerPacks({
    manifest,
    bank: reviewTestContext.bank,
    packs,
  });
  expect(merged.issues).toEqual([]);
  return { manifest, submissions: merged.merged!.submissions };
}

describe('review analysis and readiness', () => {
  it.each([0, 1, 2, 3])('reports deterministic readiness for %i reviewers', (count) => {
    const reviewerIds = syntheticReviewers.slice(0, count).map((reviewer) => reviewer.id);
    const input =
      count === 0
        ? { manifest: syntheticCampaign(), submissions: [] }
        : mergedFor(reviewerIds);
    const analysis = analyzeReviewCampaign({
      ...input,
      policy: reviewTestContext.policy,
    });
    expect(analysis.questions).toHaveLength(36);
    if (count === 0) {
      expect(analysis.summary.notStarted).toBe(36);
      expect(analysis.questions[0].issues.some((issue) => issue.code === 'NO_REVIEW_RATINGS')).toBe(true);
    } else if (count < 3) {
      expect(analysis.summary.incomplete).toBe(36);
      expect(analysis.questions[0].issues.some((issue) => issue.code === 'INSUFFICIENT_REVIEWERS')).toBe(true);
    } else {
      expect(analysis.summary.readyForHumanDecision).toBe(36);
      expect(analysis.questions.every((question) => question.issues.length === 0)).toBe(true);
    }
  });

  it('reports missing criteria and uses only overall-content-validity for per-question V', () => {
    const targetQuestion = 'aqueous-angle-sba-001';
    const { manifest, submissions } = mergedFor(
      ['reviewer-a', 'reviewer-b', 'reviewer-c'],
      (row) =>
        row.questionId === targetQuestion && row.criterion === 'overall-content-validity'
          ? ''
          : '5',
    );
    const analysis = analyzeReviewCampaign({
      manifest,
      submissions,
      policy: reviewTestContext.policy,
    });
    const question = analysis.questions.find((entry) => entry.questionId === targetQuestion)!;
    expect(question.overallContentValidity?.value).toBeUndefined();
    expect(question.criterionValues.find((value) => value.criterion === 'clarity')?.value).toBe(1);
    expect(question.issues.some((issue) => issue.code === 'NO_REVIEW_RATINGS' && issue.criterion === 'overall-content-validity')).toBe(true);
  });

  it('flags below-project Aiken values, low ratings, and blocking accuracy and image-rights concerns', () => {
    const imageQuestion = reviewTestContext.bank.questions.find((question) => 'image' in question)!.id;
    const { manifest, submissions } = mergedFor(
      ['reviewer-a', 'reviewer-b', 'reviewer-c'],
      (row, reviewerId) => {
        if (row.questionId === imageQuestion && row.criterion === 'image-rights' && reviewerId === 'reviewer-a') return '2';
        if (row.questionId === 'aqueous-angle-sba-001' && row.criterion === 'factual-accuracy' && reviewerId === 'reviewer-a') return '1';
        if (row.questionId === 'aqueous-angle-sba-001' && row.criterion === 'clarity') return '3';
        return '5';
      },
    );
    const analysis = analyzeReviewCampaign({
      manifest,
      submissions,
      policy: reviewTestContext.policy,
    });
    const issues = analysis.questions.flatMap((question) => question.issues);
    expect(issues.map((issue) => issue.code)).toContain('AIKEN_BELOW_PROJECT_FLAG');
    expect(issues.find((issue) => issue.code === 'FACTUAL_ACCURACY_CONCERN')?.severity).toBe('blocking');
    expect(issues.find((issue) => issue.code === 'IMAGE_RIGHTS_CONCERN')?.severity).toBe('blocking');
  });

  it('retains every reviewer comment as an unresolved issue', () => {
    const manifest = syntheticCampaign();
    const merged = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: [
        {
          name: 'reviewer-a.csv',
          csv: reviewerCsv('reviewer-a', {
            rating: '5',
            commentAt: {
              questionId: 'aqueous-angle-sba-001',
              criterion: 'clarity',
              comment: 'Synthetic qualitative concern.',
            },
          }),
        },
        { name: 'reviewer-b.csv', csv: reviewerCsv('reviewer-b', { rating: '5' }) },
        { name: 'reviewer-c.csv', csv: reviewerCsv('reviewer-c', { rating: '5' }) },
      ],
    }).merged!;
    const analysis = analyzeReviewCampaign({
      manifest,
      submissions: merged.submissions,
      policy: reviewTestContext.policy,
    });
    expect(
      analysis.questions
        .find((question) => question.questionId === 'aqueous-angle-sba-001')
        ?.issues.some((issue) => issue.code === 'REVIEWER_COMMENT'),
    ).toBe(true);
  });

  it('reports conflict and non-independence without silently counting the reviewer', () => {
    const conflicted = {
      ...syntheticReviewers[0],
      independentReviewAttestation: false,
      conflictOfInterest: {
        status: 'declared' as const,
        description: 'Synthetic conflict.',
      },
    };
    const reviewers = [conflicted, syntheticReviewers[1], syntheticReviewers[2]];
    const { manifest, submissions } = mergedFor(
      reviewers.map((reviewer) => reviewer.id),
      () => '5',
      reviewers,
    );
    const analysis = analyzeReviewCampaign({
      manifest,
      submissions,
      policy: reviewTestContext.policy,
    });
    expect(analysis.summary.reviewerCoverage).toMatchObject({
      totalReviewers: 3,
      independentReviewers: 2,
      conflictedReviewers: 1,
    });
    expect(analysis.summary.incomplete).toBe(36);
    expect(analysis.questions[0].issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'REVIEWER_CONFLICT_DECLARED',
        'REVIEWER_INDEPENDENCE_NOT_ATTESTED',
      ]),
    );
  });

  it('never produces reviewed, approved, or valid as an automatic state', () => {
    const states = analyzeReviewCampaign({
      ...mergedFor(['reviewer-a', 'reviewer-b', 'reviewer-c']),
      policy: reviewTestContext.policy,
    }).questions.map((question) => question.state as string);
    expect(states).not.toContain('reviewed');
    expect(states).not.toContain('approved');
    expect(states).not.toContain('valid');
  });
});
