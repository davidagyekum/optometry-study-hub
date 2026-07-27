import { describe, expect, it } from 'vitest';
import { createEvidenceBundle } from '@/lib/assessment/review/reviewDecisions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import { completeDecisionFixture } from './reviewDecisionFixtures';
import {
  rebuildValidatedMerged,
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
} from './reviewTestFixtures';

describe('review evidence-bundle hashing', () => {
  it('changes for rating, comment, and complete policy/campaign changes', () => {
    const fixture = completeDecisionFixture();
    const withRating = rebuildValidatedMerged(
      fixture.manifest,
      fixture.merged.submissions.map((submission, index) =>
        index === 0 ? { ...submission, rating: 4 } : submission,
      ),
    );
    const ratingBundle = createEvidenceBundle({
      manifest: fixture.manifest,
      merged: withRating,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    expect(ratingBundle.hash).not.toBe(fixture.bundle.hash);

    const withComment = rebuildValidatedMerged(
      fixture.manifest,
      fixture.merged.submissions.map((submission, index) =>
        index === 0
          ? { ...submission, comment: 'Synthetic hash-change comment.' }
          : submission,
      ),
    );
    const commentBundle = createEvidenceBundle({
      manifest: fixture.manifest,
      merged: withComment,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    expect(commentBundle.hash).not.toBe(fixture.bundle.hash);

    const changedPolicy = {
      ...reviewTestContext.policy,
      flagBelowAikenV: 0.81,
    };
    const changedManifest = syntheticCampaign(undefined, {
      policy: changedPolicy as typeof reviewTestContext.policy,
    });
    const changedMerged = mergeReviewerPacks({
      manifest: changedManifest,
      bank: reviewTestContext.bank,
      packs: ['reviewer-a', 'reviewer-b', 'reviewer-c'].map((reviewerId) => ({
        name: `${reviewerId}.csv`,
        csv: reviewerCsv(reviewerId, {
          manifest: changedManifest,
          rating: '5',
        }),
      })),
    }).merged!;
    const policyBundle = createEvidenceBundle({
      manifest: changedManifest,
      merged: changedMerged,
      resolutions: [],
      policy: changedPolicy,
    });
    expect(policyBundle.hash).not.toBe(fixture.bundle.hash);
  });
});
