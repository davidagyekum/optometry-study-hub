import type { Module, Result, Store } from '@/lib/legacy/types';

export type ReadingCompletion = {
  completed: number;
  total: number;
  percentage: number;
};

function percentage(completed: number, total: number): number {
  return Math.round((completed / total) * 100) || 0;
}

export function moduleReadingPercentage(module: Module, read: string[]): number {
  return percentage(read.length, module.sections.length);
}

export function courseReadingCompletion(modules: Module[], store: Store): ReadingCompletion {
  const completed = modules.reduce(
    (sum, module) => sum + (store.read[module.id]?.length ?? 0),
    0,
  );
  const total = modules.reduce((sum, module) => sum + module.sections.length, 0);
  return { completed, total, percentage: percentage(completed, total) };
}

export function overallReadingCompletion(modules: Module[], store: Store): ReadingCompletion {
  return courseReadingCompletion(modules, store);
}

export function latestResult(results: Result[]): Result | undefined {
  return [...results].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
}

export function bestScore(results: Result[]): number | undefined {
  return results.length ? Math.max(...results.map((result) => result.score)) : undefined;
}

export function scorePercentage(result: Pick<Result, 'score' | 'total'>): number {
  return Math.round((result.score / result.total) * 100);
}

export function bestScorePercentage(results: Result[]): number | undefined {
  return results.length ? Math.max(...results.map(scorePercentage)) : undefined;
}
