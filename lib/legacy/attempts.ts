import { questionsFor } from '@/lib/legacy/questionGenerator';
import type { Attempt, Module, Question, Result } from '@/lib/legacy/types';

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function createAttempt(
  module: Module,
  random: () => number = Math.random,
  now: () => Date = () => new Date(),
): Attempt {
  const questions = questionsFor(module);
  return {
    id: `${module.id}-${now().getTime()}`,
    moduleId: module.id,
    startedAt: now().toISOString(),
    order: shuffle(questions.map((question) => question.id), random),
    optionOrder: Object.fromEntries(
      questions.map((question) => [question.id, shuffle(question.options, random)]),
    ),
    answers: {},
    flags: [],
    current: 0,
  };
}

export function calculateScore(
  attempt: Attempt,
  questionsById: ReadonlyMap<string, Question>,
): number {
  return attempt.order.reduce(
    (sum, id) => sum + (attempt.answers[id] === questionsById.get(id)?.correct ? 1 : 0),
    0,
  );
}

export function countUnanswered(attempt: Attempt): number {
  return attempt.order.length - Object.keys(attempt.answers).length;
}

export function countResultUnanswered(result: Result): number {
  return result.order.filter((id) => !result.answers[id]).length;
}

export function countIncorrect(result: Result): number {
  return result.total - result.score - countResultUnanswered(result);
}
