import type {
  ReviewCampaignManifest,
  ReviewDiagnostic,
  ReviewIssueResolution,
  StableReviewIssue,
} from './campaignTypes';
import { reviewIssueResolutionSchema } from './campaignSchemas';

export const NON_WAIVABLE_EVIDENCE_ISSUE_CODES = new Set([
  'NO_REVIEW_RATINGS',
  'MISSING_REQUIRED_CRITERION',
  'INSUFFICIENT_REVIEWERS',
  'STALE_REVIEW_EVIDENCE',
  'REVIEWER_INDEPENDENCE_NOT_ATTESTED',
]);

export function resolutionClosesIssue(
  issue: StableReviewIssue,
  resolution?: ReviewIssueResolution,
): boolean {
  if (!resolution || resolution.status === 'open') return false;
  if (NON_WAIVABLE_EVIDENCE_ISSUE_CODES.has(issue.code)) return false;
  if (
    issue.severity === 'blocking' &&
    resolution.status === 'accepted-for-discussion'
  ) {
    return false;
  }
  return true;
}

export function openResolutionTemplate(
  issues: StableReviewIssue[],
  existing: ReviewIssueResolution[] = [],
): ReviewIssueResolution[] {
  const current = new Map(
    existing.map((resolution) => [resolution.issueId, resolution]),
  );
  return [...issues]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(
      (issue) =>
        current.get(issue.id) ?? {
          schemaVersion: 1,
          issueId: issue.id,
          status: 'open',
        },
    );
}

export function validateIssueResolutions(input: {
  value: unknown;
  issues: StableReviewIssue[];
  manifest: ReviewCampaignManifest;
}): {
  resolutions: ReviewIssueResolution[];
  issues: ReviewDiagnostic[];
} {
  if (!Array.isArray(input.value)) {
    return {
      resolutions: [],
      issues: [
        {
          code: 'REVIEW_RESOLUTIONS_INVALID',
          message: 'Resolutions must be an array.',
        },
      ],
    };
  }
  const diagnostics: ReviewDiagnostic[] = [];
  const resolutions: ReviewIssueResolution[] = [];
  const issueMap = new Map(input.issues.map((issue) => [issue.id, issue]));
  const reviewerMap = new Map(
    input.manifest.reviewers.map((reviewer) => [reviewer.id, reviewer]),
  );
  const seen = new Set<string>();
  input.value.forEach((entry, index) => {
    const parsed = reviewIssueResolutionSchema.safeParse(entry);
    if (!parsed.success) {
      diagnostics.push({
        code: 'REVIEW_RESOLUTION_INVALID',
        message: `Resolution ${index + 1}: ${parsed.error.issues
          .map((issue) => issue.message)
          .join('; ')}`,
      });
      return;
    }
    const resolution = parsed.data as ReviewIssueResolution;
    if (seen.has(resolution.issueId)) {
      diagnostics.push({
        code: 'REVIEW_RESOLUTION_DUPLICATE',
        message: `Duplicate resolution for ${resolution.issueId}.`,
      });
      return;
    }
    seen.add(resolution.issueId);
    const issue = issueMap.get(resolution.issueId);
    if (!issue) {
      diagnostics.push({
        code: 'REVIEW_RESOLUTION_ISSUE_UNKNOWN',
        message: `Unknown or stale review issue ${resolution.issueId}.`,
      });
      return;
    }
    if (
      resolution.status === 'open' &&
      (resolution.resolution || resolution.resolvedBy || resolution.resolvedAt)
    ) {
      diagnostics.push({
        code: 'REVIEW_RESOLUTION_OPEN_METADATA_FORBIDDEN',
        message: `Open resolution ${resolution.issueId} cannot include resolver metadata.`,
      });
      return;
    }
    if (resolution.status !== 'open') {
      if (
        !resolution.resolution ||
        !resolution.resolvedBy ||
        !resolution.resolvedAt
      ) {
        diagnostics.push({
          code: 'REVIEW_RESOLUTION_DETAILS_REQUIRED',
          message: `Resolution ${resolution.issueId} requires rationale, resolver, and timestamp.`,
        });
        return;
      }
      if (
        new Date(resolution.resolvedAt).getTime() <
        new Date(input.manifest.createdAt).getTime()
      ) {
        diagnostics.push({
          code: 'REVIEW_RESOLUTION_TIMESTAMP_BEFORE_CAMPAIGN',
          message: `Resolution ${resolution.issueId} predates campaign creation.`,
        });
        return;
      }
      const resolver = reviewerMap.get(resolution.resolvedBy);
      if (!resolver) {
        diagnostics.push({
          code: 'REVIEW_RESOLUTION_RESOLVER_UNAUTHORIZED',
          message: `${resolution.resolvedBy} is not a campaign reviewer.`,
        });
        return;
      }
      if (NON_WAIVABLE_EVIDENCE_ISSUE_CODES.has(issue.code)) {
        diagnostics.push({
          code: 'REVIEW_RESOLUTION_EVIDENCE_NON_WAIVABLE',
          message: `${issue.code} requires corrected campaign evidence and cannot be closed textually.`,
        });
        return;
      }
      if (
        ['FACTUAL_ACCURACY_CONCERN', 'IMAGE_RIGHTS_CONCERN'].includes(
          issue.code,
        ) &&
        !resolver.roles.includes('review-chair')
      ) {
        diagnostics.push({
          code: 'REVIEW_RESOLUTION_CHAIR_REQUIRED',
          message: `${issue.code} no-change closure requires a review chair with rationale.`,
        });
        return;
      }
      if (
        issue.severity === 'blocking' &&
        resolution.status === 'accepted-for-discussion'
      ) {
        diagnostics.push({
          code: 'REVIEW_RESOLUTION_BLOCKING_DISCUSSION_ONLY',
          message: `${issue.code} is blocking and cannot be closed as accepted-for-discussion.`,
        });
        return;
      }
    }
    resolutions.push(resolution);
  });
  return {
    resolutions: [...resolutions].sort((left, right) =>
      left.issueId.localeCompare(right.issueId),
    ),
    issues: diagnostics,
  };
}

export function unresolvedReviewIssues(
  issues: StableReviewIssue[],
  resolutions: ReviewIssueResolution[],
): StableReviewIssue[] {
  const resolutionMap = new Map(
    resolutions.map((resolution) => [resolution.issueId, resolution]),
  );
  return issues.filter(
    (issue) => !resolutionClosesIssue(issue, resolutionMap.get(issue.id)),
  );
}
