import { z } from 'zod';
import {
  bloomLevelSchema,
  difficultySchema,
  questionFormatSchema,
} from '@/lib/assessment/schemas';

const stableSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nonEmpty = z.string().trim().min(1);
const reviewerRole = z.enum([
  'subject-matter-expert',
  'assessment-reviewer',
  'accessibility-reviewer',
  'image-rights-reviewer',
  'review-chair',
]);

export const reviewerProfileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: stableSlug,
  roles: z.array(reviewerRole).min(1),
  expertiseTags: z.array(stableSlug).min(1),
  independentReviewAttestation: z.boolean(),
  conflictOfInterest: z.discriminatedUnion('status', [
    z.strictObject({ status: z.literal('none') }),
    z.strictObject({
      status: z.literal('declared'),
      description: nonEmpty,
    }),
  ]),
  consentToAttribution: z.boolean(),
  displayName: nonEmpty.optional(),
  affiliation: nonEmpty.optional(),
});

export const contentReviewPolicySchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: stableSlug,
  version: z.number().int().positive(),
  minimumUniqueReviewers: z.number().int().positive(),
  flagBelowAikenV: z.number().min(0).max(1),
  lowRatingAtOrBelow: z.number().int().min(1).max(5),
  requiredUniversalCriteria: z.array(stableSlug),
  requiredFormatCriteria: z.record(questionFormatSchema, z.array(stableSlug)),
  blockingCriteria: z.array(stableSlug),
});

export const reviewCampaignQuestionSchema = z.strictObject({
  questionId: stableSlug,
  questionVersion: z.number().int().positive(),
  questionHash: z.string().regex(/^[a-f0-9]{64}$/),
  applicableCriteria: z.array(stableSlug).min(1),
});

export const reviewCampaignManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: stableSlug,
  campaignHash: z.string().regex(/^[a-f0-9]{64}$/),
  bankId: stableSlug,
  bankHash: z.string().regex(/^[a-f0-9]{64}$/),
  policy: z.strictObject({ id: stableSlug, version: z.number().int().positive() }),
  policyHash: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.iso.datetime(),
  questions: z.array(reviewCampaignQuestionSchema).min(1),
  reviewers: z.array(reviewerProfileSchema).min(1),
});

export const reviewSubmissionSchema = z.strictObject({
  campaignId: stableSlug,
  campaignHash: z.string().regex(/^[a-f0-9]{64}$/),
  bankId: stableSlug,
  questionId: stableSlug,
  questionVersion: z.number().int().positive(),
  questionHash: z.string().regex(/^[a-f0-9]{64}$/),
  sectionId: stableSlug,
  objectiveId: stableSlug,
  format: questionFormatSchema,
  bloomLevel: bloomLevelSchema,
  difficulty: difficultySchema,
  criterion: stableSlug,
  reviewerId: stableSlug,
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(10_000).optional(),
});

export const reviewIssueResolutionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  issueId: stableSlug,
  status: z.enum([
    'open',
    'resolved',
    'not-actionable',
    'accepted-for-discussion',
  ]),
  resolution: nonEmpty.optional(),
  resolvedBy: stableSlug.optional(),
  resolvedAt: z.iso.datetime().optional(),
});

export const questionReviewDecisionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: stableSlug,
  campaignId: stableSlug,
  campaignHash: z.string().regex(/^[a-f0-9]{64}$/),
  questionId: stableSlug,
  questionVersion: z.number().int().positive(),
  questionHash: z.string().regex(/^[a-f0-9]{64}$/),
  evidenceBundleHash: z.string().regex(/^[a-f0-9]{64}$/),
  decision: z.enum([
    'revise',
    'retain-draft',
    'eligible-for-reviewed',
    'retire',
  ]),
  decidedBy: stableSlug,
  decidedAt: z.iso.datetime(),
  rationale: nonEmpty,
  resolvedIssueIds: z.array(stableSlug),
});
