import { describe, expect, it } from 'vitest';
import {
  createEvidenceBundle,
  stableDecisionId,
  validateReviewDecisions,
} from '@/lib/assessment/review/reviewDecisions';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import { validateIssueResolutions } from '@/lib/assessment/review/issueResolutions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import {
  campaignReviewRows,
  campaignRowsToCsv,
} from '@/lib/assessment/review/reviewerPack';
import { completeDecisionFixture } from './reviewDecisionFixtures';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

describe('human review decisions', () => {
  it.each(['revise', 'retain-draft', 'eligible-for-reviewed', 'retire'] as const)(
    'validates an explicit %s chair decision with a recomputed stable ID',
    (decision) => {
      const fixture = completeDecisionFixture();
      const candidate = fixture.decisionFor(decision);
      expect(
        validateReviewDecisions({
          value: [candidate],
          bundle: fixture.bundle,
          manifest: fixture.manifest,
          context: reviewTestContext,
        }).issues,
      ).toEqual([]);
      expect(candidate.id).toBe(
        stableDecisionId({
          campaignId: candidate.campaignId,
          campaignHash: candidate.campaignHash,
          questionId: candidate.questionId,
          questionVersion: candidate.questionVersion,
          questionHash: candidate.questionHash,
          evidenceBundleHash: candidate.evidenceBundleHash,
          decision: candidate.decision,
          decidedBy: candidate.decidedBy,
        }),
      );
    },
  );

  it.each([
    [
      'arbitrary decision ID',
      (fixture: ReturnType<typeof completeDecisionFixture>) => ({
        ...fixture.baseDecision,
        id: 'decision-arbitrary',
      }),
      'REVIEW_DECISION_ID_INVALID',
    ],
    [
      'non-chair maker',
      (fixture: ReturnType<typeof completeDecisionFixture>) =>
        fixture.decisionFor('eligible-for-reviewed', {
          decidedBy: 'reviewer-a',
        }),
      'REVIEW_DECISION_CHAIR_REQUIRED',
    ],
    [
      'stale question evidence',
      (fixture: ReturnType<typeof completeDecisionFixture>) =>
        fixture.decisionFor('eligible-for-reviewed', {
          questionHash: '0'.repeat(64),
        }),
      'REVIEW_DECISION_STALE',
    ],
    [
      'bundle mismatch',
      (fixture: ReturnType<typeof completeDecisionFixture>) =>
        fixture.decisionFor('eligible-for-reviewed', {
          evidenceBundleHash: '0'.repeat(64),
        }),
      'REVIEW_DECISION_EVIDENCE_MISMATCH',
    ],
  ])('rejects %s', (_label, build, code) => {
    const fixture = completeDecisionFixture();
    expect(
      validateReviewDecisions({
        value: [build(fixture)],
        bundle: fixture.bundle,
        manifest: fixture.manifest,
        context: reviewTestContext,
      }).issues.map((issue) => issue.code),
    ).toContain(code);
  });

  it('rejects duplicate stable decision IDs', () => {
    const fixture = completeDecisionFixture();
    expect(
      validateReviewDecisions({
        value: [fixture.baseDecision, fixture.baseDecision],
        bundle: fixture.bundle,
        manifest: fixture.manifest,
        context: reviewTestContext,
      }).issues.map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_ID_DUPLICATE');
  });

  it('rejects duplicate, unrelated, open, and incomplete resolvedIssueIds', () => {
    const manifest = syntheticCampaign();
    const firstQuestion = manifest.questions[0].questionId;
    const secondQuestion = manifest.questions[1].questionId;
    const packs = ['reviewer-a', 'reviewer-b', 'reviewer-c'].map(
      (reviewerId, reviewerIndex) => ({
        name: `${reviewerId}.csv`,
        csv:
          reviewerIndex === 0
            ? campaignRowsToCsv(
                campaignReviewRows(
                  manifest,
                  reviewTestContext.bank,
                  reviewerId,
                ).map((row) => ({
                  ...row,
                  rating: '5',
                  comment:
                    row.questionId === firstQuestion &&
                    row.criterion === 'clarity'
                      ? 'Synthetic comment.'
                      : '',
                })),
              )
            : reviewerCsv(reviewerId, { manifest, rating: '5' }),
      }),
    );
    const merged = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs,
    }).merged!;
    const analysis = analyzeReviewCampaign({
      manifest,
      merged,
      policy: reviewTestContext.policy,
    });
    const commentIssue = analysis.questions
      .flatMap((question) => question.issues)
      .find((issue) => issue.code === 'REVIEWER_COMMENT')!;
    const resolutionValidation = validateIssueResolutions({
      value: [
        {
          schemaVersion: 1,
          issueId: commentIssue.id,
          status: 'resolved',
          resolution: 'Synthetic resolution.',
          resolvedBy: 'reviewer-c',
          resolvedAt: '2000-01-02T00:00:00.000Z',
        },
      ],
      issues: analysis.questions.flatMap((question) => question.issues),
      manifest,
    });
    const bundle = createEvidenceBundle({
      manifest,
      merged,
      resolutions: resolutionValidation.resolutions,
      policy: reviewTestContext.policy,
    });
    const second = manifest.questions[1];
    const unrelated = {
      schemaVersion: 1 as const,
      campaignId: manifest.id,
      campaignHash: manifest.campaignHash,
      questionId: secondQuestion,
      questionVersion: second.questionVersion,
      questionHash: second.questionHash,
      evidenceBundleHash: bundle.hash,
      decision: 'eligible-for-reviewed' as const,
      decidedBy: 'reviewer-c',
      decidedAt: '2000-01-03T00:00:00.000Z',
      rationale: 'Synthetic unrelated issue test.',
      resolvedIssueIds: [commentIssue.id],
    };
    const decision = {
      ...unrelated,
      id: stableDecisionId(unrelated),
    };
    expect(
      validateReviewDecisions({
        value: [{ ...decision, resolvedIssueIds: [commentIssue.id, commentIssue.id] }],
        bundle,
        manifest,
        context: reviewTestContext,
      }).issues.map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_ISSUE_DUPLICATE');
    expect(
      validateReviewDecisions({
        value: [decision],
        bundle,
        manifest,
        context: reviewTestContext,
      }).issues.map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_ISSUE_INVALID');
  });
});
