import { z } from 'zod';
import { STABLE_ID_PATTERN } from '@/lib/assessment/constants';
import {
  gradingPolicyReferenceSchema,
  persistedGradingSnapshotSchema,
} from '@/lib/assessment/grading/schemas';

const legacyStringRecordSchema = z.record(z.string(), z.string());
const legacyStringArrayRecordSchema = z.record(z.string(), z.array(z.string()));
const stableIdSchema = z.string().regex(STABLE_ID_PATTERN, 'Expected a stable slug-style ID');
const isoDatetimeSchema = z.iso.datetime();

function uniqueStableIdArray(minimum = 0) {
  return z.array(stableIdSchema).min(minimum).superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: 'custom',
        message: 'Stable identifiers must be unique.',
      });
    }
  });
}

const stableIdRecordSchema = z.record(stableIdSchema, stableIdSchema);
const stableIdVersionRecordSchema = z.record(
  stableIdSchema,
  z.number().int().positive(),
);
const stableIdArrayRecordSchema = z.record(
  stableIdSchema,
  uniqueStableIdArray(),
);

function hasExactKeys(record: Record<string, unknown>, expected: string[]): boolean {
  const keys = Object.keys(record);
  if (keys.length !== expected.length) return false;
  const expectedSet = new Set(expected);
  return keys.every((key) => expectedSet.has(key));
}

function addIssue(
  context: z.RefinementCtx,
  path: PropertyKey[],
  message: string,
): void {
  context.addIssue({
    code: 'custom',
    path,
    message,
  });
}

export const legacyAttemptSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  startedAt: z.string(),
  order: z.array(z.string()),
  optionOrder: legacyStringArrayRecordSchema,
  answers: legacyStringRecordSchema,
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
  read: legacyStringArrayRecordSchema,
  active: z.record(z.string(), legacyAttemptSchema.optional()),
  results: z.record(z.string(), z.array(legacyResultSchema)),
});

export const persistedResponseSchema = z.discriminatedUnion('format', [
  z.strictObject({
    format: z.literal('single_best_answer'),
    optionId: stableIdSchema,
  }),
  z.strictObject({
    format: z.literal('multiple_response'),
    optionIds: uniqueStableIdArray(),
  }),
  z.strictObject({
    format: z.literal('ordering'),
    itemIds: uniqueStableIdArray(),
  }),
  z.strictObject({
    format: z.literal('matching'),
    matches: stableIdRecordSchema,
  }),
  z.strictObject({
    format: z.literal('extended_matching'),
    answers: stableIdRecordSchema,
  }),
  z.strictObject({
    format: z.literal('image_hotspot'),
    regionIds: uniqueStableIdArray(),
  }),
  z.strictObject({
    format: z.literal('image_label'),
    matches: stableIdRecordSchema,
  }),
  z.strictObject({ format: z.literal('short_answer'), text: z.string() }),
  z.strictObject({ format: z.literal('open_response'), text: z.string() }),
]);

const assessmentAttemptSnapshotBaseSchema = z.strictObject({
  id: stableIdSchema,
  mode: z.enum(['study', 'exam', 'mastery']),
  courseId: stableIdSchema,
  moduleId: stableIdSchema,
  blueprintId: stableIdSchema.optional(),
  gradingPolicy: gradingPolicyReferenceSchema.optional(),
  startedAt: isoDatetimeSchema,
  orderedQuestionIds: uniqueStableIdArray(1),
  questionVersions: stableIdVersionRecordSchema,
  optionOrder: stableIdArrayRecordSchema,
  responses: z.record(stableIdSchema, persistedResponseSchema),
  flags: uniqueStableIdArray(),
  currentIndex: z.number().int().nonnegative(),
});

export const assessmentAttemptSnapshotSchema = assessmentAttemptSnapshotBaseSchema
  .superRefine((attempt, context) => {
    const questionIds = new Set(attempt.orderedQuestionIds);
    if (attempt.currentIndex >= attempt.orderedQuestionIds.length) {
      addIssue(context, ['currentIndex'], 'Current index must reference a question in the attempt.');
    }
    if (!hasExactKeys(attempt.questionVersions, attempt.orderedQuestionIds)) {
      addIssue(
        context,
        ['questionVersions'],
        'Question versions must exactly cover the ordered question identifiers.',
      );
    }
    for (const [field, ids] of [
      ['responses', Object.keys(attempt.responses)],
      ['optionOrder', Object.keys(attempt.optionOrder)],
      ['flags', attempt.flags],
    ] as const) {
      if (ids.some((id) => !questionIds.has(id))) {
        addIssue(context, [field], `${field} may reference only questions in the attempt.`);
      }
    }
  });

const assessmentResultSnapshotBaseSchema = z.strictObject({
  id: stableIdSchema,
  attemptId: stableIdSchema,
  courseId: stableIdSchema,
  moduleId: stableIdSchema,
  submittedAt: isoDatetimeSchema,
  orderedQuestionIds: uniqueStableIdArray(1),
  questionVersions: stableIdVersionRecordSchema,
  responses: z.record(stableIdSchema, persistedResponseSchema),
  gradingPolicy: gradingPolicyReferenceSchema.optional(),
  grading: persistedGradingSnapshotSchema.optional(),
  score: z.number().nonnegative().nullable(),
  maxScore: z.number().nonnegative().nullable(),
});

