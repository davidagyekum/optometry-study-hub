import { z } from 'zod';

const stringRecordSchema = z.record(z.string(), z.string());
const stringArrayRecordSchema = z.record(z.string(), z.array(z.string()));

export const legacyAttemptSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  startedAt: z.string(),
  order: z.array(z.string()),
  optionOrder: stringArrayRecordSchema,
  answers: stringRecordSchema,
  flags: z.array(z.string()),
  current: z.number().int().nonnegative(),
});

export const legacyResultSchema = legacyAttemptSchema.extend({
  submittedAt: z.string(),
  score: z.number(),
  total: z.number(),
});

export const legacyStoreV1Schema = z.object({
  version: z.literal(1),
  read: stringArrayRecordSchema,
  active: z.record(z.string(), legacyAttemptSchema.optional()),
  results: z.record(z.string(), z.array(legacyResultSchema)),
});

export const persistedResponseSchema = z.discriminatedUnion('format', [
  z.strictObject({ format: z.literal('single_best_answer'), optionId: z.string() }),
  z.strictObject({ format: z.literal('multiple_response'), optionIds: z.array(z.string()) }),
  z.strictObject({ format: z.literal('ordering'), itemIds: z.array(z.string()) }),
  z.strictObject({ format: z.literal('matching'), matches: stringRecordSchema }),
  z.strictObject({ format: z.literal('extended_matching'), answers: stringRecordSchema }),
  z.strictObject({ format: z.literal('image_hotspot'), regionIds: z.array(z.string()) }),
  z.strictObject({ format: z.literal('image_label'), matches: stringRecordSchema }),
  z.strictObject({ format: z.literal('short_answer'), text: z.string() }),
  z.strictObject({ format: z.literal('open_response'), text: z.string() }),
]);

export const assessmentAttemptSnapshotSchema = z.strictObject({
  id: z.string().min(1),
  mode: z.enum(['study', 'exam', 'mastery']),
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  blueprintId: z.string().min(1).optional(),
  startedAt: z.string().min(1),
  orderedQuestionIds: z.array(z.string()),
  questionVersions: z.record(z.string(), z.number().int().positive()),
  optionOrder: stringArrayRecordSchema,
  responses: z.record(z.string(), persistedResponseSchema),
  flags: z.array(z.string()),
  currentIndex: z.number().int().nonnegative(),
});

export const assessmentResultSnapshotSchema = z.strictObject({
  id: z.string().min(1),
  attemptId: z.string().min(1),
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  submittedAt: z.string().min(1),
  orderedQuestionIds: z.array(z.string()),
  questionVersions: z.record(z.string(), z.number().int().positive()),
  responses: z.record(z.string(), persistedResponseSchema),
  score: z.number().nonnegative().nullable(),
  maxScore: z.number().nonnegative().nullable(),
});

export const questionHistoryRecordSchema = z.strictObject({
  questionId: z.string().min(1),
  version: z.number().int().positive(),
  attemptCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  lastAnsweredAt: z.string().min(1).optional(),
});

export const storeV2Schema = z.strictObject({
  version: z.literal(2),
  read: stringArrayRecordSchema,
  active: z.record(z.string(), legacyAttemptSchema.optional()),
  results: z.record(z.string(), z.array(legacyResultSchema)),
  assessment: z.strictObject({
    activeAttempts: z.record(z.string(), assessmentAttemptSnapshotSchema),
    results: z.record(z.string(), assessmentResultSnapshotSchema),
    questionHistory: z.record(z.string(), questionHistoryRecordSchema),
  }),
});

export type PersistedResponse = z.infer<typeof persistedResponseSchema>;
export type AssessmentAttemptSnapshot = z.infer<typeof assessmentAttemptSnapshotSchema>;
export type AssessmentResultSnapshot = z.infer<typeof assessmentResultSnapshotSchema>;
export type QuestionHistoryRecord = z.infer<typeof questionHistoryRecordSchema>;
export type StoreV2 = z.infer<typeof storeV2Schema>;
