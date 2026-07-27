import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  EvidenceBundle,
  QuestionReviewDecision,
  ReviewAttribution,
  ReviewDiagnostic,
} from './campaignTypes';
import type { EvidenceValidationContext } from './reviewDecisions';
import {
  validateEvidenceBundle,
  validateReviewDecisions,
} from './reviewDecisions';
import { unresolvedReviewIssues } from './issueResolutions';
import { stableReviewHash } from './stableReviewHash';

function meaningfulQuestionEvidence(question: AssessmentQuestion): unknown {
  const evidence: Record<string, unknown> = { ...question };
  delete evidence.version;
  delete evidence.reviewStatus;
  delete evidence.reviewer;
  return evidence;
}

function validateExactTransitionEvidence(input: {
  afterQuestion: AssessmentQuestion;
  requiredDecision: 'eligible-for-reviewed' | 'retire';
  decision?: QuestionReviewDecision;
  evidenceBundle?: EvidenceBundle;
  reviewContext?: EvidenceValidationContext;
  currentQuestionHash?: string;
}): {
  bundle?: EvidenceBundle;
  issues: ReviewDiagnostic[];
} {
  const issues: ReviewDiagnostic[] = [];
  if (
    !input.decision ||
    !input.evidenceBundle ||
    !input.reviewContext ||
    !input.currentQuestionHash
  ) {
    return {
      issues: [
        {
          code: 'REVIEW_DECISION_REQUIRED',
          message:
            'The transition requires a decision, evidence bundle, canonical review context, and current review question hash.',
        },
      ],
    };
  }
  const evidence = validateEvidenceBundle({
    value: input.evidenceBundle,
    manifest: input.evidenceBundle.manifest,
    context: input.reviewContext,
  });
  if (!evidence.bundle) {
    return {
      issues: [
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
      issues: [
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
    (question) => question.questionId === input.afterQuestion.id,
  );
  if (
    decision.decision !== input.requiredDecision ||
    decision.campaignId !== evidence.bundle.campaignId ||
    decision.campaignHash !== evidence.bundle.campaignHash ||
    decision.questionId !== input.afterQuestion.id ||
    decision.questionVersion !== input.afterQuestion.version ||
    decision.questionHash !== input.currentQuestionHash ||
    decision.evidenceBundleHash !== evidence.bundle.hash ||
    !manifestQuestion ||
    manifestQuestion.questionVersion !== input.afterQuestion.version ||
    manifestQuestion.questionHash !== input.currentQuestionHash
  ) {
    issues.push({
      code: 'REVIEW_DECISION_MISMATCH',
      message:
        'The decision does not match the exact campaign, question, version, review hash, bundle, and transition type.',
    });
  }
  return { bundle: evidence.bundle, issues };
}

function validateAttribution(input: {
  question: AssessmentQuestion;
  attribution?: ReviewAttribution;
  bundle: EvidenceBundle;
}): ReviewDiagnostic[] {
  const issues: ReviewDiagnostic[] = [];
  if (
    !input.attribution ||
    input.attribution.consentConfirmed !== true ||
    input.question.reviewer !== input.attribution.reviewerId
  ) {
    return [
      {
        code: 'REVIEWER_ATTRIBUTION_REQUIRED',
        message:
          'Reviewed status requires an explicit consent-aware substantive reviewer attribution.',
      },
    ];
  }
  const profile = input.bundle.manifest.reviewers.find(
    (reviewer) => reviewer.id === input.attribution?.reviewerId,
  );
  const substantiveRoles = new Set([
    'subject-matter-expert',
    'assessment-reviewer',
    'accessibility-reviewer',
    'image-rights-reviewer',
  ]);
  if (
    !profile?.consentToAttribution ||
    !profile.roles.some((role) => substantiveRoles.has(role))
  ) {
    issues.push({
      code: 'REVIEWER_ATTRIBUTION_NOT_CONSENTED',
      message:
        'The attributed reviewer must consent and hold a substantive review role.',
    });
  }
  const participated = input.bundle.merged.submissions.some(
    (submission) =>
      submission.questionId === input.question.id &&
      submission.reviewerId === input.attribution?.reviewerId &&
      (submission.rating !== undefined || Boolean(submission.comment)),
  );
  if (!participated) {
    issues.push({
      code: 'REVIEWER_ATTRIBUTION_NOT_PARTICIPATING',
      message:
        'The attributed reviewer must have supplied substantive evidence for this question.',
    });
  }
  return issues;
}

export function verifyQuestionReviewTransition(input: {
  beforeQuestion: AssessmentQuestion;
  afterQuestion: AssessmentQuestion;
  decision?: QuestionReviewDecision;
  evidenceBundle?: EvidenceBundle;
  reviewContext?: EvidenceValidationContext;
  currentQuestionHash?: string;
  attribution?: ReviewAttribution;
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
      currentQuestionHash: input.currentQuestionHash,
    });
    issues.push(...exact.issues);
    if (exact.bundle) {
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
      issues.push(
        ...validateAttribution({
          question: input.afterQuestion,
          attribution: input.attribution,
          bundle: exact.bundle,
        }),
      );
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
      currentQuestionHash: input.currentQuestionHash,
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
