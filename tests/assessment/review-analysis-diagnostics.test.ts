import { describe, expect, it } from 'vitest';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

function completeSubmissions() {
  const manifest = syntheticCampaign();
  const merged = mergeReviewerPacks({
    manifest,
    bank: reviewTestContext.bank,
    packs: ['reviewer-a', 'reviewer-b', 'reviewer-c'].map((reviewerId) => ({
      name: `${reviewerId}.csv`,
      csv: reviewerCsv(reviewerId, { rating: '5' }),
    })),
  }).merged!;
  return { manifest, submissions: merged.submissions };
}

describe('review-analysis evidence diagnostics', () => {
  it('emits a stable missing-required-criterion issue when coverage evidence is absent', () => {
    const { manifest, submissions } = completeSubmissions();
    const question = manifest.questions[0];
    const criterion = question.applicableCriteria[0];
    const analysis = analyzeReviewCampaign({
      manifest,
      submissions: submissions.filter(
        (row) =>
          row.questionId !== question.questionId || row.criterion !== criterion,
      ),
      policy: reviewTestContext.policy,
    });
    expect(
      analysis.questions
        .find((entry) => entry.questionId === question.questionId)
        ?.issues.some(
          (issue) =>
            issue.code === 'MISSING_REQUIRED_CRITERION' &&
            issue.criterion === criterion,
        ),
    ).toBe(true);
  });

  it('emits a stable stale-evidence issue for a mismatched question hash', () => {
    const { manifest, submissions } = completeSubmissions();
    const changed = submissions.map((submission, index) =>
      index === 0 ? { ...submission, questionHash: '0'.repeat(64) } : submission,
    );
    const analysis = analyzeReviewCampaign({
      manifest,
      submissions: changed,
      policy: reviewTestContext.policy,
    });
    expect(
      analysis.questions.flatMap((question) => question.issues).map((issue) => issue.code),
    ).toContain('STALE_REVIEW_EVIDENCE');
  });
});
