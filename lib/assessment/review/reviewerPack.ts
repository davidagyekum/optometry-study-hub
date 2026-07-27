import type { QuestionBank } from '@/lib/assessment/types';
import { buildReviewPackRows, parseCsv } from './reviewPack';
import type {
  ReviewCampaignManifest,
  ReviewDiagnostic,
  ReviewPackEntry,
  ReviewSubmission,
} from './campaignTypes';
import { reviewSubmissionSchema } from './campaignSchemas';
import { normalizeCampaignReviewerId } from './reviewerProfiles';
import { stableReviewHash } from './stableReviewHash';

export const CAMPAIGN_REVIEW_HEADERS = [
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
  'rating',
  'comment',
] as const;

const escapeCsv = (value: string | number): string => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function campaignReviewRows(
  manifest: ReviewCampaignManifest,
  bank: QuestionBank,
  reviewerId: string,
): ReviewPackEntry[] {
  if (!manifest.reviewers.some((reviewer) => reviewer.id === reviewerId)) {
    throw new Error(`Reviewer "${reviewerId}" is not registered in the campaign.`);
  }
  return buildReviewPackRows(bank).map((row) => ({
    campaignId: manifest.id,
    campaignHash: manifest.campaignHash,
    bankId: row.bankId,
    questionId: row.questionId,
    questionVersion: row.questionVersion,
    questionHash: row.questionHash,
    sectionId: row.sectionId,
    objectiveId: row.objectiveId,
    format: row.format as ReviewPackEntry['format'],
    bloomLevel: row.bloomLevel as ReviewPackEntry['bloomLevel'],
    difficulty: row.difficulty as ReviewPackEntry['difficulty'],
    criterion: row.criterion,
    reviewerId,
    rating: '',
    comment: '',
  }));
}

export function campaignRowsToCsv(rows: ReviewPackEntry[]): string {
  return `${CAMPAIGN_REVIEW_HEADERS.join(',')}\n${rows
    .map((row) =>
      CAMPAIGN_REVIEW_HEADERS.map((header) => escapeCsv(row[header])).join(','),
    )
    .join('\n')}\n`;
}

function rowRecord(
  values: string[],
): Record<(typeof CAMPAIGN_REVIEW_HEADERS)[number], string> {
  return Object.fromEntries(
    CAMPAIGN_REVIEW_HEADERS.map((header, column) => [
      header,
      values[column] ?? '',
    ]),
  ) as Record<(typeof CAMPAIGN_REVIEW_HEADERS)[number], string>;
}

export const REVIEW_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
export const MAX_REVIEW_COMMENT_LENGTH = 10_000;

export function normalizedReviewerPackHash(input: {
  reviewerId: string;
  submissions: ReviewSubmission[];
}): string {
  return stableReviewHash({
    reviewerId: input.reviewerId,
    submissions: [...input.submissions].sort((left, right) =>
      [left.questionId, left.criterion]
        .join('|')
        .localeCompare([right.questionId, right.criterion].join('|')),
    ),
  });
}

