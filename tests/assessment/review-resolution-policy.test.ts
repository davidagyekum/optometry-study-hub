import { describe, expect, it } from 'vitest';
import { validateIssueResolutions } from '@/lib/assessment/review/issueResolutions';
import type { StableReviewIssue } from '@/lib/assessment/review/campaignTypes';
import { syntheticCampaign } from './reviewTestFixtures';

function issueFor(
  code: string,
  severity: StableReviewIssue['severity'] = 'blocking',
): StableReviewIssue {
  const manifest = syntheticCampaign();
  return {
    schemaVersion: 1,
    id: `${code.toLowerCase().replaceAll('_', '-')}-synthetic`,
    campaignId: manifest.id,
    campaignHash: manifest.campaignHash,
    questionId: 'aqueous-flow-sba-001',
    questionVersion: 1,
    questionHash: manifest.questions.find(
      (question) => question.questionId === 'aqueous-flow-sba-001',
    )!.questionHash,
    criterion: 'factual-accuracy',
    reviewerId: 'reviewer-a',
    code,
    severity,
    message: `Synthetic ${code}.`,
  };
}

describe('blocking review-resolution policy', () => {
  it('rejects resolver metadata on open resolutions and pre-campaign timestamps', () => {
    const issue = issueFor('REVIEWER_COMMENT', 'requires-discussion');
    const manifest = syntheticCampaign();
    expect(
      validateIssueResolutions({
        value: [
          {
            schemaVersion: 1,
            issueId: issue.id,
            status: 'open',
            resolution: 'Synthetic premature metadata.',
            resolvedBy: 'reviewer-c',
            resolvedAt: '2000-01-02T00:00:00.000Z',
          },
        ],
        issues: [issue],
        manifest,
      }).issues.map((entry) => entry.code),
    ).toContain('REVIEW_RESOLUTION_OPEN_METADATA_FORBIDDEN');
    expect(
      validateIssueResolutions({
        value: [
          {
            schemaVersion: 1,
            issueId: issue.id,
            status: 'resolved',
            resolution: 'Synthetic early closure.',
            resolvedBy: 'reviewer-c',
            resolvedAt: '1999-12-31T23:59:59.000Z',
          },
        ],
        issues: [issue],
        manifest,
      }).issues.map((entry) => entry.code),
    ).toContain('REVIEW_RESOLUTION_TIMESTAMP_BEFORE_CAMPAIGN');
  });

  it.each(['resolved', 'not-actionable'] as const)(
    'requires chair authority for factual-accuracy %s closure',
    (status) => {
      const issue = issueFor('FACTUAL_ACCURACY_CONCERN');
      const result = validateIssueResolutions({
        value: [
          {
            schemaVersion: 1,
            issueId: issue.id,
            status,
            resolution: 'Synthetic rationale.',
            resolvedBy: 'reviewer-a',
            resolvedAt: '2000-01-02T00:00:00.000Z',
          },
        ],
        issues: [issue],
        manifest: syntheticCampaign(),
      });
      expect(result.issues.map((entry) => entry.code)).toContain(
        'REVIEW_RESOLUTION_CHAIR_REQUIRED',
      );
    },
  );

  it.each([
    'NO_REVIEW_RATINGS',
    'MISSING_REQUIRED_CRITERION',
    'INSUFFICIENT_REVIEWERS',
    'STALE_REVIEW_EVIDENCE',
    'REVIEWER_INDEPENDENCE_NOT_ATTESTED',
  ])('does not allow textual closure of %s', (code) => {
    const issue = issueFor(code);
    const result = validateIssueResolutions({
      value: [
        {
          schemaVersion: 1,
          issueId: issue.id,
          status: 'resolved',
          resolution: 'Synthetic attempted waiver.',
          resolvedBy: 'reviewer-c',
          resolvedAt: '2000-01-02T00:00:00.000Z',
        },
      ],
      issues: [issue],
      manifest: syntheticCampaign(),
    });
    expect(result.issues.map((entry) => entry.code)).toContain(
      'REVIEW_RESOLUTION_EVIDENCE_NON_WAIVABLE',
    );
  });
});
