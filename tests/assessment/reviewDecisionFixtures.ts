import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import {
  createEvidenceBundle,
  stableDecisionId,
} from '@/lib/assessment/review/reviewDecisions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

export function completeDecisionFixture() {
  const manifest = syntheticCampaign();
  const merged = mergeReviewerPacks({
    manifest,
    bank: reviewTestContext.bank,
    packs: ['reviewer-a', 'reviewer-b', 'reviewer-c'].map((reviewerId) => ({
      name: `${reviewerId}.csv`,
      csv: reviewerCsv(reviewerId, { rating: '5' }),
    })),
  }).merged!;
  const analysis = analyzeReviewCampaign({
    manifest,
    submissions: merged.submissions,
    policy: reviewTestContext.policy,
  });
  const bundle = createEvidenceBundle({
    manifest,
    submissions: merged.submissions,
    analysis,
    resolutions: [],
    policy: reviewTestContext.policy,
  });
  const question = manifest.questions[0];
  const baseDecision = {
    schemaVersion: 1 as const,
    id: stableDecisionId({
      campaignId: manifest.id,
      questionId: question.questionId,
      questionVersion: question.questionVersion,
      questionHash: question.questionHash,
      decision: 'eligible-for-reviewed',
      decidedBy: 'reviewer-c',
    }),
    campaignId: manifest.id,
    questionId: question.questionId,
    questionVersion: question.questionVersion,
    questionHash: question.questionHash,
    evidenceBundleHash: bundle.hash,
    decision: 'eligible-for-reviewed' as const,
    decidedBy: 'reviewer-c',
    decidedAt: '2000-01-03T00:00:00.000Z',
    rationale: 'Synthetic fixture decision; not academic evidence.',
    resolvedIssueIds: [],
  };
  return { manifest, merged, analysis, bundle, baseDecision };
}
