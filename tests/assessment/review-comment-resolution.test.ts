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
          rating: '5',
          commentAt: {
            questionId: 'aqueous-angle-sba-001',
            criterion: 'clarity',
            comment: 'Synthetic comment requiring discussion.',
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
  return { manifest, merged, analysis };
}

describe('review issue resolutions', () => {
  it('generates deterministic open templates and makes readiness explicit after resolution', () => {
    const { manifest, analysis } = commentAnalysis();
    const issues = analysis.questions.flatMap((question) => question.issues);
    const template = openResolutionTemplate(issues);
    expect(template.every((resolution) => resolution.status === 'open')).toBe(true);
    const resolved = template.map((resolution) => ({
      ...resolution,
      status: 'resolved' as const,
      resolution: 'Synthetic fixture resolution.',
      resolvedBy: 'reviewer-c',
      resolvedAt: '2000-01-02T00:00:00.000Z',
    }));
    const validated = validateIssueResolutions({ value: resolved, issues, manifest });
    expect(validated.issues).toEqual([]);
    expect(
      applyReviewResolutions(analysis, validated.resolutions).questions.find(
        (question) => question.questionId === 'aqueous-angle-sba-001',
      )?.state,
    ).toBe('ready-for-human-decision');
  });

  it.each([
    ['missing rationale', (issueId: string) => [{ schemaVersion: 1, issueId, status: 'resolved', resolvedBy: 'reviewer-c', resolvedAt: '2000-01-02T00:00:00.000Z' }], 'REVIEW_RESOLUTION_DETAILS_REQUIRED'],
    ['unknown issue', () => [{ schemaVersion: 1, issueId: 'unknown-issue', status: 'open' }], 'REVIEW_RESOLUTION_ISSUE_UNKNOWN'],
    ['duplicate issue', (issueId: string) => [{ schemaVersion: 1, issueId, status: 'open' }, { schemaVersion: 1, issueId, status: 'open' }], 'REVIEW_RESOLUTION_DUPLICATE'],
    ['unauthorized resolver', (issueId: string) => [{ schemaVersion: 1, issueId, status: 'resolved', resolution: 'Synthetic.', resolvedBy: 'outsider', resolvedAt: '2000-01-02T00:00:00.000Z' }], 'REVIEW_RESOLUTION_RESOLVER_UNAUTHORIZED'],
  ])('rejects %s', (_label, build, code) => {
    const { manifest, analysis } = commentAnalysis();
    const issues = analysis.questions.flatMap((question) => question.issues);
    expect(
      validateIssueResolutions({
        value: build(issues[0].id),
        issues,
        manifest,
      }).issues.map((issue) => issue.code),
    ).toContain(code);
  });

  it('changes the evidence-bundle hash when a resolution changes', () => {
    const { manifest, merged, analysis } = commentAnalysis();
    const issue = analysis.questions.flatMap((question) => question.issues)[0];
    const first = createEvidenceBundle({
      manifest,
      submissions: merged.submissions,
      analysis,
      resolutions: [{ schemaVersion: 1, issueId: issue.id, status: 'open' }],
      policy: reviewTestContext.policy,
    });
    const second = createEvidenceBundle({
      manifest,
      submissions: merged.submissions,
      analysis,
      resolutions: [{
        schemaVersion: 1,
        issueId: issue.id,
        status: 'resolved',
        resolution: 'Synthetic resolution.',
        resolvedBy: 'reviewer-c',
        resolvedAt: '2000-01-02T00:00:00.000Z',
      }],
      policy: reviewTestContext.policy,
    });
    expect(second.hash).not.toBe(first.hash);
  });
});
