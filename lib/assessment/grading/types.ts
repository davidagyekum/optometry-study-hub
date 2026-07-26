import type {
  AssessmentQuestion,
  QuestionFormat,
} from '@/lib/assessment/types';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type {
  Clock,
  IdFactory,
  SessionIssueCode,
} from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  PersistedResponse,
} from '@/lib/storage/schemas';

export type GradingPolicyReference = {
  id: string;
  version: number;
};

export type GradingPolicy = GradingPolicyReference & {
  diagnosticPartialFormats: readonly QuestionFormat[];
};

export type GradingIssueCode =
  | SessionIssueCode
  | 'GRADING_POLICY_NOT_FOUND'
  | 'GRADING_POLICY_VERSION_UNSUPPORTED'
  | 'GRADING_POLICY_REQUIRED'
  | 'GRADING_POLICY_MISMATCH'
  | 'GRADING_RESPONSE_INVALID'
  | 'GRADING_QUESTION_FORMAT_UNSUPPORTED'
  | 'GRADING_SCORE_INVALID'
  | 'GRADING_ATTEMPT_INVALID'
  | 'GRADING_RESULT_INVALID'
  | 'GRADING_REPORT_INVALID';

export type GradingIssue = {
  code: GradingIssueCode;
  message: string;
  attemptId?: string;
  questionId?: string;
  path?: string;
};

export type GradingSuccess<T> = {
  ok: true;
  value: T;
};

export type GradingFailure = {
  ok: false;
  issues: GradingIssue[];
};

export type GradingResult<T> = GradingSuccess<T> | GradingFailure;

export type QuestionGradeStatus =
  | 'correct'
  | 'incorrect'
  | 'partial'
  | 'unanswered'
  | 'manual_required';

export type QuestionGradeOutcome = {
  questionId: string;
  questionVersion: number;
  format: QuestionFormat;
  status: QuestionGradeStatus;
  score: number | null;
  maxScore: 1;
  correctParts?: number;
  totalParts?: number;
};

export type AssessmentGradingReport = {
  policy: GradingPolicyReference;
  status: 'complete' | 'manual_required';
  questionGrades: Record<string, QuestionGradeOutcome>;
  score: number | null;
  maxScore: number | null;
  autoScore: number;
  autoMaxScore: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  unansweredCount: number;
  manualRequiredCount: number;
};

export type PersistedGradingSnapshot = AssessmentGradingReport & {
  schemaVersion: 1;
};

export type GradeResponseForQuestionInput = {
  question: AssessmentQuestion;
  response?: PersistedResponse;
  policy: GradingPolicyReference;
};

export type GradeAssessmentAttemptInput = {
  attempt: AssessmentAttemptSnapshot;
  registry: QuestionRegistry;
  policy?: GradingPolicyReference;
};

export type GradeAssessmentResultInput = {
  result: AssessmentResultSnapshot;
  registry: QuestionRegistry;
  policy?: GradingPolicyReference;
};

export type FinalizeGradedAssessmentAttemptInput = {
  attempt: AssessmentAttemptSnapshot;
  registry: QuestionRegistry;
  now?: Clock;
  idFactory?: IdFactory;
};

export type FinalizeGradedAssessmentAttemptOutput = {
  result: AssessmentResultSnapshot;
  report: AssessmentGradingReport;
};
