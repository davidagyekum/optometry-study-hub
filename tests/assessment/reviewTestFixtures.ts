import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousBlueprint } from '@/content/question-bank/opt376/aqueous-vitreous/blueprint';
import { aqueousVitreousReviewPolicy } from '@/content/question-bank/opt376/aqueous-vitreous/reviewPolicy';
import { createReviewCampaignManifest } from '@/lib/assessment/review/campaignManifest';
import type {
  ReviewCampaignManifest,
  ReviewerProfile,
} from '@/lib/assessment/review/campaignTypes';
import {
  campaignReviewRows,
  campaignRowsToCsv,
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
): ReviewCampaignManifest {
  return createReviewCampaignManifest({
    campaignId: 'test-aqueous-review',
    createdAt: '2000-01-01T00:00:00.000Z',
    ...reviewTestContext,
    reviewers,
  });
}

export function reviewerCsv(
  reviewerId: string,
  options: {
    rating?: string;
    commentAt?: { questionId: string; criterion: string; comment: string };
  } = {},
): string {
  const manifest = syntheticCampaign();
  const rows = campaignReviewRows(
    manifest,
    aqueousVitreousCandidateBank,
    reviewerId,
  ).map((row) => ({
    ...row,
    rating: options.rating ?? '',
    comment:
      options.commentAt?.questionId === row.questionId &&
      options.commentAt.criterion === row.criterion
        ? options.commentAt.comment
        : '',
  }));
  return campaignRowsToCsv(rows);
}
