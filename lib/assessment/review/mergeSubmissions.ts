import type { QuestionBank } from '@/lib/assessment/types';
import type {
  ReviewCampaignManifest,
  ReviewDiagnostic,
  ReviewSubmission,
} from './campaignTypes';
import {
  submissionsToCsv,
  validateReviewerPack,
} from './reviewerPack';
import { stableReviewHash } from './stableReviewHash';
import { parseCsv } from './reviewPack';
import { normalizeCampaignReviewerId } from './reviewerProfiles';

export type ReviewerPackInput = { name: string; csv: string };

export type MergedReviewSubmissions = {
  schemaVersion: 1;
  campaignId: string;
  bankId: string;
  bankHash: string;
  submissions: ReviewSubmission[];
};

export function mergeReviewerPacks(input: {
  manifest: ReviewCampaignManifest;
  bank: QuestionBank;
  packs: ReviewerPackInput[];
}): {
  merged?: MergedReviewSubmissions;
  issues: ReviewDiagnostic[];
} {
  const issues: ReviewDiagnostic[] = [];
  const submissions: ReviewSubmission[] = [];
  const seenReviewers = new Set<string>();
  const seenRows = new Set<string>();

  for (const pack of input.packs) {
    const parsed = parseCsv(pack.csv);
    const reviewerColumn = parsed.rows[0]?.values.indexOf('reviewerId') ?? -1;
    const parsedReviewerIds =
      reviewerColumn < 0
        ? []
        : [
            ...new Set(
              parsed.rows
                .slice(1)
                .map((row) =>
                  normalizeCampaignReviewerId(row.values[reviewerColumn] ?? ''),
                )
                .filter(Boolean),
            ),
          ].filter((reviewerId) =>
            input.manifest.reviewers.some(
              (reviewer) => reviewer.id === reviewerId,
            ),
          );
    if (parsedReviewerIds.length !== 1) {
      issues.push({
        code: 'REVIEW_REVIEWER_MISMATCH',
        message: `${pack.name} does not identify exactly one campaign reviewer.`,
      });
      continue;
    }
    const reviewerId = parsedReviewerIds[0];
    if (seenReviewers.has(reviewerId)) {
      issues.push({
        code: 'REVIEW_PACK_DUPLICATE_REVIEWER',
        message: `More than one pack was supplied for ${reviewerId}.`,
      });
      continue;
    }
    seenReviewers.add(reviewerId);
    const validated = validateReviewerPack({
      csv: pack.csv,
      manifest: input.manifest,
      bank: input.bank,
      expectedReviewerId: reviewerId,
    });
    issues.push(
      ...validated.issues.map((issue) => ({
        ...issue,
        path: pack.name,
      })),
    );
    for (const submission of validated.submissions) {
      const key = `${submission.reviewerId}|${submission.questionId}|${submission.criterion}`;
      if (seenRows.has(key)) {
        issues.push({
          code: 'REVIEW_SUBMISSION_DUPLICATE',
          message: `Duplicate merged submission ${key}.`,
          path: pack.name,
        });
      } else {
        seenRows.add(key);
        submissions.push(submission);
      }
    }
  }

  if (issues.length > 0) return { issues };
  submissions.sort((left, right) =>
    [left.questionId, left.criterion, left.reviewerId]
      .join('|')
      .localeCompare(
        [right.questionId, right.criterion, right.reviewerId].join('|'),
      ),
  );
  return {
    merged: {
      schemaVersion: 1,
      campaignId: input.manifest.id,
      bankId: input.manifest.bankId,
      bankHash: input.manifest.bankHash,
      submissions,
    },
    issues,
  };
}

export function mergedSubmissionsCsv(merged: MergedReviewSubmissions): string {
  return submissionsToCsv(merged.submissions);
}

export function mergedSubmissionsHash(
  merged: MergedReviewSubmissions,
): string {
  return stableReviewHash(merged);
}
