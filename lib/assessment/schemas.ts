import { z } from 'zod';
import {
  BLOOM_LEVELS,
  DIFFICULTIES,
  QUESTION_FORMATS,
  REVIEW_STATUSES,
  SOURCE_KINDS,
  STABLE_ID_PATTERN,
  STIMULUS_TYPES,
} from '@/lib/assessment/constants';

const stableIdSchema = z.string().regex(STABLE_ID_PATTERN, 'Expected a stable slug-style ID');
const nonEmptyTextSchema = z.string().trim().min(1);

export const bloomLevelSchema = z.enum(BLOOM_LEVELS);
export const difficultySchema = z.enum(DIFFICULTIES);
export const reviewStatusSchema = z.enum(REVIEW_STATUSES);
export const questionFormatSchema = z.enum(QUESTION_FORMATS);
export const stimulusTypeSchema = z.enum(STIMULUS_TYPES);
export const sourceKindSchema = z.enum(SOURCE_KINDS);

export const sourceReferenceSchema = z.strictObject({
  id: stableIdSchema,
  title: nonEmptyTextSchema,
  locator: nonEmptyTextSchema.optional(),
  url: z.url().optional(),
  kind: sourceKindSchema,
});

export const questionOptionSchema = z.strictObject({
  id: stableIdSchema,
  text: nonEmptyTextSchema,
  rationale: nonEmptyTextSchema.optional(),
  misconceptionTag: stableIdSchema.optional(),
});

const baseQuestionShape = {
  schemaVersion: z.literal(1),
  id: stableIdSchema,
  familyId: stableIdSchema,
  courseId: stableIdSchema,
  moduleId: stableIdSchema,
  sectionId: stableIdSchema,
  objectiveId: stableIdSchema,
  stimulusType: stimulusTypeSchema,
  bloomLevel: bloomLevelSchema,
  difficulty: difficultySchema,
  stem: z.string(),
  explanation: z.string(),
  noteAnchor: nonEmptyTextSchema,
  misconceptionTags: z.array(stableIdSchema),
  sources: z.array(sourceReferenceSchema),
  author: nonEmptyTextSchema,
  reviewer: nonEmptyTextSchema.optional(),
  reviewStatus: reviewStatusSchema,
  version: z.number().int().positive(),
  estimatedSeconds: z.number().int().positive().optional(),
  allowNegativeStem: z.boolean().optional(),
};

const orderingItemSchema = z.strictObject({
  id: stableIdSchema,
  text: nonEmptyTextSchema,
  rationale: nonEmptyTextSchema.optional(),
});

const matchPromptSchema = z.strictObject({
  id: stableIdSchema,
  text: nonEmptyTextSchema,
});

const matchChoiceSchema = z.strictObject({
  id: stableIdSchema,
  text: nonEmptyTextSchema,
  rationale: nonEmptyTextSchema.optional(),
});

export const assessmentImageSchema = z.strictObject({
  src: nonEmptyTextSchema,
  alt: nonEmptyTextSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const normalizedRegionShape = {
  id: stableIdSchema,
  label: nonEmptyTextSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
};

const imageLabelTargetSchema = z.strictObject({
  id: stableIdSchema,
  label: nonEmptyTextSchema,
  x: z.number(),
  y: z.number(),
});

export const singleBestAnswerQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('single_best_answer'),
  options: z.array(questionOptionSchema).min(3).max(6),
  correctOptionId: stableIdSchema,
});

export const multipleResponseQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('multiple_response'),
  options: z.array(questionOptionSchema).min(3).max(8),
  correctOptionIds: z.array(stableIdSchema).min(2),
  minimumSelections: z.number().int().positive().optional(),
  maximumSelections: z.number().int().positive().optional(),
});

export const orderingQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('ordering'),
  items: z.array(orderingItemSchema).min(3),
  correctOrder: z.array(stableIdSchema).min(3),
});

export const matchingQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('matching'),
  prompts: z.array(matchPromptSchema).min(2),
  choices: z.array(matchChoiceSchema).min(2),
  correctMatches: z.record(z.string(), z.string()),
  reuseChoices: z.boolean().optional(),
});

export const extendedMatchingQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('extended_matching'),
  options: z.array(questionOptionSchema).min(4),
  stems: z.array(matchPromptSchema).min(2),
  correctAnswers: z.record(z.string(), z.string()),
  reuseOptions: z.boolean().optional(),
});

export const imageHotspotQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('image_hotspot'),
  image: assessmentImageSchema,
  regions: z.array(z.strictObject(normalizedRegionShape)).min(1),
  correctRegionIds: z.array(stableIdSchema).min(1),
});

export const imageLabelQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('image_label'),
  image: assessmentImageSchema,
  targets: z.array(imageLabelTargetSchema).min(1),
  labels: z.array(questionOptionSchema).min(1),
  correctLabels: z.record(z.string(), z.string()),
});

export const shortAnswerQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('short_answer'),
  acceptedAnswers: z.array(nonEmptyTextSchema).min(1),
  normalization: z.strictObject({
    trim: z.boolean(),
    caseInsensitive: z.boolean(),
    collapseWhitespace: z.boolean(),
    ignoreTerminalPunctuation: z.boolean(),
  }),
});

export const openResponseQuestionSchema = z.strictObject({
  ...baseQuestionShape,
  format: z.literal('open_response'),
  sampleAnswer: nonEmptyTextSchema.optional(),
  rubric: z.array(nonEmptyTextSchema).min(1),
  autoGraded: z.literal(false),
});

export const assessmentQuestionSchema = z.discriminatedUnion('format', [
  singleBestAnswerQuestionSchema,
  multipleResponseQuestionSchema,
  orderingQuestionSchema,
  matchingQuestionSchema,
  extendedMatchingQuestionSchema,
  imageHotspotQuestionSchema,
  imageLabelQuestionSchema,
  shortAnswerQuestionSchema,
  openResponseQuestionSchema,
]);

export const learningObjectiveSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: stableIdSchema,
  courseId: stableIdSchema,
  moduleId: stableIdSchema,
  sectionId: stableIdSchema.optional(),
  statement: nonEmptyTextSchema,
  targetBloomLevels: z.array(bloomLevelSchema).min(1),
  tags: z.array(stableIdSchema),
  sourceIds: z.array(stableIdSchema),
  reviewStatus: reviewStatusSchema,
});

export const questionBankSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: stableIdSchema,
  title: nonEmptyTextSchema,
  courseIds: z.array(stableIdSchema).min(1),
  objectives: z.array(learningObjectiveSchema),
  questions: z.array(assessmentQuestionSchema),
  sources: z.array(sourceReferenceSchema),
  generatedAt: z.iso.datetime().optional(),
});
