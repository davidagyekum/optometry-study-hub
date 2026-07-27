import { z } from 'zod';
import type { QuestionBank } from '@/lib/assessment/types';
import type {
  MergedReviewSubmissions,
  ReviewCampaignManifest,
  ReviewDiagnostic,
  ReviewSourcePackReceipt,
  ReviewSubmission,
} from './campaignTypes';
import { reviewSubmissionSchema } from './campaignSchemas';
import {
  CAMPAIGN_REVIEW_HEADERS,
  MAX_REVIEW_COMMENT_LENGTH,
  REVIEW_CONTROL_CHARACTERS,
  campaignReviewRows,
  normalizedReviewerPackHash,
  validateReviewerPack,
} from './reviewerPack';
import { stableReviewHash } from './stableReviewHash';
import { parseCsv } from './reviewPack';
import { normalizeCampaignReviewerId } from './reviewerProfiles';

export type { MergedReviewSubmissions } from './campaignTypes';

declare const validatedMergedEvidence: unique symbol;
export type ValidatedMergedReviewSubmissions = MergedReviewSubmissions & {
  readonly [validatedMergedEvidence]: true;
};

export type ReviewerPackInput = { name: string; csv: string };

const hash64 = z.string().regex(/^[a-f0-9]{64}$/);
const sourcePackReceiptSchema = z.strictObject({
  reviewerId: z.string().min(1),
  packHash: hash64,
  rowCount: z.number().int().positive(),
});
const mergedReviewSubmissionsSchema = z.strictObject({
  schemaVersion: z.literal(1),
  campaignId: z.string().min(1),
  campaignHash: hash64,
  bankId: z.string().min(1),
  bankHash: hash64,
  sourcePacks: z.array(sourcePackReceiptSchema),
  submissions: z.array(reviewSubmissionSchema),
  mergedHash: hash64,
});

const submissionKey = (submission: ReviewSubmission): string =>
  [submission.questionId, submission.criterion, submission.reviewerId].join('|');

const sortSubmissions = (submissions: ReviewSubmission[]): ReviewSubmission[] =>
  [...submissions].sort((left, right) =>
    submissionKey(left).localeCompare(submissionKey(right)),
  );

function mergedHashEvidence(
  merged: Omit<MergedReviewSubmissions, 'mergedHash'>,
): unknown {
  return {
    schemaVersion: merged.schemaVersion,
    campaignId: merged.campaignId,
    campaignHash: merged.campaignHash,
    bankId: merged.bankId,
    bankHash: merged.bankHash,
    sourcePacks: [...merged.sourcePacks].sort((left, right) =>
      left.reviewerId.localeCompare(right.reviewerId),
    ),
    submissions: sortSubmissions(merged.submissions),
  };
}

export function mergedSubmissionsHash(
  merged: Omit<MergedReviewSubmissions, 'mergedHash'> | MergedReviewSubmissions,
): string {
  const candidate = merged as MergedReviewSubmissions;
  return stableReviewHash(
    mergedHashEvidence({
      schemaVersion: candidate.schemaVersion,
      campaignId: candidate.campaignId,
      campaignHash: candidate.campaignHash,
      bankId: candidate.bankId,
      bankHash: candidate.bankHash,
      sourcePacks: candidate.sourcePacks,
      submissions: candidate.submissions,
    }),
  );
}

