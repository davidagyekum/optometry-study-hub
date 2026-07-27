import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  EvidenceBundle,
  QuestionReviewDecision,
  ReviewDiagnostic,
} from './campaignTypes';
import type { EvidenceValidationContext } from './reviewDecisions';
import {
  validateEvidenceBundle,
  validateReviewDecisions,
} from './reviewDecisions';
import { unresolvedReviewIssues } from './issueResolutions';
import { reviewQuestionHash } from './reviewPack';
import { stableReviewHash } from './stableReviewHash';

function meaningfulQuestionEvidence(question: AssessmentQuestion): unknown {
  const evidence: Record<string, unknown> = { ...question };
  delete evidence.version;
  delete evidence.reviewStatus;
  delete evidence.reviewer;
  return evidence;
}

function canonicalQuestionContent(question: AssessmentQuestion): unknown {
  const content: Record<string, unknown> = { ...question };
  delete content.reviewStatus;
  delete content.reviewer;
  return content;
}

function validateExactTransitionEvidence(input: {
  afterQuestion: AssessmentQuestion;
  requiredDecision: 'eligible-for-reviewed' | 'retire';
  decision?: QuestionReviewDecision;
  evidenceBundle?: EvidenceBundle;
  reviewContext?: EvidenceValidationContext;
}): {
  bundle?: EvidenceBundle;
  decision?: QuestionReviewDecision;
  issues: ReviewDiagnostic[];
} {
  if (!input.decision || !input.evidenceBundle || !input.reviewContext) {
    return {
      issues: [
        {
          code: 'REVIEW_DECISION_REQUIRED',
          message:
            'The transition requires a decision, evidence bundle, and canonical review context.',
        },
      ],
    };
  }

  const issues: ReviewDiagnostic[] = [];
  const canonicalQuestion = input.reviewContext.bank.questions.find(
    (question) => question.id === input.afterQuestion.id,
  );
  const canonicalObjective = canonicalQuestion
    ? input.reviewContext.bank.objectives.find(
        (objective) => objective.id === canonicalQuestion.objectiveId,
      )
    : undefined;
  if (!canonicalQuestion || !canonicalObjective) {
    return {
      issues: [
        {
          code: 'REVIEW_CANONICAL_QUESTION_MISSING',
          message:
            'The proposed question is not present with a resolvable objective in the canonical review bank.',
        },
      ],
    };
  }

  const canonicalHash = reviewQuestionHash(
    canonicalQuestion,
    canonicalObjective,
    input.reviewContext.bank.sources,
  );
  if (
    stableReviewHash(canonicalQuestionContent(input.afterQuestion)) !==
    stableReviewHash(canonicalQuestionContent(canonicalQuestion))
  ) {
    issues.push({
      code: 'REVIEW_CANONICAL_CONTENT_MISMATCH',
      message:
        'The proposed question content does not exactly match the canonical content that received review evidence.',
    });
  }

  const evidence = validateEvidenceBundle({
    value: input.evidenceBundle,
    manifest: input.evidenceBundle.manifest,
    context: input.reviewContext,
  });
  if (!evidence.bundle) {
    return {
      issues: [
        ...issues,
        {
          code: 'REVIEW_TRANSITION_EVIDENCE_INVALID',
          message: 'Transition evidence bundle is invalid or stale.',
        },
        ...evidence.issues,
      ],
    };
  }

  const decisionValidation = validateReviewDecisions({
    value: [input.decision],
    bundle: evidence.bundle,
    manifest: evidence.bundle.manifest,
    context: input.reviewContext,
  });
  if (
    decisionValidation.issues.length > 0 ||
    decisionValidation.decisions.length !== 1
  ) {
    return {
      bundle: evidence.bundle,
      issues: [
        ...issues,
        {
          code: 'REVIEW_TRANSITION_DECISION_INVALID',
          message: 'Transition decision is invalid for the evidence bundle.',
        },
        ...decisionValidation.issues,
      ],
    };
  }

  const decision = decisionValidation.decisions[0];
  const manifestQuestion = evidence.bundle.manifest.questions.find(
    (question) => question.questionId === canonicalQuestion.id,
  );
  const analysisQuestion = evidence.bundle.analysis.questions.find(
    (question) => question.questionId === canonicalQuestion.id,
  );
  if (
    decision.decision !== input.requiredDecision ||
    decision.campaignId !== evidence.bundle.campaignId ||
    decision.campaignHash !== evidence.bundle.campaignHash ||
    decision.questionId !== canonicalQuestion.id ||
    decision.questionVersion !== canonicalQuestion.version ||
    decision.questionHash !== canonicalHash ||
    decision.evidenceBundleHash !== evidence.bundle.hash ||
    !manifestQuestion ||
    manifestQuestion.questionVersion !== canonicalQuestion.version ||
    manifestQuestion.questionHash !== canonicalHash ||
    !analysisQuestion ||
    analysisQuestion.questionVersion !== canonicalQuestion.version ||
    analysisQuestion.questionHash !== canonicalHash
  ) {
    issues.push({
      code: 'REVIEW_DECISION_MISMATCH',
      message:
        'The decision does not match the exact canonical campaign, question, version, recomputed review hash, analysis, bundle, and transition type.',
    });
  }
  return { bundle: evidence.bundle, decision, issues };
}

