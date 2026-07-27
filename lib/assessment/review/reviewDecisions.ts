import type {
  BankReviewAnalysis,
  ContentReviewPolicy,
  EvidenceBundle,
  QuestionReviewDecision,
  ReviewCampaignManifest,
  ReviewDiagnostic,
  ReviewIssueResolution,
  ReviewSubmission,
  StableReviewIssue,
} from './campaignTypes';
import { questionReviewDecisionSchema } from './campaignSchemas';
import { unresolvedReviewIssues } from './issueResolutions';
import { stableReviewHash } from './stableReviewHash';

export function createEvidenceBundle(input: {
  manifest: ReviewCampaignManifest;
  submissions: ReviewSubmission[];
  analysis: BankReviewAnalysis;
  resolutions: ReviewIssueResolution[];
  policy: ContentReviewPolicy;
}): EvidenceBundle {
  const issues = input.analysis.questions.flatMap((question) => question.issues);
  const evidence = {
    schemaVersion: 1 as const,
    campaignId: input.manifest.id,
    bankHash: input.manifest.bankHash,
    policy: input.policy,
    manifest: input.manifest,
    submissions: [...input.submissions].sort((left, right) =>
      [left.questionId, left.criterion, left.reviewerId]
        .join('|')
        .localeCompare(
          [right.questionId, right.criterion, right.reviewerId].join('|'),
        ),
    ),
    analysis: input.analysis,
    issues: [...issues].sort((left, right) => left.id.localeCompare(right.id)),
    resolutions: [...input.resolutions].sort((left, right) =>
      left.issueId.localeCompare(right.issueId),
    ),
  };
  return {
    ...evidence,
    hash: stableReviewHash(evidence),
  };
}

export function validateReviewDecisions(input: {
  value: unknown;
  bundle: EvidenceBundle;
  manifest: ReviewCampaignManifest;
}): {
  decisions: QuestionReviewDecision[];
  issues: ReviewDiagnostic[];
} {
  if (!Array.isArray(input.value)) {
    return {
      decisions: [],
      issues: [
        {
          code: 'REVIEW_DECISIONS_INVALID',
          message: 'Decisions must be an array.',
        },
      ],
    };
  }
  const issues: ReviewDiagnostic[] = [];
  const decisions: QuestionReviewDecision[] = [];
  const campaignQuestions = new Map(
    input.manifest.questions.map((question) => [question.questionId, question]),
  );
  const campaignReviewers = new Map(
    input.manifest.reviewers.map((reviewer) => [reviewer.id, reviewer]),
  );
  const analysisQuestions = new Map(
    input.bundle.analysis.questions.map((question) => [
      question.questionId,
      question,
    ]),
  );
  const seen = new Set<string>();
  input.value.forEach((entry, index) => {
    const parsed = questionReviewDecisionSchema.safeParse(entry);
    if (!parsed.success) {
      issues.push({
        code: 'REVIEW_DECISION_INVALID',
        message: `Decision ${index + 1}: ${parsed.error.issues
          .map((issue) => issue.message)
          .join('; ')}`,
      });
      return;
    }
    const decision = parsed.data as QuestionReviewDecision;
    if (seen.has(decision.questionId)) {
      issues.push({
        code: 'REVIEW_DECISION_DUPLICATE',
        message: `Duplicate decision for ${decision.questionId}.`,
      });
      return;
    }
    seen.add(decision.questionId);
    const question = campaignQuestions.get(decision.questionId);
    if (
      decision.campaignId !== input.manifest.id ||
      !question ||
      question.questionVersion !== decision.questionVersion ||
      question.questionHash !== decision.questionHash
    ) {
      issues.push({
        code: 'REVIEW_DECISION_STALE',
        message: `Decision ${decision.id} does not match campaign question evidence.`,
      });
      return;
    }
    if (decision.evidenceBundleHash !== input.bundle.hash) {
      issues.push({
        code: 'REVIEW_DECISION_EVIDENCE_MISMATCH',
        message: `Decision ${decision.id} has a stale evidence-bundle hash.`,
      });
      return;
    }
    const chair = campaignReviewers.get(decision.decidedBy);
    if (!chair?.roles.includes('review-chair')) {
      issues.push({
        code: 'REVIEW_DECISION_CHAIR_REQUIRED',
        message: `${decision.decidedBy} is not a campaign review chair.`,
      });
      return;
    }
    const analysis = analysisQuestions.get(decision.questionId);
    if (decision.decision === 'eligible-for-reviewed') {
      if (!analysis || analysis.state !== 'ready-for-human-decision') {
        issues.push({
          code: 'REVIEW_DECISION_NOT_READY',
          message: `${decision.questionId} is not ready for an eligible-for-reviewed decision.`,
        });
        return;
      }
      const unresolved = unresolvedReviewIssues(
        analysis.issues,
        input.bundle.resolutions,
      );
      if (
        unresolved.some((issue) => issue.severity === 'blocking') ||
        unresolved.some((issue) => issue.code === 'REVIEWER_COMMENT')
      ) {
        issues.push({
          code: 'REVIEW_DECISION_UNRESOLVED_ISSUES',
          message: `${decision.questionId} retains unresolved blocking or comment issues.`,
        });
        return;
      }
    }
    const knownIssueIds = new Set(input.bundle.issues.map((issue) => issue.id));
    if (decision.resolvedIssueIds.some((issueId) => !knownIssueIds.has(issueId))) {
      issues.push({
        code: 'REVIEW_DECISION_ISSUE_UNKNOWN',
        message: `Decision ${decision.id} references an unknown issue.`,
      });
      return;
    }
    decisions.push(decision);
  });
  return { decisions, issues };
}

export function stableDecisionId(input: {
  campaignId: string;
  questionId: string;
  questionVersion: number;
  questionHash: string;
  decision: QuestionReviewDecision['decision'];
  decidedBy: string;
}): string {
  return `decision-${stableReviewHash(input).slice(0, 24)}`;
}

export function decisionIssuesForQuestion(
  bundle: EvidenceBundle,
  questionId: string,
): StableReviewIssue[] {
  return bundle.issues.filter((issue) => issue.questionId === questionId);
}
