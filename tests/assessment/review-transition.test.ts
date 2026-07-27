import { describe, expect, it } from 'vitest';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import { verifyQuestionReviewTransition } from '@/lib/assessment/review/transitionVerification';
import {
  createEvidenceBundle,
  stableDecisionId,
} from '@/lib/assessment/review/reviewDecisions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import { completeDecisionFixture } from './reviewDecisionFixtures';
import {
  reviewTestContext,
  reviewerCsv,
  syntheticCampaign,
  syntheticReviewers,
} from './reviewTestFixtures';

function cloneQuestion(): AssessmentQuestion {
  return structuredClone(reviewTestContext.bank.questions[0]);
}

function exactInput(
  fixture: ReturnType<typeof completeDecisionFixture>,
  before: AssessmentQuestion,
  after: AssessmentQuestion,
  decision = fixture.baseDecision,
) {
  return {
    beforeQuestion: before,
    afterQuestion: after,
    decision,
    evidenceBundle: fixture.bundle,
    reviewContext: reviewTestContext,
  };
}

describe('question review-status transition verification', () => {
  it('allows unchanged draft state and rejects changed stable IDs or version regression', () => {
    const before = cloneQuestion();
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: structuredClone(before),
      }),
    ).toEqual([]);
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: { ...before, id: 'changed-stable-id' },
      }).map((issue) => issue.code),
    ).toContain('QUESTION_ID_CHANGED');
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: { ...before, version: 2 },
        afterQuestion: { ...before, version: 1 },
      }).map((issue) => issue.code),
    ).toContain('QUESTION_VERSION_REGRESSION');
  });

  it('supports an exact consent-aware draft-to-reviewed transition', () => {
    const fixture = completeDecisionFixture({ consentedAttribution: true });
    const before = cloneQuestion();
    const after = {
      ...structuredClone(before),
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-a',
    };
    expect(
      verifyQuestionReviewTransition(exactInput(fixture, before, after)),
    ).toEqual([]);
  });

  it.each([
    [
      'wrong campaign',
      (fixture: ReturnType<typeof completeDecisionFixture>) =>
        fixture.decisionFor('eligible-for-reviewed', {
          campaignId: 'wrong-campaign',
        }),
    ],
    [
      'wrong question hash',
      (fixture: ReturnType<typeof completeDecisionFixture>) =>
        fixture.decisionFor('eligible-for-reviewed', {
          questionHash: '0'.repeat(64),
        }),
    ],
    [
      'arbitrary decision ID',
      (fixture: ReturnType<typeof completeDecisionFixture>) => ({
        ...fixture.baseDecision,
        id: 'decision-arbitrary',
      }),
    ],
  ])('rejects %s', (_label, decisionFor) => {
    const fixture = completeDecisionFixture({ consentedAttribution: true });
    const before = cloneQuestion();
    const after = {
      ...before,
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-a',
    };
    expect(
      verifyQuestionReviewTransition(
        exactInput(fixture, before, after, decisionFor(fixture)),
      ).map((issue) => issue.code),
    ).toContain('REVIEW_TRANSITION_DECISION_INVALID');
  });

  it.each([
    [
      'stem',
      (question: AssessmentQuestion): AssessmentQuestion => ({
        ...question,
        stem: `${question.stem} Unauthorized change.`,
      }),
    ],
    [
      'answer',
      (question: AssessmentQuestion): AssessmentQuestion => {
        if (question.format !== 'single_best_answer') throw new Error('Expected SBA.');
        return { ...question, correctOptionId: question.options[1].id };
      },
    ],
    [
      'options/components',
      (question: AssessmentQuestion): AssessmentQuestion => {
        if (question.format !== 'single_best_answer') throw new Error('Expected SBA.');
        return {
          ...question,
          options: question.options.map((option, index) =>
            index === 1
              ? { ...option, text: `${option.text} changed` }
              : option,
          ),
        };
      },
    ],
    [
      'rationale',
      (question: AssessmentQuestion): AssessmentQuestion => {
        if (question.format !== 'single_best_answer') throw new Error('Expected SBA.');
        return {
          ...question,
          options: question.options.map((option, index) =>
            index === 0
              ? { ...option, rationale: `${option.rationale} changed` }
              : option,
          ),
        };
      },
    ],
    [
      'objective/Bloom metadata',
      (question: AssessmentQuestion): AssessmentQuestion => ({
        ...question,
        objectiveId: reviewTestContext.bank.objectives[1].id,
        bloomLevel: 'analyze',
      }),
    ],
    [
      'sources',
      (question: AssessmentQuestion): AssessmentQuestion => ({
        ...question,
        sources: question.sources.map((source, index) =>
          index === 0
            ? { ...source, locator: `${source.locator} changed` }
            : source,
        ),
      }),
    ],
  ])(
    'rejects matching before/after unauthorized %s content even with a fabricated hash',
    (_label, mutate) => {
      const fixture = completeDecisionFixture();
      const before = mutate(cloneQuestion());
      const after = {
        ...mutate(cloneQuestion()),
        reviewStatus: 'reviewed' as const,
        reviewer: 'reviewer-a',
      };
      const fabricatedInput = {
        ...exactInput(fixture, before, after),
        currentQuestionHash: 'f'.repeat(64),
      };
      expect(
        verifyQuestionReviewTransition(fabricatedInput).map(
          (issue) => issue.code,
        ),
      ).toContain('REVIEW_CANONICAL_CONTENT_MISMATCH');
    },
  );

  it('rejects post-decision attribution tampering', () => {
    const fixture = completeDecisionFixture();
    const before = cloneQuestion();
    const after = {
      ...before,
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-b',
    };
    expect(
      verifyQuestionReviewTransition(
        exactInput(fixture, before, after, {
          ...fixture.baseDecision,
          reviewerAttributionId: 'reviewer-b',
        }),
      ).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        'REVIEW_TRANSITION_DECISION_INVALID',
        'REVIEW_DECISION_ID_INVALID',
      ]),
    );
  });

  it('rejects a stale or mutated evidence bundle', () => {
    const fixture = completeDecisionFixture({ consentedAttribution: true });
    const before = cloneQuestion();
    const after = {
      ...before,
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-a',
    };
    expect(
      verifyQuestionReviewTransition({
        ...exactInput(fixture, before, after),
        evidenceBundle: {
          ...fixture.bundle,
          analysis: {
            ...fixture.bundle.analysis,
            questions: fixture.bundle.analysis.questions.slice(1),
          },
        },
      }).map((issue) => issue.code),
    ).toContain('REVIEW_TRANSITION_EVIDENCE_INVALID');
  });

  it('rejects reviewed promotion while a reviewer comment remains unresolved', () => {
    const reviewers = syntheticReviewers.map((reviewer) =>
      reviewer.id === 'reviewer-a'
        ? { ...reviewer, consentToAttribution: true }
        : reviewer,
    );
    const manifest = syntheticCampaign(reviewers);
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
              comment: 'Synthetic unresolved comment.',
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
    const bundle = createEvidenceBundle({
      manifest,
      merged,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    const question = manifest.questions[0];
    const decisionEvidence = {
      schemaVersion: 1 as const,
      campaignId: manifest.id,
      campaignHash: manifest.campaignHash,
      questionId: question.questionId,
      questionVersion: question.questionVersion,
      questionHash: question.questionHash,
      evidenceBundleHash: bundle.hash,
      decision: 'eligible-for-reviewed' as const,
      reviewerAttributionId: 'reviewer-a',
      decidedBy: 'reviewer-c',
      decidedAt: '2000-01-03T00:00:00.000Z',
      rationale: 'Synthetic unresolved comment decision.',
      resolvedIssueIds: [],
    };
    const decision = {
      ...decisionEvidence,
      id: stableDecisionId(decisionEvidence),
    };
    const before = cloneQuestion();
    const after = {
      ...before,
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-a',
    };
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: after,
        decision,
        evidenceBundle: bundle,
        reviewContext: reviewTestContext,
      }).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        'REVIEW_TRANSITION_DECISION_INVALID',
        'REVIEW_DECISION_UNRESOLVED_ISSUES',
      ]),
    );
  });

  it('requires matching evidence and a retire decision for retirement', () => {
    const fixture = completeDecisionFixture();
    const before = cloneQuestion();
    const after = { ...before, reviewStatus: 'retired' as const };
    const retire = fixture.decisionFor('retire');
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: after,
      }).map((issue) => issue.code),
    ).toContain('RETIRE_DECISION_REQUIRED');
    expect(
      verifyQuestionReviewTransition({
        ...exactInput(fixture, before, after, retire),
      }),
    ).toEqual([]);

    const other = fixture.manifest.questions[1];
    const otherEvidence = {
      ...retire,
      questionId: other.questionId,
      questionVersion: other.questionVersion,
      questionHash: other.questionHash,
    };
    const otherDecision = {
      ...otherEvidence,
      id: stableDecisionId(otherEvidence),
    };
    expect(
      verifyQuestionReviewTransition({
        ...exactInput(fixture, before, after, otherDecision),
      }).map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_MISMATCH');
    expect(
      verifyQuestionReviewTransition({
        ...exactInput(fixture, before, after, {
          ...retire,
          id: fixture.baseDecision.id,
        }),
      }).map((issue) => issue.code),
    ).toContain('REVIEW_TRANSITION_DECISION_INVALID');
  });

  it('rejects nonconsenting and nonparticipating attribution', () => {
    const noConsent = completeDecisionFixture({
      consentedAttribution: false,
    });
    const before = cloneQuestion();
    const after = {
      ...before,
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-a',
    };
    expect(
      verifyQuestionReviewTransition(
        exactInput(noConsent, before, after),
      ).map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_ATTRIBUTION_NOT_CONSENTED');

    const observer = {
      schemaVersion: 1 as const,
      id: 'reviewer-d',
      roles: ['subject-matter-expert' as const],
      expertiseTags: ['aqueous-humour'],
      independentReviewAttestation: true,
      conflictOfInterest: { status: 'none' as const },
      consentToAttribution: true,
    };
    const reviewers = [...syntheticReviewers, observer];
    const manifest = syntheticCampaign(reviewers);
    const merged = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: ['reviewer-a', 'reviewer-b', 'reviewer-c'].map((reviewerId) => ({
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
    const question = manifest.questions[0];
    const evidence = {
      schemaVersion: 1 as const,
      campaignId: manifest.id,
      campaignHash: manifest.campaignHash,
      questionId: question.questionId,
      questionVersion: question.questionVersion,
      questionHash: question.questionHash,
      evidenceBundleHash: bundle.hash,
      decision: 'eligible-for-reviewed' as const,
      reviewerAttributionId: 'reviewer-d',
      decidedBy: 'reviewer-c',
      decidedAt: '2000-01-03T00:00:00.000Z',
      rationale: 'Synthetic observer attribution test.',
      resolvedIssueIds: [],
    };
    const decision = { ...evidence, id: stableDecisionId(evidence) };
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: { ...after, reviewer: 'reviewer-d' },
        decision,
        evidenceBundle: bundle,
        reviewContext: reviewTestContext,
      }).map((issue) => issue.code),
    ).toContain('REVIEW_DECISION_ATTRIBUTION_NOT_PARTICIPATING');
  });

  it('rejects retired-to-reviewed without newer evidence', () => {
    const fixture = completeDecisionFixture({ consentedAttribution: true });
    const current = cloneQuestion();
    const before = { ...current, reviewStatus: 'retired' as const };
    const after = {
      ...current,
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-a',
    };
    expect(
      verifyQuestionReviewTransition(
        exactInput(fixture, before, after),
      ).map((issue) => issue.code),
    ).toContain('RETIRED_TO_REVIEWED_REQUIRES_NEW_EVIDENCE');
  });
});
