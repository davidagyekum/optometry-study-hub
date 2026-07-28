import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import { legacyModuleAnalytics } from '@/lib/progress/legacyAnalytics';
import type { ProgressRecommendation } from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

const moduleOrder = new Map(modules.map((module, index) => [module.id, index]));
const courseOrder = new Map(courses.map((course, index) => [course.id, index]));

function sortRecommendations(items: ProgressRecommendation[]): ProgressRecommendation[] {
  return [...items].sort((left, right) => (
    left.priority - right.priority
    || (courseOrder.get(moduleMap.get(left.moduleId)?.courseId ?? '') ?? 999)
      - (courseOrder.get(moduleMap.get(right.moduleId)?.courseId ?? '') ?? 999)
    || (moduleOrder.get(left.moduleId) ?? 999) - (moduleOrder.get(right.moduleId) ?? 999)
    || left.id.localeCompare(right.id)
  ));
}

export function legacyRecommendations(store: StoreV2): ProgressRecommendation[] {
  const items: ProgressRecommendation[] = [];
  modules.forEach((module) => {
    const analytics = legacyModuleAnalytics(module, store);
    if (analytics.activeAttempt) {
      items.push({
        id: `resume-legacy:${module.id}`,
        title: `Resume ${module.shortTitle}`,
        reason: `${analytics.activeAttempt.answeredCount} of 50 questions answered.`,
        priority: 2,
        moduleId: module.id,
        destination: { view: 'quiz', moduleId: module.id },
      });
    } else if (analytics.readingPercentage < 100) {
      items.push({
        id: `continue-reading:${module.id}`,
        title: `Continue ${module.shortTitle} notes`,
        reason: `${analytics.readingPercentage}% of the module has been marked reviewed.`,
        priority: 7,
        moduleId: module.id,
        destination: { view: 'study', moduleId: module.id },
      });
    } else if (analytics.savedResultCount === 0) {
      items.push({
        id: `first-legacy:${module.id}`,
        title: `Take the ${module.shortTitle} quiz`,
        reason: 'No saved quiz result exists on this browser.',
        priority: 8,
        moduleId: module.id,
        destination: { view: 'quiz', moduleId: module.id },
      });
    } else if ((analytics.latestPercentage ?? 100) < 70) {
      items.push({
        id: `retake-legacy:${module.id}`,
        title: `Retake ${module.shortTitle}`,
        reason: `The latest saved quiz score is ${analytics.latestPercentage}%.`,
        priority: 9,
        moduleId: module.id,
        destination: { view: 'quiz', moduleId: module.id },
      });
    } else {
      items.push({
        id: `review-legacy:${module.id}`,
        title: `Review ${module.shortTitle} results`,
        reason: 'Review the latest saved answers and explanations.',
        priority: 10,
        moduleId: module.id,
        destination: { view: 'results', moduleId: module.id },
      });
    }
  });
  return sortRecommendations(items);
}
