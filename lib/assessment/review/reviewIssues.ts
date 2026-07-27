import type {
  ReviewCampaignQuestion,
  ReviewIssueSeverity,
  StableReviewIssue,
} from './campaignTypes';
import { normalizeIssueText, stableReviewHash } from './stableReviewHash';

export function createStableReviewIssue(input: {
  campaignId: string;
  campaignHash: string;
  question: ReviewCampaignQuestion;
  criterion?: string;
  reviewerId?: string;
  code: string;
  severity: ReviewIssueSeverity;
  message: string;
  evidence?: StableReviewIssue['evidence'];
}): StableReviewIssue {
  const normalizedEvidence = input.evidence
    ? {
        ...input.evidence,
        ...(input.evidence.comment
          ? { comment: normalizeIssueText(input.evidence.comment) }
          : {}),
      }
    : undefined;
  const identity = stableReviewHash({
    campaignId: input.campaignId,
    campaignHash: input.campaignHash,
    questionId: input.question.questionId,
    questionVersion: input.question.questionVersion,
    questionHash: input.question.questionHash,
    criterion: input.criterion,
    reviewerId: input.reviewerId,
    code: input.code,
    evidence: normalizedEvidence,
  }).slice(0, 24);
  return {
    schemaVersion: 1,
    id: `${input.code.toLowerCase().replaceAll('_', '-')}-${identity}`,
    campaignId: input.campaignId,
    campaignHash: input.campaignHash,
    questionId: input.question.questionId,
    questionVersion: input.question.questionVersion,
    questionHash: input.question.questionHash,
    ...(input.criterion ? { criterion: input.criterion } : {}),
    ...(input.reviewerId ? { reviewerId: input.reviewerId } : {}),
    code: input.code,
    severity: input.severity,
    message: input.message,
    ...(input.evidence ? { evidence: input.evidence } : {}),
  };
}

export function sortReviewIssues(
  issues: StableReviewIssue[],
): StableReviewIssue[] {
  return [...issues].sort((left, right) =>
    [
      left.questionId,
      left.criterion ?? '',
      left.reviewerId ?? '',
      left.code,
      left.id,
    ]
      .join('|')
      .localeCompare(
        [
          right.questionId,
          right.criterion ?? '',
          right.reviewerId ?? '',
          right.code,
          right.id,
        ].join('|'),
      ),
  );
}
