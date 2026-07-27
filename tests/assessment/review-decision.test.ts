import { describe, expect, it } from 'vitest';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import {
  createEvidenceBundle,
  stableDecisionId,
  validateReviewDecisions,
} from '@/lib/assessment/review/reviewDecisions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import type { QuestionReviewDecision } from '@/lib/assessment/review/campaignTypes';
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

describe('human review decisions', () => {
  it.each(['revise', 'retain-draft', 'eligible-for-reviewed', 'retire'] as const)(
    'validates an explicit %s chair decision without mutating a question',
    (decision) => {
      const fixture = completeDecisionFixture();
      const candidate: QuestionReviewDecision = {
        ...fixture.baseDecision,
        id: stableDecisionId({
          ...fixture.baseDecision,
          decision,
        }),
        decision,
      };
      expect(
        validateReviewDecisions({
          value: [candidate],
          bundle: fixture.bundle,
          manifest: fixture.manifest,
        }).issues,
      ).toEqual([]);
    },
  );

  it.each([
    ['missing decision maker', (decision: Record<string, unknown>) => ({ ...decision, decidedBy: '' }), 'REVIEW_DECISION_INVALID'],
    ['non-chair maker', (decision: Record<string, unknown>) => ({ ...decision, decidedBy: 'reviewer-a' }), 'REVIEW_DECISION_CHAIR_REQUIRED'],
    ['stale question evidence', (decision: Record<string, unknown>) => ({ ...decision, questionHash: '0'.repeat(64) }), 'REVIEW_DECISION_STALE'],
    ['bundle mismatch', (decision: Record<string, unknown>) => ({ ...decision, evidenceBundleHash: '0'.repeat(64) }), 'REVIEW_DECISION_EVIDENCE_MISMATCH'],
    ['approved decision type', (decision: Record<string, unknown>) => ({ ...decision, decision: 'approved' }), 'REVIEW_DECISION_INVALID'],
  ])('rejects %s', (_label, mutate, code) => {
    const fixture = completeDecisionFixture();
    expect(
      validateReviewDecisions({
        value: [mutate(fixture.baseDecision)],
        bundle: fixture.bundle,
        manifest: fixture.manifest,
      }).issues.map((issue) => issue.code),
    ).toContain(code);
  });

  it('rejects duplicate decisions for a question', () => {
    const fixture = completeDecisionFixture();
    expect(
      validateReviewDecisions({
        value: [fixture.baseDecision, fixture.baseDecision],
        bundle: fixture.bundle,
        manifest: fixture.manifest,
      }).issues.map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_DUPLICATE');
  });

  it('does not allow eligible-for-reviewed with incomplete coverage', () => {
    const fixture = completeDecisionFixture();
    const incompleteAnalysis = analyzeReviewCampaign({
      manifest: fixture.manifest,
      submissions: [],
      policy: reviewTestContext.policy,
    });
    const incompleteBundle = createEvidenceBundle({
      manifest: fixture.manifest,
      submissions: [],
      analysis: incompleteAnalysis,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    const decision = {
      ...fixture.baseDecision,
      evidenceBundleHash: incompleteBundle.hash,
    };
    expect(
      validateReviewDecisions({
        value: [decision],
        bundle: incompleteBundle,
        manifest: fixture.manifest,
      }).issues.map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_NOT_READY');
  });
});
