import type { QuestionBlueprint } from '@/lib/assessment/blueprint/types';
import type { QuestionBank } from '@/lib/assessment/types';
import type {
  ContentReviewPolicy,
  EvidenceBundle,
  QuestionReviewDecision,
  ReviewCampaignManifest,
  ReviewDiagnostic,
  ReviewIssueResolution,
  StableReviewIssue,
} from './campaignTypes';
import { questionReviewDecisionSchema } from './campaignSchemas';
import { reviewPolicyHash, validateReviewCampaignManifest } from './campaignManifest';
import {
  resolutionClosesIssue,
  unresolvedReviewIssues,
  validateIssueResolutions,
} from './issueResolutions';
import {
  type ValidatedMergedReviewSubmissions,
  validateMergedReviewSubmissions,
} from './mergeSubmissions';
import { applyReviewResolutions } from './readiness';
import { analyzeReviewCampaign } from './reviewAnalysis';
import { stableReviewHash } from './stableReviewHash';

export type EvidenceValidationContext = {
  bank: QuestionBank;
  blueprint: QuestionBlueprint;
  policy: ContentReviewPolicy;
};

function evidenceBundleHash(
  bundle: Omit<EvidenceBundle, 'hash'>,
): string {
  return stableReviewHash(bundle);
}

export function createEvidenceBundle(input: {
  manifest: ReviewCampaignManifest;
  merged: ValidatedMergedReviewSubmissions;
  resolutions: ReviewIssueResolution[];
  policy: ContentReviewPolicy;
}): EvidenceBundle {
  if (
    input.manifest.policyHash !== reviewPolicyHash(input.policy) ||
    input.merged.campaignHash !== input.manifest.campaignHash
  ) {
    throw new Error(
      'Evidence bundle inputs do not match the immutable campaign or policy.',
    );
  }
  const baseAnalysis = analyzeReviewCampaign({
    manifest: input.manifest,
    merged: input.merged,
    policy: input.policy,
  });
  const resolutionValidation = validateIssueResolutions({
    value: input.resolutions,
    issues: baseAnalysis.questions.flatMap((question) => question.issues),
    manifest: input.manifest,
  });
  if (resolutionValidation.issues.length > 0) {
    throw new Error(
      resolutionValidation.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('\n'),
    );
  }
  const analysis = applyReviewResolutions(
    baseAnalysis,
    resolutionValidation.resolutions,
  );
  const issues = analysis.questions.flatMap((question) => question.issues);
  const evidence: Omit<EvidenceBundle, 'hash'> = {
    schemaVersion: 1,
    campaignId: input.manifest.id,
    campaignHash: input.manifest.campaignHash,
    bankHash: input.manifest.bankHash,
    mergedHash: input.merged.mergedHash,
    policy: input.policy,
    manifest: input.manifest,
    merged: input.merged,
    analysis,
    issues: [...issues].sort((left, right) => left.id.localeCompare(right.id)),
    resolutions: resolutionValidation.resolutions,
  };
  return {
    ...evidence,
    hash: evidenceBundleHash(evidence),
  };
}

export function validateEvidenceBundle(input: {
  value: unknown;
  manifest: ReviewCampaignManifest;
  context: EvidenceValidationContext;
}): {
  bundle?: EvidenceBundle;
  issues: ReviewDiagnostic[];
} {
  if (!input.value || typeof input.value !== 'object' || Array.isArray(input.value)) {
    return {
      issues: [
        {
          code: 'EVIDENCE_BUNDLE_INVALID',
          message: 'Evidence bundle must be an object.',
        },
      ],
    };
  }
  const candidate = input.value as Partial<EvidenceBundle>;
  const issues: ReviewDiagnostic[] = [];
  const manifestValidation = validateReviewCampaignManifest(
    candidate.manifest,
    input.context,
  );
  if (
    !manifestValidation.manifest ||
    manifestValidation.issues.length > 0 ||
    stableReviewHash(manifestValidation.manifest) !==
      stableReviewHash(input.manifest)
  ) {
    issues.push({
      code: 'EVIDENCE_BUNDLE_CAMPAIGN_INVALID',
      message: 'Evidence bundle campaign is invalid, stale, or inconsistent.',
    });
  }
  const mergedValidation = validateMergedReviewSubmissions({
    value: candidate.merged,
    manifest: input.manifest,
    bank: input.context.bank,
  });
  issues.push(...mergedValidation.issues);
  if (!mergedValidation.merged) return { issues };
  const baseAnalysis = analyzeReviewCampaign({
    manifest: input.manifest,
    merged: mergedValidation.merged,
    policy: input.context.policy,
  });
  const resolutionValidation = validateIssueResolutions({
    value: candidate.resolutions,
    issues: baseAnalysis.questions.flatMap((question) => question.issues),
    manifest: input.manifest,
  });
  issues.push(...resolutionValidation.issues);
  if (issues.length > 0) return { issues };
  const expected = createEvidenceBundle({
    manifest: input.manifest,
    merged: mergedValidation.merged,
    resolutions: resolutionValidation.resolutions,
    policy: input.context.policy,
  });
  if (
    candidate.hash !== expected.hash ||
    stableReviewHash(candidate) !== stableReviewHash(expected)
  ) {
    issues.push({
      code: 'EVIDENCE_BUNDLE_MISMATCH',
      message:
        'Evidence bundle does not match recomputed submissions, analysis, issues, resolutions, or hash.',
    });
    return { issues };
  }
  return { bundle: expected, issues };
}

