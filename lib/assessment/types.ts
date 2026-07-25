import type { z } from 'zod';
import type {
  assessmentQuestionSchema,
  bloomLevelSchema,
  difficultySchema,
  learningObjectiveSchema,
  questionBankSchema,
  questionFormatSchema,
  questionOptionSchema,
  reviewStatusSchema,
  sourceReferenceSchema,
  stimulusTypeSchema,
} from '@/lib/assessment/schemas';

export type BloomLevel = z.infer<typeof bloomLevelSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type QuestionFormat = z.infer<typeof questionFormatSchema>;
export type StimulusType = z.infer<typeof stimulusTypeSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type LearningObjective = z.infer<typeof learningObjectiveSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type QuestionBank = z.infer<typeof questionBankSchema>;
