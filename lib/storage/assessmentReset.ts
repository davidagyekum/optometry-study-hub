import { storeV2Schema, type StoreV2 } from '@/lib/storage/schemas';

function resetAssessmentWhere(
  store: StoreV2,
  matches: (record: { courseId: string; moduleId: string }) => boolean,
): StoreV2 {
  const activeAttempts = Object.fromEntries(
    Object.entries(store.assessment.activeAttempts)
      .filter(([, attempt]) => !matches(attempt)),
  );
  const results = Object.fromEntries(
    Object.entries(store.assessment.results)
      .filter(([, result]) => !matches(result)),
  );
  return storeV2Schema.parse({
    ...store,
    assessment: {
      ...store.assessment,
      activeAttempts,
      results,
    },
  });
}

function hasAssessmentWhere(
  store: StoreV2,
  matches: (record: { courseId: string; moduleId: string }) => boolean,
): boolean {
  return Object.values(store.assessment.activeAttempts).some(matches)
    || Object.values(store.assessment.results).some(matches);
}

export function moduleResetConfirmation(
  store: StoreV2,
  moduleId: string,
  pilotEnabled: boolean,
): string {
  const mentionAssessment = pilotEnabled
    || hasAssessmentWhere(store, (record) => record.moduleId === moduleId);
  return mentionAssessment
    ? 'Clear reading progress, active quiz, score history, and saved controlled-practice attempts and results for this module? Question history is retained.'
    : 'Clear reading progress, active quiz and score history for this module?';
}

export function courseResetConfirmation(
  store: StoreV2,
  courseId: string,
  courseTitle: string,
  pilotEnabled: boolean,
): string {
  const mentionAssessment = pilotEnabled
    || hasAssessmentWhere(store, (record) => record.courseId === courseId);
  return mentionAssessment
    ? `Clear all notes progress, active quizzes, score history, and saved controlled-practice attempts and results for ${courseTitle}? Question history is retained.`
    : `Clear all notes progress, active quizzes and score history for ${courseTitle}?`;
}

export function resetAssessmentModule(store: StoreV2, moduleId: string): StoreV2 {
  return resetAssessmentWhere(store, (record) => record.moduleId === moduleId);
}

export function resetAssessmentCourse(store: StoreV2, courseId: string): StoreV2 {
  return resetAssessmentWhere(store, (record) => record.courseId === courseId);
}

export function resetCourseStudyData(
  store: StoreV2,
  courseId: string,
  moduleIds: readonly string[],
): StoreV2 {
  const read = { ...store.read };
  const active = { ...store.active };
  const results = { ...store.results };
  moduleIds.forEach((moduleId) => {
    read[moduleId] = [];
    active[moduleId] = undefined;
    results[moduleId] = [];
  });
  return resetAssessmentCourse({
    ...store,
    read,
    active,
    results,
  }, courseId);
}
