import type { AssessmentQuestion } from '@/lib/assessment/types';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import { isExactPermutation } from '@/lib/assessment/session/ordering';
import type {
  ResponseValidationSuccess,
  SessionIssue,
  SessionResult,
} from '@/lib/assessment/session/types';
import {
  persistedResponseSchema,
  type PersistedResponse,
} from '@/lib/storage/schemas';

function objectWithFormat(value: unknown): value is { format: string } & Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { format?: unknown }).format === 'string';
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function exactMappingKeys(
  mapping: Record<string, string>,
  expected: readonly string[],
): boolean {
  return isExactPermutation(Object.keys(mapping), expected);
}

function invalidIds(
  ids: readonly string[],
  validIds: ReadonlySet<string>,
): string[] {
  return ids.filter((id) => !validIds.has(id));
}

function validateReuse(
  values: string[],
  reuseAllowed: boolean | undefined,
  questionId: string,
  path: string,
): SessionIssue[] {
  return !reuseAllowed && hasDuplicates(values)
    ? [sessionIssue(
      'RESPONSE_REUSE_NOT_ALLOWED',
      'The response reuses a choice that this question does not permit reusing.',
      { questionId, path },
    )]
    : [];
}

export function validateResponseForQuestion(
  question: AssessmentQuestion,
  input: unknown,
): SessionResult<ResponseValidationSuccess> {
  if (!objectWithFormat(input) || input.format !== question.format) {
    return sessionFailure(sessionIssue(
      'RESPONSE_FORMAT_MISMATCH',
      `Response format must match question format "${question.format}".`,
      { questionId: question.id, path: 'format' },
    ));
  }

  for (const [field, value] of [
    ['optionIds', input.optionIds],
    ['itemIds', input.itemIds],
    ['regionIds', input.regionIds],
  ] as const) {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string') && hasDuplicates(value)) {
      return sessionFailure(sessionIssue(
        'RESPONSE_DUPLICATE_ID',
        `Response field "${field}" must not contain duplicate IDs.`,
        { questionId: question.id, path: field },
      ));
    }
  }

  const parsed = persistedResponseSchema.safeParse(input);
  if (!parsed.success) {
    return sessionFailure(parsed.error.issues.map((issue) => sessionIssue(
      'INVALID_PERSISTED_RESPONSE',
      issue.message,
      { questionId: question.id, path: issue.path.join('.') },
    )));
  }

  const response: PersistedResponse = parsed.data;
  switch (question.format) {
    case 'single_best_answer': {
      if (response.format !== 'single_best_answer') break;
      const valid = new Set(question.options.map((option) => option.id));
      if (!valid.has(response.optionId)) {
        return sessionFailure(sessionIssue(
          'RESPONSE_OPTION_NOT_FOUND',
          `Option "${response.optionId}" is not part of the question.`,
          { questionId: question.id, path: 'optionId' },
        ));
      }
      return sessionSuccess({ response });
    }
    case 'multiple_response': {
      if (response.format !== 'multiple_response') break;
      const valid = new Set(question.options.map((option) => option.id));
      if (invalidIds(response.optionIds, valid).length > 0) {
        return sessionFailure(sessionIssue(
          'RESPONSE_OPTION_NOT_FOUND',
          'Every selected option must belong to the question.',
          { questionId: question.id, path: 'optionIds' },
        ));
      }
      const minimum = question.minimumSelections ?? 0;
      const maximum = question.maximumSelections ?? question.options.length;
      if (response.optionIds.length < minimum || response.optionIds.length > maximum) {
        return sessionFailure(sessionIssue(
          'RESPONSE_SELECTION_LIMIT',
          `Select between ${minimum} and ${maximum} options.`,
          { questionId: question.id, path: 'optionIds' },
        ));
      }
      return sessionSuccess({ response });
    }
    case 'ordering': {
      if (response.format !== 'ordering') break;
      const expected = question.items.map((item) => item.id);
      if (!isExactPermutation(response.itemIds, expected)) {
        return sessionFailure(sessionIssue(
          'RESPONSE_NOT_EXACT_PERMUTATION',
          'Ordering responses must contain every authored item exactly once.',
          { questionId: question.id, path: 'itemIds' },
        ));
      }
      return sessionSuccess({ response });
    }
    case 'matching': {
      if (response.format !== 'matching') break;
      const promptIds = question.prompts.map((prompt) => prompt.id);
      if (!exactMappingKeys(response.matches, promptIds)) {
        return sessionFailure(sessionIssue(
          'RESPONSE_MAPPING_KEYS_INVALID',
          'Matching response keys must exactly equal the authored prompt IDs.',
          { questionId: question.id, path: 'matches' },
        ));
      }
      const choices = new Set(question.choices.map((choice) => choice.id));
      if (invalidIds(Object.values(response.matches), choices).length > 0) {
        return sessionFailure(sessionIssue(
          'RESPONSE_OPTION_NOT_FOUND',
          'Every match must reference an authored choice.',
          { questionId: question.id, path: 'matches' },
        ));
      }
      const reuseIssues = validateReuse(
        Object.values(response.matches),
        question.reuseChoices,
        question.id,
        'matches',
      );
      return reuseIssues.length > 0
        ? sessionFailure(reuseIssues)
        : sessionSuccess({ response });
    }
    case 'extended_matching': {
      if (response.format !== 'extended_matching') break;
      const stemIds = question.stems.map((stem) => stem.id);
      if (!exactMappingKeys(response.answers, stemIds)) {
        return sessionFailure(sessionIssue(
          'RESPONSE_MAPPING_KEYS_INVALID',
          'Extended-matching response keys must exactly equal the authored stem IDs.',
          { questionId: question.id, path: 'answers' },
        ));
      }
      const options = new Set(question.options.map((option) => option.id));
      if (invalidIds(Object.values(response.answers), options).length > 0) {
        return sessionFailure(sessionIssue(
          'RESPONSE_OPTION_NOT_FOUND',
          'Every answer must reference an authored shared option.',
          { questionId: question.id, path: 'answers' },
        ));
      }
      const reuseIssues = validateReuse(
        Object.values(response.answers),
        question.reuseOptions,
        question.id,
        'answers',
      );
      return reuseIssues.length > 0
        ? sessionFailure(reuseIssues)
        : sessionSuccess({ response });
    }
    case 'image_hotspot': {
      if (response.format !== 'image_hotspot') break;
      if (response.regionIds.length === 0) {
        return sessionFailure(sessionIssue(
          'RESPONSE_SELECTION_LIMIT',
          'A hotspot response must select at least one region.',
          { questionId: question.id, path: 'regionIds' },
        ));
      }
      const regions = new Set(question.regions.map((region) => region.id));
      if (invalidIds(response.regionIds, regions).length > 0) {
        return sessionFailure(sessionIssue(
          'RESPONSE_OPTION_NOT_FOUND',
          'Every selected hotspot region must belong to the question.',
          { questionId: question.id, path: 'regionIds' },
        ));
      }
      return sessionSuccess({ response });
    }
    case 'image_label': {
      if (response.format !== 'image_label') break;
      const targetIds = question.targets.map((target) => target.id);
      if (!exactMappingKeys(response.matches, targetIds)) {
        return sessionFailure(sessionIssue(
          'RESPONSE_MAPPING_KEYS_INVALID',
          'Image-label response keys must exactly equal the authored target IDs.',
          { questionId: question.id, path: 'matches' },
        ));
      }
      const labels = new Set(question.labels.map((label) => label.id));
      const values = Object.values(response.matches);
      if (invalidIds(values, labels).length > 0) {
        return sessionFailure(sessionIssue(
          'RESPONSE_OPTION_NOT_FOUND',
          'Every image label must reference an authored label ID.',
          { questionId: question.id, path: 'matches' },
        ));
      }
      if (hasDuplicates(values)) {
        return sessionFailure(sessionIssue(
          'RESPONSE_REUSE_NOT_ALLOWED',
          'Image labels may be used only once.',
          { questionId: question.id, path: 'matches' },
        ));
      }
      return sessionSuccess({ response });
    }
    case 'short_answer': {
      if (response.format !== 'short_answer') break;
      if (!response.text.trim()) {
        return sessionFailure(sessionIssue(
          'INVALID_PERSISTED_RESPONSE',
          'Short answers cannot contain only whitespace.',
          { questionId: question.id, path: 'text' },
        ));
      }
      return sessionSuccess({ response });
    }
    case 'open_response': {
      if (response.format !== 'open_response') break;
      if (!response.text.trim()) {
        return sessionFailure(sessionIssue(
          'INVALID_PERSISTED_RESPONSE',
          'Open responses cannot contain only whitespace.',
          { questionId: question.id, path: 'text' },
        ));
      }
      return sessionSuccess({ response });
    }
  }

  return sessionFailure(sessionIssue(
    'RESPONSE_FORMAT_MISMATCH',
    `Response format must match question format "${question.format}".`,
    { questionId: question.id, path: 'format' },
  ));
}
