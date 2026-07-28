import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import {
  courseReadingCompletion,
  latestResult,
  scorePercentage,
} from '@/lib/legacy/progress';
import type {
  LegacyCourseAnalytics,
  LegacyModuleAnalytics,
} from '@/lib/progress/types';
import type { CourseSummary, Module } from '@/lib/legacy/types';
import type { StoreV2 } from '@/lib/storage/schemas';

function average(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function legacyModuleAnalytics(
  module: Module,
  store: StoreV2,
): LegacyModuleAnalytics {
  const read = store.read[module.id] ?? [];
  const results = [...(store.results[module.id] ?? [])]
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
  const latest = latestResult(results);
  const percentages = results.map(scorePercentage);
  const active = store.active[module.id];
  return {
    moduleId: module.id,
    readingCompleted: read.length,
    readingTotal: module.sections.length,
    readingPercentage: Math.round((read.length / module.sections.length) * 100) || 0,
    activeAttempt: active ? {
      id: active.id,
      answeredCount: Object.keys(active.answers).length,
      flaggedCount: active.flags.length,
      startedAt: active.startedAt,
    } : undefined,
    savedResultCount: results.length,
    latestResult: latest,
    latestPercentage: latest ? scorePercentage(latest) : undefined,
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
  const results = courseModules
    .flatMap((module) => store.results[module.id] ?? [])
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
  const latest = latestResult(results);
  const percentages = results.map(scorePercentage);
  return {
    courseId: course.id,
    ...completion,
    readingCompleted: completion.completed,
    readingTotal: completion.total,
    readingPercentage: completion.percentage,
    savedResultCount: results.length,
    latestResult: latest,
    latestPercentage: latest ? scorePercentage(latest) : undefined,
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
