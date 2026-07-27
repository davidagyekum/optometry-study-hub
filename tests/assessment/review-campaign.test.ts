import { describe, expect, it } from 'vitest';
import { aqueousVitreousReviewPolicy } from '@/content/question-bank/opt376/aqueous-vitreous/reviewPolicy';
import {
  createReviewCampaignManifest,
  reviewBankHash,
  reviewCampaignHash,
  reviewPolicyHash,
  validateCampaignDirectoryManifest,
  validateReviewCampaignManifest,
} from '@/lib/assessment/review/campaignManifest';
import { validateContentReviewPolicy } from '@/lib/assessment/review/policyValidation';
import {
  reviewTestContext,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

describe('review policy', () => {
  it('uses the immutable exact project criterion policy', () => {
    expect(validateContentReviewPolicy(aqueousVitreousReviewPolicy).issues).toEqual([]);
    expect(aqueousVitreousReviewPolicy).toMatchObject({
      id: 'opt376-expert-review',
      version: 1,
      minimumUniqueReviewers: 3,
      flagBelowAikenV: 0.8,
      lowRatingAtOrBelow: 2,
    });
    expect(Object.isFrozen(aqueousVitreousReviewPolicy)).toBe(true);
  });

  it.each([
    [{ ...aqueousVitreousReviewPolicy, id: 'Bad ID' }, 'REVIEW_POLICY_INVALID'],
    [{ ...aqueousVitreousReviewPolicy, version: 0 }, 'REVIEW_POLICY_INVALID'],
    [
      { ...aqueousVitreousReviewPolicy, minimumUniqueReviewers: 0 },
      'REVIEW_POLICY_INVALID',
    ],
    [{ ...aqueousVitreousReviewPolicy, flagBelowAikenV: 2 }, 'REVIEW_POLICY_INVALID'],
    [
      {
        ...aqueousVitreousReviewPolicy,
        requiredUniversalCriteria: ['clarity', 'clarity'],
      },
      'REVIEW_POLICY_DUPLICATE_CRITERION',
    ],
    [
      {
        ...aqueousVitreousReviewPolicy,
        requiredFormatCriteria: {
          ...aqueousVitreousReviewPolicy.requiredFormatCriteria,
          short_answer: ['image-rights'],
        },
      },
      'REVIEW_POLICY_FORMAT_CRITERIA_MISMATCH',
    ],
  ])('rejects invalid policy data', (policy, code) => {
    expect(validateContentReviewPolicy(policy).issues.map((issue) => issue.code)).toContain(code);
  });
});

describe('review campaign manifest', () => {
  it('binds normalized reviewers, the full policy, timestamp, bank, and ordered matrix', () => {
    const manifest = syntheticCampaign();
    expect(manifest.campaignHash).toBe(
      reviewCampaignHash({
        schemaVersion: manifest.schemaVersion,
        id: manifest.id,
        bankId: manifest.bankId,
        bankHash: manifest.bankHash,
        policy: manifest.policy,
        policyHash: manifest.policyHash,
        createdAt: manifest.createdAt,
        questions: manifest.questions,
        reviewers: manifest.reviewers,
      }),
    );
    expect(manifest.policyHash).toBe(reviewPolicyHash(reviewTestContext.policy));
    expect(manifest.questions).toHaveLength(36);
    expect(manifest.reviewers.map((reviewer) => reviewer.id)).toEqual([
      'reviewer-a',
      'reviewer-b',
      'reviewer-c',
    ]);
    expect(
      reviewBankHash(
        reviewTestContext.bank,
        reviewTestContext.blueprint,
        reviewTestContext.policy,
      ),
    ).toBe(manifest.bankHash);
  });

  it.each([
    ['bank hash', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, bankHash: '0'.repeat(64) }), 'REVIEW_CAMPAIGN_BANK_STALE'],
    ['policy identity', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, policy: { ...manifest.policy, version: 2 } }), 'REVIEW_CAMPAIGN_POLICY_MISMATCH'],
    ['policy hash', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, policyHash: '0'.repeat(64) }), 'REVIEW_CAMPAIGN_POLICY_STALE'],
    ['createdAt', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, createdAt: '2001-01-01T00:00:00.000Z' }), 'REVIEW_CAMPAIGN_HASH_MISMATCH'],
    ['question matrix', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, questions: manifest.questions.slice(1) }), 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH'],
    ['reviewer independence', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, reviewers: manifest.reviewers.map((reviewer, index) => index === 0 ? { ...reviewer, independentReviewAttestation: false, conflictOfInterest: { status: 'declared' as const, description: 'Synthetic.' } } : reviewer) }), 'REVIEW_CAMPAIGN_HASH_MISMATCH'],
    ['reviewer conflict', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, reviewers: manifest.reviewers.map((reviewer, index) => index === 0 ? { ...reviewer, conflictOfInterest: { status: 'declared' as const, description: 'Synthetic.' } } : reviewer) }), 'REVIEW_CAMPAIGN_HASH_MISMATCH'],
    ['reviewer roles', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, reviewers: manifest.reviewers.map((reviewer, index) => index === 0 ? { ...reviewer, roles: ['assessment-reviewer' as const] } : reviewer) }), 'REVIEW_CAMPAIGN_HASH_MISMATCH'],
    ['reviewer consent', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, reviewers: manifest.reviewers.map((reviewer, index) => index === 0 ? { ...reviewer, consentToAttribution: true } : reviewer) }), 'REVIEW_CAMPAIGN_HASH_MISMATCH'],
  ])('detects mutated %s without a new campaign', (_label, mutate, code) => {
    expect(
      validateReviewCampaignManifest(mutate(syntheticCampaign()), reviewTestContext)
        .issues.map((issue) => issue.code),
    ).toContain(code);
  });

  it('refuses to overwrite a campaign directory with different immutable evidence', () => {
    const original = syntheticCampaign();
    const changed = syntheticCampaign(undefined, {
      createdAt: '2001-01-01T00:00:00.000Z',
    });
    expect(validateCampaignDirectoryManifest(original, original)).toEqual([]);
    expect(
      validateCampaignDirectoryManifest(original, changed).map(
        (issue) => issue.code,
      ),
    ).toContain('REVIEW_CAMPAIGN_DIRECTORY_CONFLICT');
  });

  it('changes campaign hashes for policy or reviewer evidence changes', () => {
    const changedPolicy = {
      ...reviewTestContext.policy,
      flagBelowAikenV: 0.81,
    };
    const policyCampaign = createReviewCampaignManifest({
      campaignId: 'test-aqueous-review',
      createdAt: '2000-01-01T00:00:00.000Z',
      bank: reviewTestContext.bank,
      blueprint: reviewTestContext.blueprint,
      policy: changedPolicy,
      reviewers: syntheticReviewers,
    });
    const roleCampaign = createReviewCampaignManifest({
      campaignId: 'test-aqueous-review',
      createdAt: '2000-01-01T00:00:00.000Z',
      ...reviewTestContext,
      reviewers: syntheticReviewers.map((reviewer, index) =>
        index === 0
          ? { ...reviewer, roles: ['assessment-reviewer'] }
          : reviewer,
      ),
    });
    expect(policyCampaign.campaignHash).not.toBe(syntheticCampaign().campaignHash);
    expect(roleCampaign.campaignHash).not.toBe(syntheticCampaign().campaignHash);
  });
});
