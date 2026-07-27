import { describe, expect, it } from 'vitest';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import {
  openResolutionTemplate,
  validateIssueResolutions,
} from '@/lib/assessment/review/issueResolutions';
import { applyReviewResolutions } from '@/lib/assessment/review/readiness';
import { createEvidenceBundle } from '@/lib/assessment/review/reviewDecisions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

function commentAnalysis() {
  const manifest = syntheticCampaign();
  const merged = mergeReviewerPacks({
    manifest,
    bank: reviewTestContext.bank,
    packs: [
      {
        name: 'reviewer-a.csv',
        csv: reviewerCsv('reviewer-a', {
          manifest,
          rating: '5',
          commentAt: {
            questionId: 'aqueous-angle-sba-001',
            criterion: 'clarity',
            comment: 'Synthetic comment requiring discussion.',
          },
        }),
      },
      {
        name: 'reviewer-b.csv',
        csv: reviewerCsv('reviewer-b', { manifest, rating: '5' }),
      },
      {
        name: 'reviewer-c.csv',
        csv: reviewerCsv('reviewer-c', { manifest, rating: '5' }),
      },
    ],
  }).merged!;
  const analysis = analyzeReviewCampaign({
    manifest,
    merged,
    policy: reviewTestContext.policy,
  });
  return { manifest, merged, analysis };
}

describe('review issue resolutions', () => {
  it('preserves supplied resolutions in regenerated templates and readiness', () => {
    const { manifest, analysis } = commentAnalysis();
    const issues = analysis.questions.flatMap((question) => question.issues);
    const commentIssue = issues.find((issue) => issue.code === 'REVIEWER_COMMENT')!;
    const resolved = {
      schemaVersion: 1 as const,
      issueId: commentIssue.id,
      status: 'resolved' as const,
      resolution: 'Synthetic fixture resolution.',
      resolvedBy: 'reviewer-c',
      resolvedAt: '2000-01-02T00:00:00.000Z',
    };
    const validated = validateIssueResolutions({
      value: [resolved],
      issues,
      manifest,
    });
    expect(validated.issues).toEqual([]);
    expect(openResolutionTemplate(issues, validated.resolutions)).toContainEqual(
      resolved,
    );
    expect(
      applyReviewResolutions(analysis, validated.resolutions).questions.find(
        (question) => question.questionId === 'aqueous-angle-sba-001',
      )?.state,
    ).toBe('ready-for-human-decision');
  });

  it('changes the evidence-bundle hash when a valid resolution changes', () => {
    const { manifest, merged, analysis } = commentAnalysis();
    const issue = analysis.questions
      .flatMap((question) => question.issues)
      .find((entry) => entry.code === 'REVIEWER_COMMENT')!;
    const first = createEvidenceBundle({
      manifest,
      merged,
      resolutions: [{ schemaVersion: 1, issueId: issue.id, status: 'open' }],
      policy: reviewTestContext.policy,
    });
    const second = createEvidenceBundle({
      manifest,
      merged,
      resolutions: [
        {
          schemaVersion: 1,
          issueId: issue.id,
          status: 'resolved',
          resolution: 'Synthetic resolution.',
          resolvedBy: 'reviewer-c',
          resolvedAt: '2000-01-02T00:00:00.000Z',
        },
      ],
      policy: reviewTestContext.policy,
    });
    expect(second.hash).not.toBe(first.hash);
  });
});
