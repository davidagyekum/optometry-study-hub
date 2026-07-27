import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import {
  createEvidenceBundle,
  stableDecisionId,
} from '@/lib/assessment/review/reviewDecisions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import type {
  QuestionReviewDecision,
  ReviewDecisionType,
} from '@/lib/assessment/review/campaignTypes';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

export function completeDecisionFixture(options: {
  consentedAttribution?: boolean;
} = {}) {
  const reviewers = options.consentedAttribution
    ? syntheticReviewers.map((reviewer) =>
        reviewer.id === 'reviewer-a'
          ? { ...reviewer, consentToAttribution: true }
          : reviewer,
      )
    : syntheticReviewers;
  const manifest = syntheticCampaign(reviewers);
  const merged = mergeReviewerPacks({
    manifest,
    bank: reviewTestContext.bank,
    packs: ['reviewer-a', 'reviewer-b', 'reviewer-c'].map((reviewerId) => ({
      name: `${reviewerId}.csv`,
      csv: reviewerCsv(reviewerId, { manifest, rating: '5' }),
    })),
  }).merged!;
  const analysis = analyzeReviewCampaign({
    manifest,
    merged,
    policy: reviewTestContext.policy,
  });
  const bundle = createEvidenceBundle({
    manifest,
    merged,
    resolutions: [],
    policy: reviewTestContext.policy,
  });
  const question = manifest.questions[0];
  const decisionFor = (
    decision: ReviewDecisionType,
    overrides: Partial<QuestionReviewDecision> = {},
  ): QuestionReviewDecision => {
    const evidence = {
      schemaVersion: 1 as const,
      campaignId: manifest.id,
      campaignHash: manifest.campaignHash,
      questionId: question.questionId,
      questionVersion: question.questionVersion,
      questionHash: question.questionHash,
      evidenceBundleHash: bundle.hash,
      decision,
      decidedBy: 'reviewer-c',
      decidedAt: '2000-01-03T00:00:00.000Z',
      rationale: 'Synthetic fixture decision; not academic evidence.',
      resolvedIssueIds: [],
      ...overrides,
    };
    return {
      ...evidence,
      id:
        overrides.id ??
        stableDecisionId({
          campaignId: evidence.campaignId,
          campaignHash: evidence.campaignHash,
          questionId: evidence.questionId,
          questionVersion: evidence.questionVersion,
          questionHash: evidence.questionHash,
          evidenceBundleHash: evidence.evidenceBundleHash,
          decision: evidence.decision,
          decidedBy: evidence.decidedBy,
        }),
    };
  };
  const baseDecision = decisionFor('eligible-for-reviewed');
  return {
    manifest,
    merged,
    analysis,
    bundle,
    baseDecision,
    decisionFor,
  };
}
