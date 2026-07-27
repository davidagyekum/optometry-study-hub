import { describe, expect, it } from 'vitest';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import { createEvidenceBundle } from '@/lib/assessment/review/reviewDecisions';
import { completeDecisionFixture } from './reviewDecisionFixtures';
import { reviewTestContext } from './reviewTestFixtures';

describe('review evidence-bundle hashing', () => {
  it('changes for rating, comment, and policy changes', () => {
    const fixture = completeDecisionFixture();
    const withRating = fixture.merged.submissions.map((submission, index) =>
      index === 0 ? { ...submission, rating: 4 } : submission,
    );
    const ratingAnalysis = analyzeReviewCampaign({
      manifest: fixture.manifest,
      submissions: withRating,
      policy: reviewTestContext.policy,
    });
    const ratingBundle = createEvidenceBundle({
      manifest: fixture.manifest,
      submissions: withRating,
      analysis: ratingAnalysis,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    expect(ratingBundle.hash).not.toBe(fixture.bundle.hash);

    const withComment = fixture.merged.submissions.map((submission, index) =>
      index === 0
        ? { ...submission, comment: 'Synthetic hash-change comment.' }
        : submission,
    );
    const commentAnalysis = analyzeReviewCampaign({
      manifest: fixture.manifest,
      submissions: withComment,
      policy: reviewTestContext.policy,
    });
    const commentBundle = createEvidenceBundle({
      manifest: fixture.manifest,
      submissions: withComment,
      analysis: commentAnalysis,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    expect(commentBundle.hash).not.toBe(fixture.bundle.hash);

    const changedPolicy = {
      ...reviewTestContext.policy,
      flagBelowAikenV: 0.81,
    };
    const policyAnalysis = analyzeReviewCampaign({
      manifest: fixture.manifest,
      submissions: fixture.merged.submissions,
      policy: changedPolicy,
    });
    const policyBundle = createEvidenceBundle({
      manifest: fixture.manifest,
      submissions: fixture.merged.submissions,
      analysis: policyAnalysis,
      resolutions: [],
      policy: changedPolicy,
    });
    expect(policyBundle.hash).not.toBe(fixture.bundle.hash);
  });
});
