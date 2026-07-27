import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  EvidenceBundle,
  QuestionReviewDecision,
  ReviewDiagnostic,
} from './campaignTypes';
import { stableReviewHash } from './stableReviewHash';

function meaningfulQuestionEvidence(question: AssessmentQuestion): unknown {
  const evidence: Record<string, unknown> = { ...question };
  delete evidence.version;
  delete evidence.reviewStatus;
  delete evidence.reviewer;
  return evidence;
}

export function verifyQuestionReviewTransition(input: {
  beforeQuestion: AssessmentQuestion;
  afterQuestion: AssessmentQuestion;
  decision?: QuestionReviewDecision;
  evidenceBundle?: EvidenceBundle;
}): ReviewDiagnostic[] {
  const issues: ReviewDiagnostic[] = [];
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
  if (
    contentChanged &&
    input.afterQuestion.reviewStatus !== 'draft'
  ) {
    issues.push({
      code: 'REVISED_QUESTION_MUST_RETURN_TO_DRAFT',
      message: 'A revised question must return to draft pending new review.',
    });
  }
  if (
    input.beforeQuestion.reviewStatus === 'draft' &&
    input.afterQuestion.reviewStatus === 'reviewed'
  ) {
    if (!input.decision || !input.evidenceBundle) {
      issues.push({
        code: 'REVIEW_DECISION_REQUIRED',
        message: 'Draft-to-reviewed requires an evidence-backed decision.',
      });
    } else if (
      input.decision.decision !== 'eligible-for-reviewed' ||
      input.decision.questionId !== input.afterQuestion.id ||
      input.decision.questionVersion !== input.afterQuestion.version ||
      input.decision.evidenceBundleHash !== input.evidenceBundle.hash
    ) {
      issues.push({
        code: 'REVIEW_DECISION_MISMATCH',
        message: 'The decision does not support this exact reviewed transition.',
      });
    }
    if (
      !input.afterQuestion.reviewer ||
      (input.decision &&
        input.afterQuestion.reviewer !== input.decision.decidedBy)
    ) {
      issues.push({
        code: 'REVIEWER_ATTRIBUTION_REQUIRED',
        message:
          'A reviewed question must record attribution matching the human review-chair decision.',
      });
    }
    const questionIssues =
      input.evidenceBundle?.issues.filter(
        (issue) => issue.questionId === input.afterQuestion.id,
      ) ?? [];
    const resolved = new Set(
      input.evidenceBundle?.resolutions
        .filter((resolution) => resolution.status !== 'open')
        .map((resolution) => resolution.issueId) ?? [],
    );
    if (
      questionIssues.some(
        (issue) => issue.severity === 'blocking' && !resolved.has(issue.id),
      )
    ) {
      issues.push({
        code: 'UNRESOLVED_BLOCKING_REVIEW_ISSUE',
        message: 'The proposed transition retains a blocking review issue.',
      });
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
    input.beforeQuestion.reviewStatus !== 'retired' &&
    input.decision?.decision !== 'retire'
  ) {
    issues.push({
      code: 'RETIRE_DECISION_REQUIRED',
      message: 'Retirement requires a matching human retire decision.',
    });
  }
  return issues;
}