export function validateReviewDecisions(input: {
  value: unknown;
  bundle: EvidenceBundle;
  manifest: ReviewCampaignManifest;
  context: EvidenceValidationContext;
}): {
  decisions: QuestionReviewDecision[];
  issues: ReviewDiagnostic[];
} {
  const evidenceValidation = validateEvidenceBundle({
    value: input.bundle,
    manifest: input.manifest,
    context: input.context,
  });
  if (!evidenceValidation.bundle) {
    return {
      decisions: [],
      issues: [
        {
          code: 'REVIEW_DECISION_EVIDENCE_INVALID',
          message: 'Decisions require a valid self-verifying evidence bundle.',
        },
        ...evidenceValidation.issues,
      ],
    };
  }
  const bundle = evidenceValidation.bundle;
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
    bundle.analysis.questions.map((question) => [
      question.questionId,
      question,
    ]),
  );
  const issueMap = new Map(bundle.issues.map((issue) => [issue.id, issue]));
  const resolutionMap = new Map(
    bundle.resolutions.map((resolution) => [resolution.issueId, resolution]),
  );
  const seenQuestions = new Set<string>();
  const seenIds = new Set<string>();
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
    if (seenIds.has(decision.id)) {
      issues.push({
        code: 'REVIEW_DECISION_ID_DUPLICATE',
        message: `Duplicate decision ID ${decision.id}.`,
      });
      return;
    }
    seenIds.add(decision.id);
    if (seenQuestions.has(decision.questionId)) {
      issues.push({
        code: 'REVIEW_DECISION_DUPLICATE',
        message: `Duplicate decision for ${decision.questionId}.`,
      });
      return;
    }
    seenQuestions.add(decision.questionId);
    const expectedId = stableDecisionId({
      campaignId: decision.campaignId,
      campaignHash: decision.campaignHash,
      questionId: decision.questionId,
      questionVersion: decision.questionVersion,
      questionHash: decision.questionHash,
      evidenceBundleHash: decision.evidenceBundleHash,
      decision: decision.decision,
      decidedBy: decision.decidedBy,
    });
    if (decision.id !== expectedId) {
      issues.push({
        code: 'REVIEW_DECISION_ID_INVALID',
        message: `Decision ${decision.id} does not match its stable identity.`,
      });
      return;
    }
    const question = campaignQuestions.get(decision.questionId);
    if (
      decision.campaignId !== input.manifest.id ||
      decision.campaignHash !== input.manifest.campaignHash ||
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
    if (decision.evidenceBundleHash !== bundle.hash) {
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
    if (new Set(decision.resolvedIssueIds).size !== decision.resolvedIssueIds.length) {
      issues.push({
        code: 'REVIEW_DECISION_ISSUE_DUPLICATE',
        message: `Decision ${decision.id} repeats a resolved issue ID.`,
      });
      return;
    }
    const referencedIssues = decision.resolvedIssueIds.map((issueId) => {
      const issue = issueMap.get(issueId);
      const resolution = resolutionMap.get(issueId);
      return { issueId, issue, resolution };
    });
    if (
      referencedIssues.some(
        ({ issue, resolution }) =>
          !issue ||
          issue.questionId !== decision.questionId ||
          !resolution ||
          !resolutionClosesIssue(issue, resolution),
      )
    ) {
      issues.push({
        code: 'REVIEW_DECISION_ISSUE_INVALID',
        message: `Decision ${decision.id} references an unrelated, open, or non-waivable issue.`,
      });
      return;
    }
    const analysis = analysisQuestions.get(decision.questionId);
    if (decision.decision === 'eligible-for-reviewed') {
      if (
        !analysis ||
        analysis.coverage.independentlyCoveredCriteria !==
          analysis.coverage.applicableCriteria
      ) {
        issues.push({
          code: 'REVIEW_DECISION_NOT_READY',
          message: `${decision.questionId} lacks complete independent evidence.`,
        });
        return;
      }
      const unresolved = unresolvedReviewIssues(
        analysis.issues,
        bundle.resolutions,
      );
      if (unresolved.length > 0) {
        issues.push({
          code: 'REVIEW_DECISION_UNRESOLVED_ISSUES',
          message: `${decision.questionId} retains unresolved review issues.`,
        });
        return;
      }
      if (analysis.state !== 'ready-for-human-decision') {
        issues.push({
          code: 'REVIEW_DECISION_NOT_READY',
          message: `${decision.questionId} is not ready for a human eligibility decision.`,
        });
        return;
      }
      const closureSupportingIds = analysis.issues
        .filter((issue) =>
          resolutionClosesIssue(issue, resolutionMap.get(issue.id)),
        )
        .map((issue) => issue.id)
        .sort();
      const submittedIds = [...decision.resolvedIssueIds].sort();
      if (stableReviewHash(closureSupportingIds) !== stableReviewHash(submittedIds)) {
        issues.push({
          code: 'REVIEW_DECISION_RESOLVED_ISSUES_INCOMPLETE',
          message: `Decision ${decision.id} must enumerate every current closure supporting eligibility.`,
        });
        return;
      }
    }
    decisions.push(decision);
  });
  return { decisions, issues };
}

export function stableDecisionId(input: {
  campaignId: string;
  campaignHash: string;
  questionId: string;
  questionVersion: number;
  questionHash: string;
  evidenceBundleHash: string;
  decision: QuestionReviewDecision['decision'];
  decidedBy: string;
}): string {
  return `decision-${stableReviewHash({
    campaignId: input.campaignId,
    campaignHash: input.campaignHash,
    questionId: input.questionId,
    questionVersion: input.questionVersion,
    questionHash: input.questionHash,
    evidenceBundleHash: input.evidenceBundleHash,
    decision: input.decision,
    decidedBy: input.decidedBy,
  }).slice(0, 24)}`;
}

export function decisionIssuesForQuestion(
  bundle: EvidenceBundle,
  questionId: string,
): StableReviewIssue[] {
  return bundle.issues.filter((issue) => issue.questionId === questionId);
}