export function verifyQuestionReviewTransition(input: {
  beforeQuestion: AssessmentQuestion;
  afterQuestion: AssessmentQuestion;
  decision?: QuestionReviewDecision;
  evidenceBundle?: EvidenceBundle;
  reviewContext?: EvidenceValidationContext;
}): ReviewDiagnostic[] {
  const issues: ReviewDiagnostic[] = [];
  if (input.beforeQuestion.id !== input.afterQuestion.id) {
    issues.push({
      code: 'QUESTION_ID_CHANGED',
      message: 'Before and after question IDs must match.',
    });
  }
  if (input.afterQuestion.version < input.beforeQuestion.version) {
    issues.push({
      code: 'QUESTION_VERSION_REGRESSION',
      message: 'Question version cannot decrease.',
    });
  }
  const contentChanged =
    stableReviewHash(meaningfulQuestionEvidence(input.beforeQuestion)) !==
    stableReviewHash(meaningfulQuestionEvidence(input.afterQuestion));
  if (
    contentChanged &&
    input.afterQuestion.version <= input.beforeQuestion.version
  ) {
    issues.push({
      code: 'QUESTION_VERSION_NOT_INCREMENTED',
      message: 'Meaningful question changes require a version increment.',
    });
  }
  if (
    contentChanged &&
    (input.decision || input.afterQuestion.reviewStatus !== 'draft')
  ) {
    issues.push({
      code: 'REVIEW_EVIDENCE_STALE',
      message: 'Old review evidence cannot support changed question content.',
    });
  }
  if (contentChanged && input.afterQuestion.reviewStatus !== 'draft') {
    issues.push({
      code: 'REVISED_QUESTION_MUST_RETURN_TO_DRAFT',
      message: 'A revised question must return to draft pending new review.',
    });
  }

  const transitionsToReviewed =
    input.beforeQuestion.reviewStatus !== 'reviewed' &&
    input.afterQuestion.reviewStatus === 'reviewed';
  if (transitionsToReviewed) {
    if (
      input.beforeQuestion.reviewStatus === 'retired' &&
      input.afterQuestion.version <= input.beforeQuestion.version
    ) {
      issues.push({
        code: 'RETIRED_TO_REVIEWED_REQUIRES_NEW_EVIDENCE',
        message:
          'A retired question requires a newer version and new exact evidence before reviewed status.',
      });
    }
    const exact = validateExactTransitionEvidence({
      afterQuestion: input.afterQuestion,
      requiredDecision: 'eligible-for-reviewed',
      decision: input.decision,
      evidenceBundle: input.evidenceBundle,
      reviewContext: input.reviewContext,
    });
    issues.push(...exact.issues);
    if (exact.bundle && exact.decision) {
      const analysis = exact.bundle.analysis.questions.find(
        (question) => question.questionId === input.afterQuestion.id,
      );
      if (
        !analysis ||
        unresolvedReviewIssues(analysis.issues, exact.bundle.resolutions)
          .length > 0
      ) {
        issues.push({
          code: 'UNRESOLVED_REVIEW_ISSUE',
          message:
            'The proposed reviewed transition retains an unresolved issue.',
        });
      }
      if (
        !exact.decision.reviewerAttributionId ||
        input.afterQuestion.reviewer !==
          exact.decision.reviewerAttributionId
      ) {
        issues.push({
          code: 'REVIEWER_ATTRIBUTION_MISMATCH',
          message:
            'The proposed reviewer attribution must exactly match the evidence-bound decision attribution.',
        });
      }
    }
  }
  if (
    input.beforeQuestion.reviewStatus === 'draft' &&
    input.afterQuestion.reviewStatus === 'approved'
  ) {
    issues.push({
      code: 'DRAFT_TO_APPROVED_FORBIDDEN',
      message: 'Draft-to-approved is forbidden in the PR 8 policy.',
    });
  }
  if (
    input.beforeQuestion.reviewStatus === 'reviewed' &&
    input.afterQuestion.reviewStatus === 'approved'
  ) {
    issues.push({
      code: 'APPROVAL_TRANSITION_OUT_OF_SCOPE',
      message: 'Approval transitions are outside PR 8.',
    });
  }
  if (
    input.afterQuestion.reviewStatus === 'retired' &&
    input.beforeQuestion.reviewStatus !== 'retired'
  ) {
    const exact = validateExactTransitionEvidence({
      afterQuestion: input.afterQuestion,
      requiredDecision: 'retire',
      decision: input.decision,
      evidenceBundle: input.evidenceBundle,
      reviewContext: input.reviewContext,
    });
    if (exact.issues.length > 0) {
      issues.push(
        {
          code: 'RETIRE_DECISION_REQUIRED',
          message: 'Retirement requires an exact validated retire decision.',
        },
        ...exact.issues,
      );
    }
  }
  return issues;
}
