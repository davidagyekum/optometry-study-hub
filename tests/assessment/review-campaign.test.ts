import { describe, expect, it } from 'vitest';
import { aqueousVitreousReviewPolicy } from '@/content/question-bank/opt376/aqueous-vitreous/reviewPolicy';
import {
  createReviewCampaignManifest,
  reviewBankHash,
  validateReviewCampaignManifest,
} from '@/lib/assessment/review/campaignManifest';
import { validateContentReviewPolicy } from '@/lib/assessment/review/policyValidation';
import {
  reviewTestContext,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

describe('review policy', () => {
  it('uses the immutable versioned project policy without claiming universal validity', () => {
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
      'REVIEW_POLICY_CRITERION_NOT_APPLICABLE',
    ],
  ])('rejects invalid policy data', (policy, code) => {
    expect(validateContentReviewPolicy(policy).issues.map((issue) => issue.code)).toContain(code);
  });
});

describe('review campaign manifest', () => {
  it('produces deterministic bank and campaign evidence with an injected timestamp', () => {
    const firstHash = reviewBankHash(
      reviewTestContext.bank,
      reviewTestContext.blueprint,
      reviewTestContext.policy,
    );
    const secondHash = reviewBankHash(
      reviewTestContext.bank,
      reviewTestContext.blueprint,
      reviewTestContext.policy,
    );
    expect(firstHash).toBe(secondHash);
    expect(syntheticCampaign()).toEqual(syntheticCampaign());
    expect(syntheticCampaign().questions).toHaveLength(36);
  });

  it.each([
    ['stale hash', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, bankHash: '0'.repeat(64) }), 'REVIEW_CAMPAIGN_BANK_STALE'],
    ['wrong policy', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, policy: { ...manifest.policy, version: 2 } }), 'REVIEW_CAMPAIGN_POLICY_MISMATCH'],
    ['missing question', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, questions: manifest.questions.slice(1) }), 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH'],
    ['extra question', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, questions: [...manifest.questions, manifest.questions[0]] }), 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH'],
    ['wrong version', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, questions: manifest.questions.map((question, index) => index === 0 ? { ...question, questionVersion: 2 } : question) }), 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH'],
    ['wrong hash', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, questions: manifest.questions.map((question, index) => index === 0 ? { ...question, questionHash: '0'.repeat(64) } : question) }), 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH'],
    ['wrong criteria', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, questions: manifest.questions.map((question, index) => index === 0 ? { ...question, applicableCriteria: ['clarity'] } : question) }), 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH'],
    ['duplicate reviewer', (manifest: ReturnType<typeof syntheticCampaign>) => ({ ...manifest, reviewers: [...manifest.reviewers, manifest.reviewers[0]] }), 'REVIEWER_ID_DUPLICATE'],
  ])('detects %s', (_label, mutate, code) => {
    expect(
      validateReviewCampaignManifest(mutate(syntheticCampaign()), reviewTestContext).issues.map(
        (issue) => issue.code,
      ),
    ).toContain(code);
  });

  it('does not use the current clock when a timestamp is supplied', () => {
    const manifest = createReviewCampaignManifest({
      campaignId: 'fixed-campaign',
      createdAt: '2000-01-01T00:00:00.000Z',
      ...reviewTestContext,
      reviewers: syntheticReviewers,
    });
    expect(manifest.createdAt).toBe('2000-01-01T00:00:00.000Z');
  });
});
