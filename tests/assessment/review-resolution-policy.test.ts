import { describe, expect, it } from 'vitest';
import {
  validateIssueResolutions,
} from '@/lib/assessment/review/issueResolutions';
import type { StableReviewIssue } from '@/lib/assessment/review/campaignTypes';
import { syntheticCampaign } from './reviewTestFixtures';

const issue: StableReviewIssue = {
  schemaVersion: 1,
  id: 'factual-accuracy-concern-synthetic',
  campaignId: 'test-aqueous-review',
  questionId: 'aqueous-flow-sba-001',
  questionVersion: 1,
  questionHash: '0'.repeat(64),
  criterion: 'factual-accuracy',
  reviewerId: 'reviewer-a',
  code: 'FACTUAL_ACCURACY_CONCERN',
  severity: 'blocking',
  message: 'Synthetic factual-accuracy concern.',
  evidence: { rating: 2 },
};

describe('blocking review-resolution policy', () => {
  it('requires a review chair to mark factual accuracy not actionable', () => {
    const result = validateIssueResolutions({
      value: [
        {
          schemaVersion: 1,
          issueId: issue.id,
          status: 'not-actionable',
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
  });
});
