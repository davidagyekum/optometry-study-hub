import { z } from 'zod';
import { STABLE_ID_PATTERN } from '@/lib/assessment/constants';
import { questionFormatSchema } from '@/lib/assessment/schemas';

const stableIdSchema = z.string().regex(STABLE_ID_PATTERN, 'Expected a stable slug-style ID');
const finiteNonnegativeSchema = z.number().finite().nonnegative();

export const gradingPolicyReferenceSchema = z.strictObject({
  id: stableIdSchema,
  version: z.number().int().positive(),
});

export const questionGradeStatusSchema = z.enum([
  'correct',
  'incorrect',
  'partial',
  'unanswered',
  'manual_required',
]);

export const questionGradeOutcomeSchema = z.strictObject({
  questionId: stableIdSchema,
  questionVersion: z.number().int().positive(),
  format: questionFormatSchema,
  status: questionGradeStatusSchema,
  score: z.number().finite().min(0).max(1).nullable(),
  maxScore: z.literal(1),
  correctParts: z.number().int().nonnegative().optional(),
  totalParts: z.number().int().positive().optional(),
}).superRefine((grade, context) => {
  const expectedScore = {
    correct: 1,
    incorrect: 0,
    unanswered: 0,
    manual_required: null,
  } as const;
  if (grade.status === 'partial') {
    if (grade.score === null || grade.score <= 0 || grade.score >= 1) {
      context.addIssue({
        code: 'custom',
        path: ['score'],
        message: 'Partial grades require a score strictly between zero and one.',
      });
    }
  } else if (grade.score !== expectedScore[grade.status]) {
    context.addIssue({
      code: 'custom',
      path: ['score'],
      message: `Grade status "${grade.status}" has an invalid score.`,
    });
  }
  const hasCorrectParts = grade.correctParts !== undefined;
  const hasTotalParts = grade.totalParts !== undefined;
  if (hasCorrectParts !== hasTotalParts) {
    context.addIssue({
      code: 'custom',
      path: ['correctParts'],
      message: 'correctParts and totalParts must be present together.',
    });
  }
  if (
    grade.correctParts !== undefined
    && grade.totalParts !== undefined
    && grade.correctParts > grade.totalParts
  ) {
    context.addIssue({
      code: 'custom',
      path: ['correctParts'],
      message: 'correctParts cannot exceed totalParts.',
    });
  }
});

const gradingReportShape = {
  policy: gradingPolicyReferenceSchema,
  status: z.enum(['complete', 'manual_required']),
  questionGrades: z.record(stableIdSchema, questionGradeOutcomeSchema),
  score: finiteNonnegativeSchema.nullable(),
  maxScore: finiteNonnegativeSchema.nullable(),
  autoScore: finiteNonnegativeSchema,
  autoMaxScore: finiteNonnegativeSchema,
  correctCount: z.number().int().nonnegative(),
  partialCount: z.number().int().nonnegative(),
  incorrectCount: z.number().int().nonnegative(),
  unansweredCount: z.number().int().nonnegative(),
  manualRequiredCount: z.number().int().nonnegative(),
};

export function roundGradingScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function validateGradingReport(
  report: z.infer<z.ZodObject<typeof gradingReportShape>>,
  context: z.RefinementCtx,
): void {
  const entries = Object.entries(report.questionGrades);
  entries.forEach(([key, grade]) => {
    if (grade.questionId !== key) {
      context.addIssue({
        code: 'custom',
        path: ['questionGrades', key, 'questionId'],
        message: 'Question-grade IDs must match their record keys.',
      });
    }
  });
  const numeric = entries
    .map(([, grade]) => grade)
    .filter((grade) => grade.score !== null);
  const expectedAutoScore = roundGradingScore(
    numeric.reduce((sum, grade) => sum + (grade.score ?? 0), 0),
  );
  const expectedAutoMax = numeric.reduce((sum, grade) => sum + grade.maxScore, 0);
  const counts = {
    correctCount: entries.filter(([, grade]) => grade.status === 'correct').length,
    partialCount: entries.filter(([, grade]) => grade.status === 'partial').length,
    incorrectCount: entries.filter(([, grade]) => grade.status === 'incorrect').length,
    unansweredCount: entries.filter(([, grade]) => grade.status === 'unanswered').length,
    manualRequiredCount: entries.filter(
      ([, grade]) => grade.status === 'manual_required',
    ).length,
  };
  if (report.autoScore !== expectedAutoScore) {
    context.addIssue({
      code: 'custom',
      path: ['autoScore'],
      message: 'autoScore must equal the rounded sum of numeric question scores.',
    });
  }
  if (report.autoMaxScore !== expectedAutoMax) {
    context.addIssue({
      code: 'custom',
      path: ['autoMaxScore'],
      message: 'autoMaxScore must equal the sum of numeric question maxima.',
    });
  }
  (Object.keys(counts) as Array<keyof typeof counts>).forEach((key) => {
    if (report[key] !== counts[key]) {
      context.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} must equal the actual outcome count.`,
      });
    }
  });
  if (counts.manualRequiredCount === 0) {
    if (
      report.status !== 'complete'
      || report.score !== report.autoScore
      || report.maxScore !== report.autoMaxScore
    ) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Complete reports require numeric totals equal to their automatic totals.',
      });
    }
  } else if (
    report.status !== 'manual_required'
    || report.score !== null
    || report.maxScore !== null
  ) {
    context.addIssue({
      code: 'custom',
      path: ['status'],
      message: 'Reports with manual outcomes require manual_required status and null totals.',
    });
  }
}

export const assessmentGradingReportSchema = z.strictObject(gradingReportShape)
  .superRefine(validateGradingReport);

export const persistedGradingSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  ...gradingReportShape,
}).superRefine(validateGradingReport);
