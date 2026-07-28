import type { AssessmentQuestion } from '@/lib/assessment/types';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import { isExactPermutation } from '@/lib/assessment/session/ordering';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import { validateResponseForQuestion } from '@/lib/assessment/session/responseValidation';
import type { SessionResult } from '@/lib/assessment/session/types';
import {
  assessmentDraftResponseSchema,
  type AssessmentAttemptSnapshot,
  type AssessmentDraftResponse,
  type PersistedResponse,
} from '@/lib/storage/schemas';

export type AttemptQuestionState = 'unanswered' | 'in_progress' | 'answered';

function invalidDraft(
  code: Parameters<typeof sessionIssue>[0],
  message: string,
  questionId?: string,
  path?: string,
): SessionResult<never> {
  return sessionFailure(sessionIssue(code, message, { questionId, path }));
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function validateMapping(
  mapping: Record<string, string>,
  validKeys: Set<string>,
  validValues: Set<string>,
  reuseAllowed: boolean,
): SessionResult<void> {
  const entries = Object.entries(mapping);
  if (entries.some(([key]) => !validKeys.has(key))) {
    return invalidDraft(
      'DRAFT_MAPPING_KEY_INVALID',
      'Draft mapping keys must reference authored prompts, stems, or targets.',
    );
  }
  if (entries.some(([, value]) => !validValues.has(value))) {
    return invalidDraft(
      'DRAFT_OPTION_NOT_FOUND',
      'Draft mapping values must reference authored choices, options, or labels.',
    );
  }
  if (!reuseAllowed && !hasUniqueValues(entries.map(([, value]) => value))) {
    return invalidDraft(
      'DRAFT_REUSE_NOT_ALLOWED',
      'This draft may not reuse an answer in more than one row.',
    );
  }
  return sessionSuccess(undefined);
}

export function validateDraftResponseForQuestion(
  question: AssessmentQuestion,
  input: unknown,
): SessionResult<AssessmentDraftResponse> {
  const parsed = assessmentDraftResponseSchema.safeParse(input);
  if (!parsed.success) {
    return invalidDraft(
      'INVALID_DRAFT_RESPONSE',
      parsed.error.issues[0]?.message ?? 'Draft response is malformed.',
      question.id,
      parsed.error.issues[0]?.path.join('.'),
    );
  }
  const draft = parsed.data;
  if (draft.format !== question.format) {
    return invalidDraft(
      'DRAFT_FORMAT_MISMATCH',
      `Draft format "${draft.format}" does not match "${question.format}".`,
      question.id,
      'format',
    );
  }

  switch (question.format) {
    case 'single_best_answer':
      if (draft.format !== question.format) break;
      if (!question.options.some((option) => option.id === draft.optionId)) {
        return invalidDraft(
          'DRAFT_OPTION_NOT_FOUND',
          `Option "${draft.optionId}" is not authored for this question.`,
          question.id,
          'optionId',
        );
      }
      return sessionSuccess(draft);
    case 'true_false':
      return draft.format === question.format
        ? sessionSuccess(draft)
        : invalidDraft('DRAFT_FORMAT_MISMATCH', 'True/False draft format mismatch.', question.id, 'format');
    case 'multiple_response':
      if (draft.format !== question.format) break;
      if (!hasUniqueValues(draft.optionIds)) {
        return invalidDraft(
          'DRAFT_DUPLICATE_ID',
          'Multiple-response draft options must be unique.',
          question.id,
          'optionIds',
        );
      }
      if (draft.optionIds.some(
        (id) => !question.options.some((option) => option.id === id),
      )) {
        return invalidDraft(
          'DRAFT_OPTION_NOT_FOUND',
          'Multiple-response draft options must be authored for this question.',
          question.id,
          'optionIds',
        );
      }
      if (
        question.maximumSelections !== undefined
        && draft.optionIds.length > question.maximumSelections
      ) {
        return invalidDraft(
          'DRAFT_SELECTION_LIMIT',
          `Select no more than ${question.maximumSelections} options.`,
          question.id,
          'optionIds',
        );
      }
      return sessionSuccess(draft);
    case 'ordering':
      if (draft.format !== question.format) break;
      if (!isExactPermutation(
        draft.itemIds,
        question.items.map((item) => item.id),
      )) {
        return invalidDraft(
          'DRAFT_NOT_EXACT_PERMUTATION',
          'Ordering drafts must contain every authored item exactly once.',
          question.id,
          'itemIds',
        );
      }
      return sessionSuccess(draft);
    case 'matching':
      if (draft.format !== question.format) break;
      {
        const validated = validateMapping(
          draft.matches,
          new Set(question.prompts.map((prompt) => prompt.id)),
          new Set(question.choices.map((choice) => choice.id)),
          question.reuseChoices === true,
        );
        return validated.ok ? sessionSuccess(draft) : validated;
      }
    case 'extended_matching':
      if (draft.format !== question.format) break;
      {
        const validated = validateMapping(
          draft.answers,
          new Set(question.stems.map((stem) => stem.id)),
          new Set(question.options.map((option) => option.id)),
          question.reuseOptions === true,
        );
        return validated.ok ? sessionSuccess(draft) : validated;
      }
    case 'image_hotspot':
      if (draft.format !== question.format) break;
      if (!hasUniqueValues(draft.regionIds)) {
        return invalidDraft(
          'DRAFT_DUPLICATE_ID',
          'Image-hotspot draft regions must be unique.',
          question.id,
          'regionIds',
        );
      }
      if (draft.regionIds.some(
        (id) => !question.regions.some((region) => region.id === id),
      )) {
        return invalidDraft(
          'DRAFT_OPTION_NOT_FOUND',
          'Image-hotspot draft regions must be authored for this question.',
          question.id,
          'regionIds',
        );
      }
      return sessionSuccess(draft);
    case 'image_label':
      if (draft.format !== question.format) break;
      {
        const validated = validateMapping(
          draft.matches,
          new Set(question.targets.map((target) => target.id)),
          new Set(question.labels.map((label) => label.id)),
          false,
        );
        return validated.ok ? sessionSuccess(draft) : validated;
      }
    case 'short_answer':
    case 'open_response':
      if (draft.format !== question.format) break;
      return sessionSuccess(draft);
  }
  return invalidDraft(
    'DRAFT_FORMAT_MISMATCH',
    'Draft response format does not match the authored question.',
    question.id,
    'format',
  );
}

export function completeResponseFromDraft(
  question: AssessmentQuestion,
  draft: AssessmentDraftResponse,
): PersistedResponse | undefined {
  switch (question.format) {
    case 'single_best_answer':
      return draft.format === question.format ? { ...draft } : undefined;
    case 'true_false':
      return draft.format === question.format ? { ...draft } : undefined;
    case 'multiple_response':
      if (draft.format !== question.format || draft.optionIds.length === 0) return undefined;
      if (
        question.minimumSelections !== undefined
        && draft.optionIds.length < question.minimumSelections
      ) return undefined;
      return { format: draft.format, optionIds: [...draft.optionIds] };
    case 'ordering':
      return draft.format === question.format
        ? { format: draft.format, itemIds: [...draft.itemIds] }
        : undefined;
    case 'matching':
      return draft.format === question.format
        && Object.keys(draft.matches).length === question.prompts.length
        ? { format: draft.format, matches: { ...draft.matches } }
        : undefined;
    case 'extended_matching':
      return draft.format === question.format
        && Object.keys(draft.answers).length === question.stems.length
        ? { format: draft.format, answers: { ...draft.answers } }
        : undefined;
    case 'image_hotspot':
      return draft.format === question.format && draft.regionIds.length > 0
        ? { format: draft.format, regionIds: [...draft.regionIds] }
        : undefined;
    case 'image_label':
      return draft.format === question.format
        && Object.keys(draft.matches).length === question.targets.length
        ? { format: draft.format, matches: { ...draft.matches } }
        : undefined;
    case 'short_answer':
    case 'open_response':
      return draft.format === question.format && draft.text.trim().length > 0
        ? { format: draft.format, text: draft.text }
        : undefined;
  }
}

export function persistedResponsesEqual(
  left: PersistedResponse,
  right: PersistedResponse,
): boolean {
  if (left.format !== right.format) return false;
  switch (left.format) {
    case 'single_best_answer':
      return right.format === left.format && left.optionId === right.optionId;
    case 'true_false':
      return right.format === left.format && left.answer === right.answer;
    case 'multiple_response':
      return right.format === left.format
        && left.optionIds.length === right.optionIds.length
        && left.optionIds.every((id) => right.optionIds.includes(id));
    case 'ordering':
      return right.format === left.format
        && left.itemIds.length === right.itemIds.length
        && left.itemIds.every((id, index) => id === right.itemIds[index]);
    case 'matching':
      return right.format === left.format && mappingsEqual(left.matches, right.matches);
    case 'extended_matching':
      return right.format === left.format && mappingsEqual(left.answers, right.answers);
    case 'image_hotspot':
      return right.format === left.format
        && left.regionIds.length === right.regionIds.length
        && left.regionIds.every((id) => right.regionIds.includes(id));
    case 'image_label':
      return right.format === left.format && mappingsEqual(left.matches, right.matches);
    case 'short_answer':
    case 'open_response':
      return right.format === left.format && left.text === right.text;
  }
}

function mappingsEqual(
  left: Record<string, string>,
  right: Record<string, string>,
): boolean {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length
    && keys.every((key) => left[key] === right[key]);
}
export function updateAttemptDraftResponse({
  attempt,
  registry,
  questionId,
  draft,
}: {
  attempt: AssessmentAttemptSnapshot;
  registry: QuestionRegistry;
  questionId: string;
  draft: unknown;
}): SessionResult<AssessmentAttemptSnapshot> {
  if (!attempt.orderedQuestionIds.includes(questionId)) {
    return invalidDraft(
      'QUESTION_NOT_IN_ATTEMPT',
      `Question "${questionId}" is not part of this attempt.`,
      questionId,
    );
  }
  const entry = registry.getEntry(questionId);
  if (!entry) {
    return invalidDraft(
      'QUESTION_NOT_FOUND',
      `Question "${questionId}" is not registered.`,
      questionId,
    );
  }
  if (attempt.questionVersions[questionId] !== entry.version) {
    return invalidDraft(
      'QUESTION_VERSION_MISMATCH',
      `Question "${questionId}" no longer matches the attempt version.`,
      questionId,
      `questionVersions.${questionId}`,
    );
  }
  if (attempt.courseId !== entry.courseId) {
    return invalidDraft(
      'QUESTION_COURSE_MISMATCH',
      `Question "${questionId}" does not belong to the attempt course.`,
      questionId,
      'courseId',
    );
  }
  if (attempt.moduleId !== entry.moduleId) {
    return invalidDraft(
      'QUESTION_MODULE_MISMATCH',
      `Question "${questionId}" does not belong to the attempt module.`,
      questionId,
      'moduleId',
    );
  }
  const validated = validateDraftResponseForQuestion(entry.question, draft);
  if (!validated.ok) {
    return sessionFailure(validated.issues.map((issue) => ({
      ...issue,
      attemptId: attempt.id,
      questionId,
    })));
  }

  const draftResponses = {
    ...(attempt.draftResponses ?? {}),
    [questionId]: structuredClone(validated.value),
  };
  const responses = { ...attempt.responses };
  const response = completeResponseFromDraft(entry.question, validated.value);
  if (response) {
    const complete = validateResponseForQuestion(entry.question, response);
    if (!complete.ok) {
      return sessionFailure(complete.issues.map((issue) => ({
        ...issue,
        attemptId: attempt.id,
        questionId,
      })));
    }
    responses[questionId] = structuredClone(complete.value.response);
  } else {
    delete responses[questionId];
  }
  return sessionSuccess({
    ...attempt,
    draftResponses,
    responses,
  });
}

export function clearAttemptDraftResponse(
  attempt: AssessmentAttemptSnapshot,
  questionId: string,
): SessionResult<AssessmentAttemptSnapshot> {
  if (!attempt.orderedQuestionIds.includes(questionId)) {
    return invalidDraft(
      'QUESTION_NOT_IN_ATTEMPT',
      `Question "${questionId}" is not part of this attempt.`,
      questionId,
    );
  }
  const draftResponses = { ...(attempt.draftResponses ?? {}) };
  const responses = { ...attempt.responses };
  delete draftResponses[questionId];
  delete responses[questionId];
  return sessionSuccess({
    ...attempt,
    draftResponses,
    responses,
  });
}

export function getAttemptQuestionState(
  attempt: AssessmentAttemptSnapshot,
  questionId: string,
): AttemptQuestionState {
  if (attempt.responses[questionId]) return 'answered';
  if (attempt.draftResponses?.[questionId]) return 'in_progress';
  return 'unanswered';
}
