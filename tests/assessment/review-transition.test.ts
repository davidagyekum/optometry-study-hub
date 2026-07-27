import { describe, expect, it } from 'vitest';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import { verifyQuestionReviewTransition } from '@/lib/assessment/review/transitionVerification';
import { completeDecisionFixture } from './reviewDecisionFixtures';
import { reviewTestContext } from './reviewTestFixtures';

function cloneQuestion(): AssessmentQuestion {
  return structuredClone(reviewTestContext.bank.questions[0]);
}

describe('question review-status transition verification', () => {
  it('allows an unchanged draft to remain draft', () => {
    const before = cloneQuestion();
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: structuredClone(before),
      }),
    ).toEqual([]);
  });

  it('requires version increment and draft status for meaningful content changes', () => {
    const before = cloneQuestion();
    const unchangedVersion = { ...before, stem: `${before.stem} revised` };
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: unchangedVersion,
      }).map((issue) => issue.code),
    ).toContain('QUESTION_VERSION_NOT_INCREMENTED');
    const incremented = {
      ...unchangedVersion,
      version: before.version + 1,
      reviewStatus: 'draft' as const,
    };
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: incremented,
      }),
    ).toEqual([]);
  });

  it('rejects old evidence after revision', () => {
    const fixture = completeDecisionFixture();
    const before = cloneQuestion();
    const after = {
      ...before,
      stem: `${before.stem} revised`,
      version: before.version + 1,
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-c',
    };
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: after,
        decision: fixture.baseDecision,
        evidenceBundle: fixture.bundle,
      }).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining(['REVIEW_EVIDENCE_STALE', 'REVISED_QUESTION_MUST_RETURN_TO_DRAFT']),
    );
  });

  it('requires a matching decision and reviewer attribution for draft to reviewed', () => {
    const before = cloneQuestion();
    const after = { ...before, reviewStatus: 'reviewed' as const };
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: after,
      }).map((issue) => issue.code),
    ).toEqual(expect.arrayContaining(['REVIEW_DECISION_REQUIRED', 'REVIEWER_ATTRIBUTION_REQUIRED']));
  });

  it('supports an exact synthetic draft-to-reviewed fixture without mutating inputs', () => {
    const fixture = completeDecisionFixture();
    const before = cloneQuestion();
    const after = {
      ...structuredClone(before),
      reviewStatus: 'reviewed' as const,
      reviewer: 'reviewer-c',
    };
    const beforeSnapshot = structuredClone(before);
    const afterSnapshot = structuredClone(after);
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: after,
        decision: fixture.baseDecision,
        evidenceBundle: fixture.bundle,
      }),
    ).toEqual([]);
    expect(before).toEqual(beforeSnapshot);
    expect(after).toEqual(afterSnapshot);
  });

  it('forbids approval transitions in PR 8', () => {
    const before = cloneQuestion();
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: { ...before, reviewStatus: 'approved' },
      }).map((issue) => issue.code),
    ).toContain('DRAFT_TO_APPROVED_FORBIDDEN');
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: { ...before, reviewStatus: 'reviewed' },
        afterQuestion: { ...before, reviewStatus: 'approved' },
      }).map((issue) => issue.code),
    ).toContain('APPROVAL_TRANSITION_OUT_OF_SCOPE');
  });

  it('requires and accepts a matching retirement decision', () => {
    const fixture = completeDecisionFixture();
    const before = cloneQuestion();
    const after = { ...before, reviewStatus: 'retired' as const };
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: after,
      }).map((issue) => issue.code),
    ).toContain('RETIRE_DECISION_REQUIRED');
    expect(
      verifyQuestionReviewTransition({
        beforeQuestion: before,
        afterQuestion: after,
        decision: { ...fixture.baseDecision, decision: 'retire' },
        evidenceBundle: fixture.bundle,
      }),
    ).toEqual([]);
  });
});
