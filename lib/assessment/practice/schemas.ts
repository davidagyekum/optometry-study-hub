import { z } from 'zod';
import { STABLE_ID_PATTERN } from '@/lib/assessment/constants';
import {
  difficultySchema,
  questionFormatSchema,
  reviewStatusSchema,
} from '@/lib/assessment/schemas';
import { gradingPolicyReferenceSchema } from '@/lib/assessment/grading/schemas';

const stableIdSchema = z.string().regex(STABLE_ID_PATTERN);
const uniqueIds = z.array(stableIdSchema).min(1).refine(
  (values) => new Set(values).size === values.length,
  'Identifiers must be unique.',
);

export const practiceStrategySchema = z.enum([
  'mixed',
  'unseen',
  'retry-missed',
  'weak-topics',
  'challenge',
  'custom',
]);

export const practiceCountMapSchema = z.record(
  z.string().trim().min(1),
  z.number().int().nonnegative(),
);

export const practiceProfileSchema = z.strictObject({
  id: stableIdSchema,
  label: z.string().trim().min(1),
  count: z.number().int().positive(),
  sectionTargets: practiceCountMapSchema.optional(),
  formatTargets: practiceCountMapSchema.optional(),
  difficultyTargets: practiceCountMapSchema.optional(),
  higherOrderMinimum: z.number().int().nonnegative().default(0),
  higherOrderMaximum: z.number().int().nonnegative().optional(),
  requiredObjectiveIds: uniqueIds.optional(),
  recommended: z.boolean().optional(),
});

export const practiceBlueprintSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: stableIdSchema,
  practiceFamilyId: stableIdSchema,
  courseId: stableIdSchema,
  moduleId: stableIdSchema,
  allowedReviewStatuses: z.array(reviewStatusSchema).min(1),
  defaultMode: z.enum(['study', 'exam', 'mastery']),
  gradingPolicy: gradingPolicyReferenceSchema,
  eligibleFormats: z.array(questionFormatSchema).min(1),
  resultMode: z.enum(['automatic', 'manual-only']),
  profiles: z.array(practiceProfileSchema).min(1),
  maximumFamilyRepetition: z.number().int().positive(),
  historyPolicy: z.enum(['disabled', 'scored', 'encounter-and-manual']),
  sectionIds: uniqueIds,
  custom: z.strictObject({
    minimumCount: z.number().int().positive(),
    maximumCount: z.number().int().positive(),
  }).optional(),
  writtenPracticeAvailable: z.boolean().default(false),
}).superRefine((blueprint, context) => {
  const profileIds = blueprint.profiles.map((profile) => profile.id);
  if (new Set(profileIds).size !== profileIds.length) {
    context.addIssue({ code: 'custom', path: ['profiles'], message: 'Profile IDs must be unique.' });
  }
  if (
    blueprint.custom
    && blueprint.custom.minimumCount > blueprint.custom.maximumCount
  ) {
    context.addIssue({
      code: 'custom',
      path: ['custom'],
      message: 'Custom minimum cannot exceed maximum.',
    });
  }
  if (new Set(blueprint.eligibleFormats).size !== blueprint.eligibleFormats.length) {
    context.addIssue({ code: 'custom', path: ['eligibleFormats'], message: 'Eligible formats must be unique.' });
  }
  if (new Set(blueprint.allowedReviewStatuses).size !== blueprint.allowedReviewStatuses.length) {
    context.addIssue({ code: 'custom', path: ['allowedReviewStatuses'], message: 'Allowed review statuses must be unique.' });
  }
  blueprint.profiles.forEach((profile, index) => {
    (['sectionTargets', 'formatTargets', 'difficultyTargets'] as const).forEach((field) => {
      const targets = profile[field];
      if (targets && Object.values(targets).reduce((sum, count) => sum + count, 0) !== profile.count) {
        context.addIssue({ code: 'custom', path: ['profiles', index, field], message: `${field} must total the profile count.` });
      }
    });
    if (profile.higherOrderMinimum > profile.count) {
      context.addIssue({ code: 'custom', path: ['profiles', index, 'higherOrderMinimum'], message: 'Higher-order minimum cannot exceed profile count.' });
    }
    if (
      profile.higherOrderMaximum !== undefined
      && (
        profile.higherOrderMaximum < profile.higherOrderMinimum
        || profile.higherOrderMaximum > profile.count
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['profiles', index, 'higherOrderMaximum'],
        message: 'Higher-order maximum must be between the minimum and profile count.',
      });
    }
    if (
      profile.requiredObjectiveIds
      && profile.requiredObjectiveIds.length > profile.count
    ) {
      context.addIssue({
        code: 'custom',
        path: ['profiles', index, 'requiredObjectiveIds'],
        message: 'Required objective coverage cannot exceed profile count.',
      });
    }
  });
  if (blueprint.resultMode === 'automatic' && blueprint.eligibleFormats.includes('open_response')) {
    context.addIssue({
      code: 'custom',
      path: ['eligibleFormats'],
      message: 'Automatically scored formats cannot include open response.',
    });
  }
});

export const practiceSelectionSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  blueprintId: stableIdSchema,
  practiceFamilyId: stableIdSchema,
  profileId: stableIdSchema,
  strategy: practiceStrategySchema,
  requestedCount: z.number().int().positive(),
  sectionIds: uniqueIds,
  formats: z.array(questionFormatSchema).min(1).refine(
    (values) => new Set(values).size === values.length,
    'Formats must be unique.',
  ),
  difficulties: z.array(difficultySchema).min(1).refine(
    (values) => new Set(values).size === values.length,
    'Difficulties must be unique.',
  ),
  seed: z.string().trim().min(1),
  resultMode: z.enum(['automatic', 'manual-only']).default('automatic'),
  historyPolicy: z.enum(['disabled', 'scored', 'encounter-and-manual']).default('scored'),
  strategyEligibleQuestionIds: uniqueIds.optional(),
  strategyEvidenceHash: z.string().regex(/^fnv1a-[0-9a-f]{8}$/).optional(),
});
