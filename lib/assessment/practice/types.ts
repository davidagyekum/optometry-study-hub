import type { z } from 'zod';
import type {
  practiceBlueprintSchema,
  practiceProfileSchema,
  practiceSelectionSnapshotSchema,
  practiceStrategySchema,
} from '@/lib/assessment/practice/schemas';
import type { AssessmentQuestion } from '@/lib/assessment/types';

export type PracticeStrategy = z.infer<typeof practiceStrategySchema>;
export type PracticeProfile = z.infer<typeof practiceProfileSchema>;
export type PracticeBlueprint = z.infer<typeof practiceBlueprintSchema>;
export type PracticeSelectionSnapshot = z.infer<typeof practiceSelectionSnapshotSchema>;

export type PracticeIssueCode =
  | 'PRACTICE_BLUEPRINT_INVALID'
  | 'PRACTICE_SELECTION_INVALID'
  | 'PRACTICE_NO_ELIGIBLE_QUESTIONS'
  | 'PRACTICE_INSUFFICIENT_UNSEEN_POOL'
  | 'PRACTICE_INSUFFICIENT_MISSED_POOL'
  | 'PRACTICE_INSUFFICIENT_WEAK_TOPIC_POOL'
  | 'PRACTICE_INSUFFICIENT_CHALLENGE_POOL'
  | 'PRACTICE_INCOMPATIBLE_FILTERS'
  | 'PRACTICE_UNSATISFIABLE_QUOTAS'
  | 'PRACTICE_HISTORY_VERSION_CONFLICT';

export type PracticeIssue = {
  code: PracticeIssueCode;
  message: string;
  path?: string;
  availableCount?: number;
};

export type PracticeResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: PracticeIssue[] };

export type PracticeAssembly = {
  questions: AssessmentQuestion[];
  questionIds: string[];
  selection: PracticeSelectionSnapshot;
  sectionCounts: Record<string, number>;
  formatCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  higherOrderCount: number;
  usedRelaxation: false;
};