export function validateMergedReviewSubmissions(input: {
  value: unknown;
  manifest: ReviewCampaignManifest;
  bank: QuestionBank;
}): {
  merged?: ValidatedMergedReviewSubmissions;
  issues: ReviewDiagnostic[];
} {
  const parsed = mergedReviewSubmissionsSchema.safeParse(input.value);
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map((issue) => ({
        code: 'MERGED_REVIEW_SCHEMA_INVALID',
        message: issue.message,
        path: issue.path.join('.'),
      })),
    };
  }
  const merged = parsed.data as MergedReviewSubmissions;
  const issues: ReviewDiagnostic[] = [];
  if (
    merged.campaignId !== input.manifest.id ||
    merged.campaignHash !== input.manifest.campaignHash ||
    merged.bankId !== input.manifest.bankId ||
    merged.bankHash !== input.manifest.bankHash
  ) {
    issues.push({
      code: 'MERGED_REVIEW_CAMPAIGN_MISMATCH',
      message: 'Merged evidence does not match the immutable campaign and bank.',
    });
  }
  if (merged.mergedHash !== mergedSubmissionsHash(merged)) {
    issues.push({
      code: 'MERGED_REVIEW_HASH_MISMATCH',
      message: 'Merged evidence hash does not match its normalized contents.',
    });
  }
  const ordered = sortSubmissions(merged.submissions);
  if (stableReviewHash(ordered) !== stableReviewHash(merged.submissions)) {
    issues.push({
      code: 'MERGED_REVIEW_ORDER_INVALID',
      message: 'Merged submissions are not in deterministic canonical order.',
    });
  }
  const reviewerIds = new Set(input.manifest.reviewers.map((reviewer) => reviewer.id));
  const expectedRowsByReviewer = new Map(
    input.manifest.reviewers.map((reviewer) => [
      reviewer.id,
      new Map(
        campaignReviewRows(input.manifest, input.bank, reviewer.id).map((row) => [
          `${row.questionId}|${row.criterion}`,
          row,
        ]),
      ),
    ]),
  );
  const representedReviewers = new Set<string>();
  const seenRows = new Set<string>();
  for (const [index, submission] of merged.submissions.entries()) {
    if (!reviewerIds.has(submission.reviewerId)) {
      issues.push({
        code: 'MERGED_REVIEW_REVIEWER_UNKNOWN',
        message: `Submission ${index + 1} references unregistered reviewer ${submission.reviewerId}.`,
      });
      continue;
    }
    representedReviewers.add(submission.reviewerId);
    const key = `${submission.reviewerId}|${submission.questionId}|${submission.criterion}`;
    if (seenRows.has(key)) {
      issues.push({
        code: 'MERGED_REVIEW_DUPLICATE_ROW',
        message: `Duplicate merged row ${key}.`,
      });
      continue;
    }
    seenRows.add(key);
    const expected = expectedRowsByReviewer
      .get(submission.reviewerId)
      ?.get(`${submission.questionId}|${submission.criterion}`);
    if (!expected) {
      issues.push({
        code: 'MERGED_REVIEW_ROW_UNKNOWN',
        message: `Submission ${key} is not in the campaign criterion matrix.`,
      });
      continue;
    }
    const protectedFields: Array<keyof ReviewSubmission> = [
      'campaignId',
      'campaignHash',
      'bankId',
      'questionId',
      'questionVersion',
      'questionHash',
      'sectionId',
      'objectiveId',
      'format',
      'bloomLevel',
      'difficulty',
      'criterion',
      'reviewerId',
    ];
    const changed = protectedFields.filter(
      (field) => String(submission[field]) !== String(expected[field]),
    );
    if (changed.length > 0) {
      issues.push({
        code: 'MERGED_REVIEW_PROTECTED_METADATA_MISMATCH',
        message: `Submission ${key} changed protected metadata: ${changed.join(', ')}.`,
      });
    }
    if (
      submission.comment !== undefined &&
      (submission.comment.length > MAX_REVIEW_COMMENT_LENGTH ||
        REVIEW_CONTROL_CHARACTERS.test(submission.comment))
    ) {
      issues.push({
        code: 'MERGED_REVIEW_COMMENT_INVALID',
        message: `Submission ${key} contains an invalid comment.`,
      });
    }
    if (submission.comment !== undefined && submission.comment.trim().length === 0) {
      issues.push({
        code: 'MERGED_REVIEW_COMMENT_WHITESPACE',
        message: `Submission ${key} must omit whitespace-only comments.`,
      });
    }
  }
  for (const reviewerId of representedReviewers) {
    const expected = [
      ...(expectedRowsByReviewer.get(reviewerId)?.values() ?? []),
    ];
    const actual = merged.submissions.filter(
      (submission) => submission.reviewerId === reviewerId,
    );
    if (
      expected.length !== actual.length ||
      expected.some(
        (row) =>
          !seenRows.has(`${reviewerId}|${row.questionId}|${row.criterion}`),
      )
    ) {
      issues.push({
        code: 'MERGED_REVIEW_MATRIX_INCOMPLETE',
        message: `${reviewerId} does not have the complete campaign criterion matrix.`,
      });
    }
  }
  const receiptIds = merged.sourcePacks.map((receipt) => receipt.reviewerId);
  if (
    new Set(receiptIds).size !== receiptIds.length ||
    stableReviewHash([...merged.sourcePacks].sort((a, b) =>
      a.reviewerId.localeCompare(b.reviewerId),
    )) !== stableReviewHash(merged.sourcePacks)
  ) {
    issues.push({
      code: 'MERGED_REVIEW_RECEIPT_INVALID',
      message: 'Source-pack receipts must be unique and deterministically ordered.',
    });
  }
  const receiptMap = new Map(
    merged.sourcePacks.map((receipt) => [receipt.reviewerId, receipt]),
  );
  if (
    receiptMap.size !== representedReviewers.size ||
    [...representedReviewers].some((reviewerId) => !receiptMap.has(reviewerId))
  ) {
    issues.push({
      code: 'MERGED_REVIEW_RECEIPT_MISMATCH',
      message: 'Source-pack receipts do not match represented reviewers.',
    });
  }
  for (const reviewerId of representedReviewers) {
    const rows = merged.submissions.filter(
      (submission) => submission.reviewerId === reviewerId,
    );
    const receipt = receiptMap.get(reviewerId);
    const expectedHash = normalizedReviewerPackHash({
      reviewerId,
      submissions: rows,
    });
    if (
      !receipt ||
      receipt.rowCount !== rows.length ||
      receipt.packHash !== expectedHash
    ) {
      issues.push({
        code: 'MERGED_REVIEW_SOURCE_PACK_STALE',
        message: `Source-pack receipt for ${reviewerId} does not match normalized rows.`,
      });
    }
  }
  return {
    ...(issues.length === 0
      ? { merged: merged as ValidatedMergedReviewSubmissions }
      : {}),
    issues,
  };
}

