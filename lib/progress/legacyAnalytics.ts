import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import { courseReadingCompletion } from '@/lib/legacy/progress';
import type {
  LegacyCourseAnalytics,
  LegacyModuleAnalytics,
} from '@/lib/progress/types';
import type { CourseSummary, Module, Result } from '@/lib/legacy/types';
import type { StoreV2 } from '@/lib/storage/schemas';

function average(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function safeLegacyPercentage(
  result: Pick<Result, 'score' | 'total'>,
): number | undefined {
  if (
    !Number.isFinite(result.score)
    || !Number.isFinite(result.total)
    || result.total <= 0
  ) return undefined;
  return Math.round((result.score / result.total) * 100);
}

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function newestResult(results: Result[]): Result | undefined {
  return results
    .map((result, index) => ({ result, index }))
    .sort((left, right) => (
      timestamp(right.result.submittedAt) - timestamp(left.result.submittedAt)
      || left.index - right.index
      || left.result.id.localeCompare(right.result.id)
    ))[0]?.result;
}

export function legacyModuleAnalytics(
  module: Module,
  store: StoreV2,
): LegacyModuleAnalytics {
  const read = store.read[module.id] ?? [];
  const results = store.results[module.id] ?? [];
  const latest = newestResult(results);
  const percentages = results
    .map(safeLegacyPercentage)
    .filter((value): value is number => value !== undefined);
  const active = store.active[module.id];
  const readingPercentage = module.sections.length
    ? Math.round((read.length / module.sections.length) * 100)
    : 0;
  return {
    moduleId: module.id,
    readingCompleted: read.length,
    readingTotal: module.sections.length,
    readingPercentage,
    activeAttempt: active ? {
      id: active.id,
      answeredCount: Object.keys(active.answers).length,
      flaggedCount: active.flags.length,
      startedAt: active.startedAt,
    } : undefined,
    savedResultCount: results.length,
    latestResult: latest,
    latestPercentage: latest ? safeLegacyPercentage(latest) : undefined,
    bestPercentage: percentages.length ? Math.max(...percentages) : undefined,
    recentAveragePercentage: average(percentages),
    lastSubmittedAt: latest?.submittedAt,
  };
}

export function legacyCourseAnalytics(
  course: CourseSummary,
  store: StoreV2,
): LegacyCourseAnalytics {
  const courseModules = course.moduleIds
    .map((id) => moduleMap.get(id))
    .filter((module): module is Module => Boolean(module));
  const completion = courseReadingCompletion(courseModules, store);
  const results = courseModules.flatMap((module) => store.results[module.id] ?? []);
  const latest = newestResult(results);
  const percentages = results
    .map(safeLegacyPercentage)
    .filter((value): value is number => value !== undefined);
  return {
    courseId: course.id,
    ...completion,
    readingCompleted: completion.completed,
    readingTotal: completion.total,
    readingPercentage: completion.percentage,
    savedResultCount: results.length,
    latestResult: latest,
    latestPercentage: latest ? safeLegacyPercentage(latest) : undefined,
    bestPercentage: percentages.length ? Math.max(...percentages) : undefined,
    recentAveragePercentage: average(percentages),
    activeModuleCount: courseModules.filter((module) => store.active[module.id]).length,
  };
}

export function allLegacyModuleAnalytics(store: StoreV2): LegacyModuleAnalytics[] {
  return modules.map((module) => legacyModuleAnalytics(module, store));
}

export function allLegacyCourseAnalytics(store: StoreV2): LegacyCourseAnalytics[] {
  return courses.map((course) => legacyCourseAnalytics(course, store));
}
