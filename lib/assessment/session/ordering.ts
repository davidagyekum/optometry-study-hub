import type { AssessmentQuestion } from '@/lib/assessment/types';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type {
  RandomSource,
  SessionResult,
} from '@/lib/assessment/session/types';

export function shuffleIds(
  source: readonly string[],
  random: RandomSource,
): SessionResult<string[]> {
  const shuffled = [...source];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    let value: number;
    try {
      value = random();
    } catch {
      return sessionFailure(sessionIssue(
        'INVALID_RANDOM_VALUE',
        'The random source threw while generating presentation order.',
      ));
    }
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      return sessionFailure(sessionIssue(
        'INVALID_RANDOM_VALUE',
        'Random values must be finite numbers in the range [0, 1).',
      ));
    }
    const swapIndex = Math.floor(value * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return sessionSuccess(shuffled);
}

export function authoredPresentationIds(
  question: AssessmentQuestion,
): string[] | undefined {
  switch (question.format) {
    case 'single_best_answer':
    case 'multiple_response':
    case 'extended_matching':
      return question.options.map((option) => option.id);
    case 'ordering':
      return question.items.map((item) => item.id);
    case 'matching':
      return question.choices.map((choice) => choice.id);
    case 'image_label':
      return question.labels.map((label) => label.id);
    case 'image_hotspot':
    case 'true_false':
    case 'short_answer':
    case 'open_response':
      return undefined;
  }
}

export function createPresentationOrder(
  question: AssessmentQuestion,
  random: RandomSource,
): SessionResult<string[] | undefined> {
  const authored = authoredPresentationIds(question);
  return authored ? shuffleIds(authored, random) : sessionSuccess(undefined);
}

export function isExactPermutation(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  if (actual.length !== expected.length) return false;
  if (new Set(actual).size !== actual.length) return false;
  const expectedSet = new Set(expected);
  return actual.every((id) => expectedSet.has(id));
}