export function mergeReviewerPacks(input: {
  manifest: ReviewCampaignManifest;
  bank: QuestionBank;
  packs: ReviewerPackInput[];
}): {
  merged?: ValidatedMergedReviewSubmissions;
  issues: ReviewDiagnostic[];
} {
  const issues: ReviewDiagnostic[] = [];
  const submissions: ReviewSubmission[] = [];
  const sourcePacks: ReviewSourcePackReceipt[] = [];
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
    if (validated.packHash) {
      sourcePacks.push({
        reviewerId,
        packHash: validated.packHash,
        rowCount: validated.submissions.length,
      });
    }
  }

  if (issues.length > 0) return { issues };
  const withoutHash: Omit<MergedReviewSubmissions, 'mergedHash'> = {
    schemaVersion: 1,
    campaignId: input.manifest.id,
    campaignHash: input.manifest.campaignHash,
    bankId: input.manifest.bankId,
    bankHash: input.manifest.bankHash,
    sourcePacks: [...sourcePacks].sort((left, right) =>
      left.reviewerId.localeCompare(right.reviewerId),
    ),
    submissions: sortSubmissions(submissions),
  };
  const candidate: MergedReviewSubmissions = {
    ...withoutHash,
    mergedHash: mergedSubmissionsHash(withoutHash),
  };
  return validateMergedReviewSubmissions({
    value: candidate,
    manifest: input.manifest,
    bank: input.bank,
  });
}

const escapeCsv = (value: string | number): string => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function mergedSubmissionsCsv(
  merged: MergedReviewSubmissions,
): string {
  const headers = ['mergedHash', ...CAMPAIGN_REVIEW_HEADERS] as const;
  return `${headers.join(',')}\n${merged.submissions
    .map((submission) => {
      const row = {
        mergedHash: merged.mergedHash,
        ...submission,
        rating: submission.rating === undefined ? '' : String(submission.rating),
        comment: submission.comment ?? '',
      };
      return headers.map((header) => escapeCsv(row[header])).join(',');
    })
    .join('\n')}\n`;
}
