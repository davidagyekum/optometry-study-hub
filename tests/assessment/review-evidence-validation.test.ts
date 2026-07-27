import { describe, expect, it } from 'vitest';
import {
  createEvidenceBundle,
  validateEvidenceBundle,
  validateReviewDecisions,
} from '@/lib/assessment/review/reviewDecisions';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import { validateIssueResolutions } from '@/lib/assessment/review/issueResolutions';
import { completeDecisionFixture } from './reviewDecisionFixtures';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

function commentBundle() {
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
            questionId: manifest.questions[0].questionId,
            criterion: 'clarity',
            comment: 'Synthetic evidence comment.',
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
  const issue = analysis.questions
    .flatMap((question) => question.issues)
    .find((entry) => entry.code === 'REVIEWER_COMMENT')!;
  const resolutionValidation = validateIssueResolutions({
    value: [
      {
        schemaVersion: 1,
        issueId: issue.id,
        status: 'resolved',
        resolution: 'Synthetic resolution.',
        resolvedBy: 'reviewer-c',
        resolvedAt: '2000-01-02T00:00:00.000Z',
      },
    ],
    issues: analysis.questions.flatMap((question) => question.issues),
    manifest,
  });
  return {
    manifest,
    issue,
    bundle: createEvidenceBundle({
      manifest,
      merged,
      resolutions: resolutionValidation.resolutions,
      policy: reviewTestContext.policy,
    }),
  };
}

describe('self-verifying evidence bundles', () => {
  it.each([
    [
      'modified submissions',
      (bundle: ReturnType<typeof completeDecisionFixture>['bundle']) => ({
        ...bundle,
        merged: {
          ...bundle.merged,
          submissions: bundle.merged.submissions.map((row, index) =>
            index === 0 ? { ...row, rating: 4 } : row,
          ),
        },
      }),
    ],
    [
      'duplicate rows',
      (bundle: ReturnType<typeof completeDecisionFixture>['bundle']) => ({
        ...bundle,
        merged: {
          ...bundle.merged,
          submissions: [
            ...bundle.merged.submissions,
            bundle.merged.submissions[0],
          ],
        },
      }),
    ],
    [
      'changed analysis state',
      (bundle: ReturnType<typeof completeDecisionFixture>['bundle']) => ({
        ...bundle,
        analysis: {
          ...bundle.analysis,
          questions: bundle.analysis.questions.map((question, index) =>
            index === 0 ? { ...question, state: 'incomplete' as const } : question,
          ),
        },
      }),
    ],
  ])('rejects %s with an unchanged bundle hash', (_label, mutate) => {
    const fixture = completeDecisionFixture();
    const result = validateEvidenceBundle({
      value: mutate(structuredClone(fixture.bundle)),
      manifest: fixture.manifest,
      context: reviewTestContext,
    });
    expect(result.bundle).toBeUndefined();
    expect(result.issues.length).toBeGreaterThan(0);
    expect(
      validateReviewDecisions({
        value: [fixture.baseDecision],
        bundle: mutate(structuredClone(fixture.bundle)) as never,
        manifest: fixture.manifest,
        context: reviewTestContext,
      }).issues.map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_EVIDENCE_INVALID');
  });

  it('rejects removed issues and altered resolutions', () => {
    const fixture = commentBundle();
    const removedIssue = {
      ...fixture.bundle,
      issues: [],
    };
    const alteredResolution = {
      ...fixture.bundle,
      resolutions: fixture.bundle.resolutions.map((resolution) => ({
        ...resolution,
        resolution: 'Altered without changing the hash.',
      })),
    };
    for (const value of [removedIssue, alteredResolution]) {
      expect(
        validateEvidenceBundle({
          value,
          manifest: fixture.manifest,
          context: reviewTestContext,
        }).issues.map((issue) => issue.code),
      ).toContain('EVIDENCE_BUNDLE_MISMATCH');
    }
  });

  it('rejects a forged ready-for-human-decision analysis', () => {
    const manifest = syntheticCampaign();
    const merged = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: ['reviewer-a', 'reviewer-b'].map((reviewerId) => ({
        name: `${reviewerId}.csv`,
        csv: reviewerCsv(reviewerId, { manifest, rating: '5' }),
      })),
    }).merged!;
    const bundle = createEvidenceBundle({
      manifest,
      merged,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    const forged = {
      ...bundle,
      analysis: {
        ...bundle.analysis,
        questions: bundle.analysis.questions.map((question) => ({
          ...question,
          state: 'ready-for-human-decision' as const,
        })),
        summary: {
          ...bundle.analysis.summary,
          incomplete: 0,
          readyForHumanDecision: 36,
        },
      },
    };
    expect(
      validateEvidenceBundle({
        value: forged,
        manifest,
        context: reviewTestContext,
      }).issues.map((issue) => issue.code),
    ).toContain('EVIDENCE_BUNDLE_MISMATCH');
  });
});
