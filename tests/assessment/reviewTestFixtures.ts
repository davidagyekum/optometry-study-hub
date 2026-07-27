import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousBlueprint } from '@/content/question-bank/opt376/aqueous-vitreous/blueprint';
import { aqueousVitreousReviewPolicy } from '@/content/question-bank/opt376/aqueous-vitreous/reviewPolicy';
import { createReviewCampaignManifest } from '@/lib/assessment/review/campaignManifest';
import type {
  MergedReviewSubmissions,
  ReviewCampaignManifest,
  ReviewerProfile,
  ReviewSubmission,
} from '@/lib/assessment/review/campaignTypes';
import {
  mergedSubmissionsHash,
  validateMergedReviewSubmissions,
  type ValidatedMergedReviewSubmissions,
} from '@/lib/assessment/review/mergeSubmissions';
import {
  campaignReviewRows,
  campaignRowsToCsv,
  normalizedReviewerPackHash,
} from '@/lib/assessment/review/reviewerPack';

export const syntheticReviewers: ReviewerProfile[] = [
  {
    schemaVersion: 1,
    id: 'reviewer-a',
    roles: ['subject-matter-expert'],
    expertiseTags: ['aqueous-humour'],
    independentReviewAttestation: true,
    conflictOfInterest: { status: 'none' },
    consentToAttribution: false,
  },
  {
    schemaVersion: 1,
    id: 'reviewer-b',
    roles: ['assessment-reviewer'],
    expertiseTags: ['assessment-design'],
    independentReviewAttestation: true,
    conflictOfInterest: { status: 'none' },
    consentToAttribution: false,
  },
  {
    schemaVersion: 1,
    id: 'reviewer-c',
    roles: ['subject-matter-expert', 'review-chair'],
    expertiseTags: ['vitreous'],
    independentReviewAttestation: true,
    conflictOfInterest: { status: 'none' },
    consentToAttribution: false,
  },
];

export const reviewTestContext = {
  bank: aqueousVitreousCandidateBank,
  blueprint: aqueousVitreousBlueprint,
  policy: aqueousVitreousReviewPolicy,
};

export function syntheticCampaign(
  reviewers = syntheticReviewers,
  options: { createdAt?: string; policy?: typeof aqueousVitreousReviewPolicy } = {},
): ReviewCampaignManifest {
  return createReviewCampaignManifest({
    campaignId: 'test-aqueous-review',
    createdAt: options.createdAt ?? '2000-01-01T00:00:00.000Z',
    bank: reviewTestContext.bank,
    blueprint: reviewTestContext.blueprint,
    policy: options.policy ?? reviewTestContext.policy,
    reviewers,
  });
}

export function reviewerCsv(
  reviewerId: string,
  options: {
    manifest?: ReviewCampaignManifest;
    rating?: string;
    rowRating?: (row: {
      questionId: string;
      criterion: string;
    }) => string;
    commentAt?: { questionId: string; criterion: string; comment: string };
  } = {},
): string {
  const manifest = options.manifest ?? syntheticCampaign();
  const rows = campaignReviewRows(
    manifest,
    aqueousVitreousCandidateBank,
    reviewerId,
  ).map((row) => ({
    ...row,
    rating: options.rowRating?.(row) ?? options.rating ?? '',
    comment:
      options.commentAt?.questionId === row.questionId &&
      options.commentAt.criterion === row.criterion
        ? options.commentAt.comment
        : '',
  }));
  return campaignRowsToCsv(rows);
}

export function rebuildValidatedMerged(
  manifest: ReviewCampaignManifest,
  submissions: ReviewSubmission[],
): ValidatedMergedReviewSubmissions {
  const reviewerIds = [
    ...new Set(submissions.map((submission) => submission.reviewerId)),
  ].sort();
  const withoutHash: Omit<MergedReviewSubmissions, 'mergedHash'> = {
    schemaVersion: 1,
    campaignId: manifest.id,
    campaignHash: manifest.campaignHash,
    bankId: manifest.bankId,
    bankHash: manifest.bankHash,
    sourcePacks: reviewerIds.map((reviewerId) => {
      const rows = submissions.filter(
        (submission) => submission.reviewerId === reviewerId,
      );
      return {
        reviewerId,
        packHash: normalizedReviewerPackHash({
          reviewerId,
          submissions: rows,
        }),
        rowCount: rows.length,
      };
    }),
    submissions: [...submissions].sort((left, right) =>
      [left.questionId, left.criterion, left.reviewerId]
        .join('|')
        .localeCompare(
          [right.questionId, right.criterion, right.reviewerId].join('|'),
        ),
    ),
  };
  const candidate: MergedReviewSubmissions = {
    ...withoutHash,
    mergedHash: mergedSubmissionsHash(withoutHash),
  };
  const validated = validateMergedReviewSubmissions({
    value: candidate,
    manifest,
    bank: reviewTestContext.bank,
  });
  if (!validated.merged || validated.issues.length > 0) {
    throw new Error(
      validated.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
    );
  }
  return validated.merged;
}

export function emptyValidatedMerged(
  manifest = syntheticCampaign(),
): ValidatedMergedReviewSubmissions {
  return rebuildValidatedMerged(manifest, []);
}