export function validateReviewerPack(input: {
  csv: string;
  manifest: ReviewCampaignManifest;
  bank: QuestionBank;
  expectedReviewerId: string;
}): {
  submissions: ReviewSubmission[];
  rows: ReviewPackEntry[];
  issues: ReviewDiagnostic[];
  packHash?: string;
} {
  const parsed = parseCsv(input.csv);
  const issues: ReviewDiagnostic[] = parsed.issues.map((issue) => ({
    ...issue,
  }));
  const submissions: ReviewSubmission[] = [];
  const rows: ReviewPackEntry[] = [];
  const header = parsed.rows[0];
  if (
    !header ||
    header.values.length !== CAMPAIGN_REVIEW_HEADERS.length ||
    CAMPAIGN_REVIEW_HEADERS.some(
      (name, index) => header.values[index] !== name,
    )
  ) {
    return {
      submissions,
      rows,
      issues: [
        ...issues,
        {
          code: 'REVIEW_PACK_HEADERS_INVALID',
          message: 'Campaign review-pack headers do not match exactly.',
          row: header?.row,
        },
      ],
    };
  }

  const expectedRows = campaignReviewRows(
    input.manifest,
    input.bank,
    input.expectedReviewerId,
  );
  const expectedByKey = new Map(
    expectedRows.map((row) => [`${row.questionId}|${row.criterion}`, row]),
  );
  const seen = new Set<string>();
  for (const parsedRow of parsed.rows.slice(1)) {
    if (parsedRow.values.length !== CAMPAIGN_REVIEW_HEADERS.length) {
      issues.push({
        code: 'REVIEW_PACK_ROW_WIDTH_INVALID',
        message: `Expected ${CAMPAIGN_REVIEW_HEADERS.length} columns; found ${parsedRow.values.length}.`,
        row: parsedRow.row,
      });
      continue;
    }
    const raw = rowRecord(parsedRow.values);
    const key = `${raw.questionId}|${raw.criterion}`;
    const expected = expectedByKey.get(key);
    if (!expected) {
      issues.push({
        code: 'REVIEW_PACK_ROW_UNEXPECTED',
        message: `Unexpected review row ${key}.`,
        row: parsedRow.row,
      });
      continue;
    }
    if (seen.has(key)) {
      issues.push({
        code: 'REVIEW_PACK_DUPLICATE_ROW',
        message: `Duplicate review row ${key}.`,
        row: parsedRow.row,
      });
      continue;
    }
    seen.add(key);
    const normalizedReviewer = normalizeCampaignReviewerId(raw.reviewerId);
    const exactFields: Array<keyof ReviewPackEntry> = [
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
    ];
    const mismatches = exactFields.filter(
      (field) => String(expected[field]) !== raw[field],
    );
    if (
      raw.campaignId !== input.manifest.id ||
      raw.campaignHash !== input.manifest.campaignHash
    ) {
      issues.push({
        code: 'REVIEW_CAMPAIGN_MISMATCH',
        message: `Row campaign evidence does not match immutable campaign ${input.manifest.id}.`,
        row: parsedRow.row,
      });
    }
    if (
      raw.questionHash !== expected.questionHash ||
      raw.questionVersion !== String(expected.questionVersion)
    ) {
      issues.push({
        code: 'REVIEW_EVIDENCE_STALE',
        message: `Row ${key} is bound to stale question evidence.`,
        row: parsedRow.row,
      });
    } else if (mismatches.length > 0) {
      issues.push({
        code: 'REVIEW_PACK_ROW_UNEXPECTED',
        message: `Row ${key} changed protected metadata: ${mismatches.join(', ')}.`,
        row: parsedRow.row,
      });
    }
    if (normalizedReviewer !== input.expectedReviewerId) {
      issues.push({
        code: 'REVIEW_REVIEWER_MISMATCH',
        message: `Row reviewer ${raw.reviewerId} does not match ${input.expectedReviewerId}.`,
        row: parsedRow.row,
      });
    }
    if (raw.rating && !/^[1-5]$/.test(raw.rating)) {
      issues.push({
        code: 'REVIEW_RATING_INVALID',
        message: `Rating "${raw.rating}" must be blank or an integer from 1 to 5.`,
        row: parsedRow.row,
      });
    }
    if (raw.comment.length > MAX_REVIEW_COMMENT_LENGTH) {
      issues.push({
        code: 'REVIEW_COMMENT_TOO_LONG',
        message: `Comment exceeds ${MAX_REVIEW_COMMENT_LENGTH} characters.`,
        row: parsedRow.row,
      });
    }
    if (REVIEW_CONTROL_CHARACTERS.test(raw.comment)) {
      issues.push({
        code: 'REVIEW_CONTROL_CHARACTER',
        message: 'Comment contains a disallowed control character.',
        row: parsedRow.row,
      });
    }
    const issueCount = issues.filter((issue) => issue.row === parsedRow.row).length;
    const normalizedComment = raw.comment.trim().length === 0 ? undefined : raw.comment;
    const entry: ReviewPackEntry = {
      ...expected,
      reviewerId: normalizedReviewer,
      rating: raw.rating,
      comment: normalizedComment ?? '',
    };
    rows.push(entry);
    if (issueCount === 0) {
      const submission: ReviewSubmission = {
        campaignId: expected.campaignId,
        campaignHash: expected.campaignHash,
        bankId: expected.bankId,
        questionId: expected.questionId,
        questionVersion: expected.questionVersion,
        questionHash: expected.questionHash,
        sectionId: expected.sectionId,
        objectiveId: expected.objectiveId,
        format: expected.format,
        bloomLevel: expected.bloomLevel,
        difficulty: expected.difficulty,
        criterion: expected.criterion,
        reviewerId: normalizedReviewer,
        ...(raw.rating ? { rating: Number(raw.rating) } : {}),
        ...(normalizedComment ? { comment: normalizedComment } : {}),
      };
      const runtime = reviewSubmissionSchema.safeParse(submission);
      if (!runtime.success) {
        issues.push({
          code: 'REVIEW_SUBMISSION_INVALID',
          message: runtime.error.issues.map((issue) => issue.message).join('; '),
          row: parsedRow.row,
        });
      } else {
        submissions.push(runtime.data as ReviewSubmission);
      }
    }
  }
  for (const expected of expectedRows) {
    const key = `${expected.questionId}|${expected.criterion}`;
    if (!seen.has(key)) {
      issues.push({
        code: 'REVIEW_PACK_ROW_MISSING',
        message: `Missing review row ${key}.`,
      });
    }
  }
  return {
    submissions,
    rows,
    issues,
    ...(issues.length === 0
      ? {
          packHash: normalizedReviewerPackHash({
            reviewerId: input.expectedReviewerId,
            submissions,
          }),
        }
      : {}),
  };
}

export function submissionsToCsv(submissions: ReviewSubmission[]): string {
  return campaignRowsToCsv(
    submissions.map((submission) => ({
      ...submission,
      rating: submission.rating === undefined ? '' : String(submission.rating),
      comment: submission.comment ?? '',
    })),
  );
}
