import type { AssessmentQuestion } from '@/lib/assessment/types';
import {
  completeResponseFromDraft,
  persistedResponsesEqual,
  validateDraftResponseForQuestion,
} from '@/lib/assessment/session/draftResponses';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import {
  authoredPresentationIds,
  isExactPermutation,
} from '@/lib/assessment/session/ordering';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import { validateResponseForQuestion } from '@/lib/assessment/session/responseValidation';
import type {
  ResolvedAssessmentSession,
  SessionIssue,
  SessionResult,
} from '@/lib/assessment/session/types';
import type { AssessmentAttemptSnapshot } from '@/lib/storage/schemas';

export function resolveAssessmentAttempt(
  attempt: AssessmentAttemptSnapshot,
  registry: QuestionRegistry,
): SessionResult<ResolvedAssessmentSession> {
  const issues: SessionIssue[] = [];
  const questions: AssessmentQuestion[] = [];
  const attemptIds = new Set(attempt.orderedQuestionIds);

  if (
    !Number.isInteger(attempt.currentIndex)
    || attempt.currentIndex < 0
    || attempt.currentIndex >= attempt.orderedQuestionIds.length
  ) {
    issues.push(sessionIssue(
      'INVALID_CURRENT_INDEX',
      'The persisted current index is outside the question order.',
      { attemptId: attempt.id, path: 'currentIndex' },
    ));
  }

  for (const questionId of attempt.orderedQuestionIds) {
    const question = registry.get(questionId);
    if (!question) {
      issues.push(sessionIssue(
        'MISSING_QUESTION',
        `Persisted question "${questionId}" is missing from the registry.`,
        { attemptId: attempt.id, questionId },
      ));
      continue;
    }
    questions.push(question);

    if (attempt.questionVersions[questionId] !== question.version) {
      issues.push(sessionIssue(
        'QUESTION_VERSION_MISMATCH',
        `Persisted version for "${questionId}" does not match the registry.`,
        { attemptId: attempt.id, questionId, path: `questionVersions.${questionId}` },
      ));
    }
    if (question.courseId !== attempt.courseId) {
      issues.push(sessionIssue(
        'QUESTION_COURSE_MISMATCH',
        `Question "${questionId}" does not match the attempt course.`,
        { attemptId: attempt.id, questionId, path: 'courseId' },
      ));
    }
    if (question.moduleId !== attempt.moduleId) {
      issues.push(sessionIssue(
        'QUESTION_MODULE_MISMATCH',
        `Question "${questionId}" does not match the attempt module.`,
        { attemptId: attempt.id, questionId, path: 'moduleId' },
      ));
    }

    const authoredOrder = authoredPresentationIds(question);
    const persistedOrder = attempt.optionOrder[questionId];
    const validOrder = authoredOrder
      ? Array.isArray(persistedOrder) && isExactPermutation(persistedOrder, authoredOrder)
      : persistedOrder === undefined;
    if (!validOrder) {
      issues.push(sessionIssue(
        'INVALID_OPTION_ORDER',
        `Persisted presentation order for "${questionId}" is invalid.`,
        { attemptId: attempt.id, questionId, path: `optionOrder.${questionId}` },
      ));
    }

    const response = attempt.responses[questionId];
    const validatedResponse = response === undefined
      ? undefined
      : validateResponseForQuestion(question, response);
    if (validatedResponse && !validatedResponse.ok) {
      issues.push(...validatedResponse.issues.map((issue) => ({
        ...issue,
        code: 'INVALID_PERSISTED_RESPONSE' as const,
        attemptId: attempt.id,
        questionId,
      })));
    }

    const draft = attempt.draftResponses?.[questionId];
    const validatedDraft = draft === undefined
      ? undefined
      : validateDraftResponseForQuestion(question, draft);
    if (validatedDraft && !validatedDraft.ok) {
      issues.push(...validatedDraft.issues.map((issue) => ({
        ...issue,
        code: 'INVALID_DRAFT_RESPONSE' as const,
        attemptId: attempt.id,
        questionId,
        path: `draftResponses.${questionId}${issue.path ? `.${issue.path}` : ''}`,
      })));
    }

    if (validatedDraft?.ok) {
      const draftResponse = completeResponseFromDraft(
        question,
        validatedDraft.value,
      );
      const storedResponse = validatedResponse?.ok
        ? validatedResponse.value.response
        : undefined;
      const mismatch = draftResponse === undefined
        ? response !== undefined
        : storedResponse === undefined
          || !persistedResponsesEqual(draftResponse, storedResponse);
      if (mismatch) {
        issues.push(sessionIssue(
          'DRAFT_RESPONSE_MISMATCH',
          `Draft and complete response for "${questionId}" do not agree.`,
          {
            attemptId: attempt.id,
            questionId,
            path: `draftResponses.${questionId}`,
          },
        ));
      }
    }
  }

  for (const questionId of Object.keys(attempt.responses)) {
    if (!attemptIds.has(questionId)) {
      issues.push(sessionIssue(
        'INVALID_PERSISTED_RESPONSE',
        `Response references question "${questionId}" outside the attempt.`,
        { attemptId: attempt.id, questionId, path: `responses.${questionId}` },
      ));
    }
  }
  for (const questionId of Object.keys(attempt.draftResponses ?? {})) {
    if (!attemptIds.has(questionId)) {
      issues.push(sessionIssue(
        'INVALID_DRAFT_RESPONSE',
        `Draft response references question "${questionId}" outside the attempt.`,
        {
          attemptId: attempt.id,
          questionId,
          path: `draftResponses.${questionId}`,
        },
      ));
    }
  }
  for (const questionId of Object.keys(attempt.optionOrder)) {
    if (!attemptIds.has(questionId)) {
      issues.push(sessionIssue(
        'INVALID_OPTION_ORDER',
        `Presentation order references question "${questionId}" outside the attempt.`,
        { attemptId: attempt.id, questionId, path: `optionOrder.${questionId}` },
      ));
    }
  }

  return issues.length > 0
    ? sessionFailure(issues)
    : sessionSuccess({ attempt, questions });
}
