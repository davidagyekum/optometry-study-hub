import type { GradingPolicyReference } from '@/lib/assessment/grading/types';
import type {
  AssessmentQuestion,
  QuestionBank,
  ReviewStatus,
} from '@/lib/assessment/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  PersistedResponse,
} from '@/lib/storage/schemas';

export type SessionIssueCode =
  | 'MALFORMED_QUESTION_BANK'
  | 'DUPLICATE_BANK_ID'
  | 'DUPLICATE_QUESTION_ID'
  | 'QUESTION_CONFLICT'
  | 'QUESTION_NOT_FOUND'
  | 'MISSING_QUESTION'
  | 'QUESTION_NOT_ELIGIBLE'
  | 'QUESTION_COURSE_MISMATCH'
  | 'QUESTION_MODULE_MISMATCH'
  | 'DUPLICATE_SESSION_QUESTION'
  | 'EMPTY_SESSION'
  | 'QUESTION_VERSION_MISMATCH'
  | 'INVALID_RANDOM_VALUE'
  | 'INVALID_ATTEMPT_ID'
  | 'INVALID_TIMESTAMP'
  | 'INVALID_ATTEMPT_SNAPSHOT'
  | 'RESPONSE_FORMAT_MISMATCH'
  | 'INVALID_PERSISTED_RESPONSE'
  | 'RESPONSE_DUPLICATE_ID'
  | 'RESPONSE_OPTION_NOT_FOUND'
  | 'RESPONSE_SELECTION_LIMIT'
  | 'RESPONSE_NOT_EXACT_PERMUTATION'
  | 'RESPONSE_MAPPING_KEYS_INVALID'
  | 'RESPONSE_REUSE_NOT_ALLOWED'
  | 'DRAFT_FORMAT_MISMATCH'
  | 'DRAFT_OPTION_NOT_FOUND'
  | 'DRAFT_MAPPING_KEY_INVALID'
  | 'DRAFT_REUSE_NOT_ALLOWED'
  | 'DRAFT_SELECTION_LIMIT'
  | 'DRAFT_NOT_EXACT_PERMUTATION'
  | 'DRAFT_DUPLICATE_ID'
  | 'INVALID_DRAFT_RESPONSE'
  | 'DRAFT_RESPONSE_MISMATCH'
  | 'QUESTION_NOT_IN_ATTEMPT'
  | 'CURRENT_INDEX_OUT_OF_RANGE'
  | 'INVALID_CURRENT_INDEX'
  | 'INVALID_OPTION_ORDER'
  | 'EVALUATION_PAIR_MISMATCH'
  | 'EVALUATION_MAX_INVALID'
  | 'EVALUATION_SCORE_INVALID'
  | 'INVALID_RESULT_ID'
  | 'INVALID_RESULT_SNAPSHOT'
  | 'INVALID_STORE'
  | 'ATTEMPT_STORE_KEY_MISMATCH'
  | 'RESULT_STORE_KEY_MISMATCH'
  | 'ATTEMPT_NOT_FOUND'
  | 'RESULT_NOT_FOUND'
  | 'RESULT_ATTEMPT_MISMATCH'
  | 'RESULT_ATTEMPT_SNAPSHOT_MISMATCH'
  | 'PILOT_BLUEPRINT_MISMATCH'
  | 'PILOT_QUESTION_SET_MISMATCH'
  | 'PILOT_MODE_MISMATCH'
  | 'PILOT_POLICY_MISMATCH'
  | 'PILOT_COURSE_MISMATCH'
  | 'PILOT_MODULE_MISMATCH'
  | 'PILOT_RESULT_INCOMPATIBLE'
  | 'PILOT_MULTIPLE_ACTIVE_ATTEMPTS'
  | 'RESULT_STORE_COLLISION'
  | 'GRADING_POLICY_NOT_FOUND'
  | 'GRADING_POLICY_VERSION_UNSUPPORTED'
  | 'GRADING_POLICY_REQUIRED'
  | 'GRADING_POLICY_MISMATCH'
  | 'GRADING_RESPONSE_INVALID'
  | 'GRADING_QUESTION_FORMAT_UNSUPPORTED'
  | 'GRADING_SCORE_INVALID'
  | 'GRADING_ATTEMPT_INVALID'
  | 'GRADING_RESULT_INVALID'
  | 'GRADING_REPORT_INVALID'
  | 'GRADING_SNAPSHOT_MISMATCH';

export type SessionIssue = {
  code: SessionIssueCode;
  message: string;
  attemptId?: string;
  questionId?: string;
  path?: string;
};

export type SessionSuccess<T> = {
  ok: true;
  value: T;
};

export type SessionFailure = {
  ok: false;
  issues: SessionIssue[];
};

export type SessionResult<T> = SessionSuccess<T> | SessionFailure;

export type QuestionRegistryEntry = {
  readonly question: AssessmentQuestion;
  readonly questionId: string;
  readonly version: number;
  readonly familyId: string;
  readonly courseId: string;
  readonly moduleId: string;
  readonly sectionId: string;
  readonly objectiveId: string;
  readonly reviewStatus: ReviewStatus;
  readonly format: AssessmentQuestion['format'];
};

export type RegistryOptions = {
  allowedReviewStatuses?: ReviewStatus[];
  allowRetiredForArchival?: boolean;
};

export type RegistryBuildInput = RegistryOptions & {
  banks: unknown[];
};

export type RegistryBank = QuestionBank;

export type RandomSource = () => number;
export type Clock = () => Date;
export type IdFactory = () => string;

export type CreateAssessmentAttemptInput = RegistryOptions & {
  registry: import('@/lib/assessment/session/registry').QuestionRegistry;
  questionIds: string[];
  mode: AssessmentAttemptSnapshot['mode'];
  courseId: string;
  moduleId: string;
  blueprintId?: string;
  gradingPolicy?: GradingPolicyReference;
  initializeDraftResponses?: boolean;
  random?: RandomSource;
  now?: Clock;
  idFactory?: IdFactory;
};

export type ResponseValidationSuccess = {
  response: PersistedResponse;
};

export type ResolvedAssessmentSession = {
  attempt: AssessmentAttemptSnapshot;
  questions: AssessmentQuestion[];
};

export type AssessmentEvaluation = {
  score: number | null;
  maxScore: number | null;
};

export type FinalizeAssessmentAttemptInput = {
  attempt: AssessmentAttemptSnapshot;
  evaluation: AssessmentEvaluation;
  now?: Clock;
  idFactory?: IdFactory;
};

export type FinalizedAssessmentResult = AssessmentResultSnapshot;
