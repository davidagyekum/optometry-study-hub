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

export function resetAssessmentModule(store: StoreV2, moduleId: string): StoreV2 {
  return resetAssessmentWhere(store, (record) => record.moduleId === moduleId);
}

export function resetAssessmentCourse(store: StoreV2, courseId: string): StoreV2 {
  return resetAssessmentWhere(store, (record) => record.courseId === courseId);
}
