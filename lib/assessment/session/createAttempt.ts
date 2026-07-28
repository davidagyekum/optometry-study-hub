import { STABLE_ID_PATTERN } from '@/lib/assessment/constants';
import {
  defaultGradingPolicyForMode,
  resolveGradingPolicy,
} from '@/lib/assessment/grading/policyRegistry';
import type { ReviewStatus } from '@/lib/assessment/types';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import {
  createPresentationOrder,
  shuffleIds,
} from '@/lib/assessment/session/ordering';
import type {
  CreateAssessmentAttemptInput,
  SessionIssue,
  SessionIssueCode,
  SessionResult,
} from '@/lib/assessment/session/types';
import { assessmentAttemptSnapshotSchema } from '@/lib/storage/schemas';
import type { AssessmentAttemptSnapshot } from '@/lib/storage/schemas';

const DEFAULT_ALLOWED_STATUSES: ReviewStatus[] = ['approved'];

function defaultAttemptId(): string {
  return `attempt-${globalThis.crypto.randomUUID()}`;
}

function createTimestamp(now: () => Date): SessionResult<string> {
  let value: Date;
  try {
    value = now();
  } catch {
    return sessionFailure(sessionIssue('INVALID_TIMESTAMP', 'The session clock threw.'));
  }
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return sessionFailure(sessionIssue(
      'INVALID_TIMESTAMP',
      'The session clock must return a valid Date.',
    ));
  }
  return sessionSuccess(value.toISOString());
}

export function createAssessmentAttempt({
  registry,
  questionIds,
  mode,
  courseId,
  moduleId,
  blueprintId,
  practiceSelection,
  gradingPolicy,
  initializeDraftResponses = false,
  random = Math.random,
  now = () => new Date(),
  idFactory = defaultAttemptId,
  allowedReviewStatuses = DEFAULT_ALLOWED_STATUSES,
  allowRetiredForArchival = false,
}: CreateAssessmentAttemptInput): SessionResult<AssessmentAttemptSnapshot> {
  if (questionIds.length === 0) {
    return sessionFailure(sessionIssue(
      'EMPTY_SESSION',
      'Assessment sessions require at least one question.',
      { path: 'questionIds' },
    ));
  }
  if (new Set(questionIds).size !== questionIds.length) {
    return sessionFailure(sessionIssue(
      'DUPLICATE_SESSION_QUESTION',
      'Assessment session question IDs must be unique.',
      { path: 'questionIds' },
    ));
  }

  const allowed = new Set(allowedReviewStatuses);
  const issues: SessionIssue[] = [];
  const questions = questionIds.flatMap((questionId) => {
    const entry = registry.getEntry(questionId);
    if (!entry) {
      issues.push(sessionIssue(
        'QUESTION_NOT_FOUND',
        `Question "${questionId}" is not registered.`,
        { questionId },
      ));
      return [];
    }
    if (entry.courseId !== courseId) {
      issues.push(sessionIssue(
        'QUESTION_COURSE_MISMATCH',
        `Question "${questionId}" does not belong to course "${courseId}".`,
        { questionId, path: 'courseId' },
      ));
    }
    if (entry.moduleId !== moduleId) {
      issues.push(sessionIssue(
        'QUESTION_MODULE_MISMATCH',
        `Question "${questionId}" does not belong to module "${moduleId}".`,
        { questionId, path: 'moduleId' },
      ));
    }
    const retiredAllowed = entry.reviewStatus !== 'retired' || allowRetiredForArchival;
    if (!allowed.has(entry.reviewStatus) || !retiredAllowed) {
      issues.push(sessionIssue(
        'QUESTION_NOT_ELIGIBLE',
        `Question "${questionId}" is not eligible for this session.`,
        { questionId, path: 'reviewStatus' },
      ));
    }
    return [entry.question];
  });
  if (issues.length > 0) return sessionFailure(issues);

  const selectedPolicy = gradingPolicy
    ? resolveGradingPolicy(gradingPolicy)
    : defaultGradingPolicyForMode(mode);
  if (!selectedPolicy.ok) {
    return sessionFailure(selectedPolicy.issues.map((issue) => sessionIssue(
      issue.code as SessionIssueCode,
      issue.message,
      { path: issue.path },
    )));
  }
  const lockedPolicy = {
    id: selectedPolicy.value.id,
    version: selectedPolicy.value.version,
  };

  let attemptId: string;
  try {
    attemptId = idFactory();
  } catch {
    return sessionFailure(sessionIssue('INVALID_ATTEMPT_ID', 'The attempt ID factory threw.'));
  }
  if (typeof attemptId !== 'string' || !STABLE_ID_PATTERN.test(attemptId)) {
    return sessionFailure(sessionIssue(
      'INVALID_ATTEMPT_ID',
      'Attempt IDs must use stable slug-style syntax.',
      { path: 'id' },
    ));
  }

  const timestamp = createTimestamp(now);
  if (!timestamp.ok) return timestamp;
  const shuffledIds = shuffleIds(questionIds, random);
  if (!shuffledIds.ok) return shuffledIds;

  const questionLookup = new Map(questions.map((question) => [question.id, question]));
  const questionVersions: Record<string, number> = {};
  const optionOrder: Record<string, string[]> = {};
  for (const questionId of shuffledIds.value) {
    const question = questionLookup.get(questionId);
    if (!question) {
      return sessionFailure(sessionIssue(
        'QUESTION_NOT_FOUND',
        `Question "${questionId}" became unavailable during creation.`,
        { questionId },
      ));
    }
    questionVersions[questionId] = question.version;
    const presentation = createPresentationOrder(question, random);
    if (!presentation.ok) {
      return sessionFailure(presentation.issues.map((issue) => ({
        ...issue,
        questionId,
      })));
    }
    if (presentation.value) optionOrder[questionId] = presentation.value;
  }

  const candidate: AssessmentAttemptSnapshot = {
    id: attemptId,
    mode,
    courseId,
    moduleId,
    ...(blueprintId ? { blueprintId } : {}),
    ...(practiceSelection ? { practiceSelection: structuredClone(practiceSelection) } : {}),
    gradingPolicy: lockedPolicy,
    startedAt: timestamp.value,
    orderedQuestionIds: shuffledIds.value,
    questionVersions,
    optionOrder,
    responses: {},
    ...(initializeDraftResponses ? { draftResponses: {} } : {}),
    flags: [],
    currentIndex: 0,
  };
  const parsed = assessmentAttemptSnapshotSchema.safeParse(candidate);
  if (!parsed.success) {
    return sessionFailure(parsed.error.issues.map((issue) => sessionIssue(
      'INVALID_ATTEMPT_SNAPSHOT',
      issue.message,
      { attemptId, path: issue.path.join('.') },
    )));
  }
  return sessionSuccess(parsed.data);
}
