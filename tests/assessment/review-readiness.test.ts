import { describe, expect, it } from 'vitest';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import {
  validateIssueResolutions,
} from '@/lib/assessment/review/issueResolutions';
import { applyReviewResolutions } from '@/lib/assessment/review/readiness';
import type { ReviewerProfile } from '@/lib/assessment/review/campaignTypes';
import {
  emptyValidatedMerged,
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

function mergedFor(
  reviewers: ReviewerProfile[],
  rowRating: (
    row: { questionId: string; criterion: string },
    reviewerId: string,
  ) => string = () => '5',
) {
  const manifest = syntheticCampaign(reviewers);
  const merged = mergeReviewerPacks({
    manifest,
    bank: reviewTestContext.bank,
    packs: reviewers.map((reviewer) => ({
      name: `${reviewer.id}.csv`,
      csv: reviewerCsv(reviewer.id, {
        manifest,
        rowRating: (row) => rowRating(row, reviewer.id),
      }),
    })),
  });
  expect(merged.issues).toEqual([]);
  return { manifest, merged: merged.merged! };
}

describe('review analysis and readiness', () => {
  it.each([0, 1, 2, 3])(
    'reports deterministic independent readiness for %i reviewers',
    (count) => {
      const input =
        count === 0
          ? {
              manifest: syntheticCampaign(),
              merged: emptyValidatedMerged(),
            }
          : mergedFor(syntheticReviewers.slice(0, count));
      const analysis = analyzeReviewCampaign({
        ...input,
        policy: reviewTestContext.policy,
      });
      expect(analysis.questions).toHaveLength(36);
      if (count === 0) {
        expect(analysis.summary.notStarted).toBe(36);
      } else if (count < 3) {
        expect(analysis.summary.incomplete).toBe(36);
        expect(
          analysis.questions[0].issues.some(
            (issue) => issue.code === 'INSUFFICIENT_REVIEWERS',
          ),
        ).toBe(true);
      } else {
        expect(analysis.summary.readyForHumanDecision).toBe(36);
        expect(analysis.questions.every((question) => question.issues.length === 0)).toBe(true);
      }
    },
  );

  it('uses independent Aiken values while retaining all-reviewer diagnostics', () => {
    const conflicted: ReviewerProfile = {
      ...syntheticReviewers[2],
      independentReviewAttestation: false,
      conflictOfInterest: {
        status: 'declared',
        description: 'Synthetic conflict.',
      },
    };
    const { manifest, merged } = mergedFor(
      [syntheticReviewers[0], syntheticReviewers[1], conflicted],
      () => '5',
    );
    const analysis = analyzeReviewCampaign({
      manifest,
      merged,
      policy: reviewTestContext.policy,
    });
    const first = analysis.questions[0];
    expect(first.coverage.fullyCoveredCriteria).toBe(first.coverage.applicableCriteria);
    expect(first.coverage.independentlyCoveredCriteria).toBe(0);
    expect(first.criterionValues[0].reviewerCount).toBe(2);
    expect(first.allReviewerCriterionValues[0].reviewerCount).toBe(3);
    expect(analysis.summary.incomplete).toBe(36);
  });

  it('keeps three conflicted or non-independent reviewers incomplete', () => {
    const reviewers = syntheticReviewers.map((reviewer, index) => ({
      ...reviewer,
      independentReviewAttestation: false,
      conflictOfInterest: {
        status: 'declared' as const,
        description: `Synthetic conflict ${index + 1}.`,
      },
    }));
    const { manifest, merged } = mergedFor(reviewers);
    const analysis = analyzeReviewCampaign({
      manifest,
      merged,
      policy: reviewTestContext.policy,
    });
    expect(analysis.summary.reviewerCoverage.independentReviewers).toBe(0);
    expect(analysis.summary.incomplete).toBe(36);
    expect(analysis.summary.readyForHumanDecision).toBe(0);
  });

  it('does not let a resolution waive insufficient independent coverage', () => {
    const { manifest, merged } = mergedFor(syntheticReviewers.slice(0, 2));
    const analysis = analyzeReviewCampaign({
      manifest,
      merged,
      policy: reviewTestContext.policy,
    });
    const issue = analysis.questions[0].issues.find(
      (entry) => entry.code === 'INSUFFICIENT_REVIEWERS',
    )!;
    const attempted = {
      schemaVersion: 1 as const,
      issueId: issue.id,
      status: 'resolved' as const,
      resolution: 'Synthetic attempted waiver.',
      resolvedBy: 'reviewer-a',
      resolvedAt: '2000-01-02T00:00:00.000Z',
    };
    expect(
      validateIssueResolutions({
        value: [attempted],
        issues: analysis.questions.flatMap((question) => question.issues),
        manifest,
      }).issues.map((entry) => entry.code),
    ).toContain('REVIEW_RESOLUTION_EVIDENCE_NON_WAIVABLE');
    expect(applyReviewResolutions(analysis, [attempted]).summary.incomplete).toBe(36);
  });

  it('keeps blocking evidence unresolved when marked accepted-for-discussion', () => {
    const { manifest, merged } = mergedFor(
      syntheticReviewers,
      (row, reviewerId) =>
        row.questionId === 'aqueous-angle-sba-001' &&
        row.criterion === 'factual-accuracy' &&
        reviewerId === 'reviewer-a'
          ? '1'
          : '5',
    );
    const analysis = analyzeReviewCampaign({
      manifest,
      merged,
      policy: reviewTestContext.policy,
    });
    const issue = analysis.questions
      .flatMap((question) => question.issues)
      .find((entry) => entry.code === 'FACTUAL_ACCURACY_CONCERN')!;
    const attempted = {
      schemaVersion: 1 as const,
      issueId: issue.id,
      status: 'accepted-for-discussion' as const,
      resolution: 'Synthetic discussion only.',
      resolvedBy: 'reviewer-c',
      resolvedAt: '2000-01-02T00:00:00.000Z',
    };
    const validation = validateIssueResolutions({
      value: [attempted],
      issues: analysis.questions.flatMap((question) => question.issues),
      manifest,
    });
    expect(validation.issues.map((entry) => entry.code)).toContain(
      'REVIEW_RESOLUTION_BLOCKING_DISCUSSION_ONLY',
    );
    expect(
      applyReviewResolutions(analysis, [attempted]).questions.find(
        (question) => question.questionId === 'aqueous-angle-sba-001',
      )?.state,
    ).toBe('requires-resolution');
  });
});