export const assessmentResultSnapshotSchema = assessmentResultSnapshotBaseSchema
  .superRefine((result, context) => {
    const questionIds = new Set(result.orderedQuestionIds);
    if (!hasExactKeys(result.questionVersions, result.orderedQuestionIds)) {
      addIssue(
        context,
        ['questionVersions'],
        'Question versions must exactly cover the ordered question identifiers.',
      );
    }
    if (Object.keys(result.responses).some((id) => !questionIds.has(id))) {
      addIssue(context, ['responses'], 'Responses may reference only questions in the result.');
    }
    const { score, maxScore } = result;
    if ((score === null) !== (maxScore === null)) {
      addIssue(
        context,
        ['maxScore'],
        'Score and maxScore must either both be null or both be numeric.',
      );
    }
    if (maxScore !== null && maxScore <= 0) {
      addIssue(
        context,
        ['maxScore'],
        'A numeric maxScore must be greater than zero.',
      );
    }
    if (
      result.score !== null
      && result.maxScore !== null
      && result.score > result.maxScore
    ) {
      addIssue(context, ['score'], 'Score cannot exceed maxScore.');
    }
    if (result.grading) {
      if (
        !result.gradingPolicy
        || result.grading.policy.id !== result.gradingPolicy.id
        || result.grading.policy.version !== result.gradingPolicy.version
      ) {
        addIssue(
          context,
          ['grading', 'policy'],
          'Persisted grading policy must equal the result grading-policy reference.',
        );
      }
      if (!hasExactKeys(result.grading.questionGrades, result.orderedQuestionIds)) {
        addIssue(
          context,
          ['grading', 'questionGrades'],
          'Persisted question grades must exactly cover the result question order.',
        );
      }
      Object.entries(result.grading.questionGrades).forEach(([key, grade]) => {
        if (grade.questionId !== key) {
          addIssue(
            context,
            ['grading', 'questionGrades', key, 'questionId'],
            'Question-grade IDs must match their record keys.',
          );
        }
        if (result.questionVersions[key] !== grade.questionVersion) {
          addIssue(
            context,
            ['grading', 'questionGrades', key, 'questionVersion'],
            'Question-grade versions must match the persisted result versions.',
          );
        }
      });
      if (result.grading.status === 'complete') {
        if (
          result.score !== result.grading.score
          || result.maxScore !== result.grading.maxScore
        ) {
          addIssue(
            context,
            ['grading', 'score'],
            'Complete grading totals must equal the result score and maximum.',
          );
        }
      } else if (result.score !== null || result.maxScore !== null) {
        addIssue(
          context,
          ['grading', 'status'],
          'Manual-required grading requires null result score and maximum.',
        );
      }
    }
  });

export const questionHistoryRecordSchema = z.strictObject({
  questionId: stableIdSchema,
  version: z.number().int().positive(),
  attemptCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  lastAnsweredAt: isoDatetimeSchema.optional(),
}).superRefine((record, context) => {
  if (record.correctCount > record.attemptCount) {
    addIssue(context, ['correctCount'], 'Correct count cannot exceed attempt count.');
  }
});

export const storeV2Schema = z.strictObject({
  version: z.literal(2),
  read: legacyStringArrayRecordSchema,
  active: z.record(z.string(), legacyAttemptSchema.optional()),
  results: z.record(z.string(), z.array(legacyResultSchema)),
  assessment: z.strictObject({
    activeAttempts: z.record(stableIdSchema, assessmentAttemptSnapshotSchema),
    results: z.record(stableIdSchema, assessmentResultSnapshotSchema),
    questionHistory: z.record(stableIdSchema, questionHistoryRecordSchema),
  }),
}).superRefine((store, context) => {
  Object.entries(store.assessment.activeAttempts).forEach(([key, attempt]) => {
    if (attempt.id !== key) {
      addIssue(
        context,
        ['assessment', 'activeAttempts', key, 'id'],
        `Active-attempt ID "${attempt.id}" must match its record key "${key}".`,
      );
    }
  });
  Object.entries(store.assessment.results).forEach(([key, result]) => {
    if (result.id !== key) {
      addIssue(
        context,
        ['assessment', 'results', key, 'id'],
        `Assessment-result ID "${result.id}" must match its record key "${key}".`,
      );
    }
  });
  Object.entries(store.assessment.questionHistory).forEach(([key, history]) => {
    if (history.questionId !== key) {
      addIssue(
        context,
        ['assessment', 'questionHistory', key, 'questionId'],
        `Question-history ID "${history.questionId}" must match its record key "${key}".`,
      );
    }
  });
});

export type PersistedResponse = z.infer<typeof persistedResponseSchema>;
export type AssessmentAttemptSnapshot = z.infer<typeof assessmentAttemptSnapshotSchema>;
export type AssessmentResultSnapshot = z.infer<typeof assessmentResultSnapshotSchema>;
export type QuestionHistoryRecord = z.infer<typeof questionHistoryRecordSchema>;
export type StoreV2 = z.infer<typeof storeV2Schema>;
