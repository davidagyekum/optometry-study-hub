import { describe, expect, it } from 'vitest';
import {
  resetAssessmentCourse,
  resetAssessmentModule,
} from '@/lib/storage/assessmentReset';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';
import { makeAttempt, makeResult } from '@/tests/fixtures/session-engine';

function pilotStore(): StoreV2 {
  const aqueous = makeAttempt(undefined, {
    idFactory: () => 'attempt-aqueous',
    blueprintId: 'aqueous-vitreous-pilot-v1',
  });
  const other = {
    ...makeAttempt(undefined, { idFactory: () => 'attempt-other' }),
    courseId: 'pharmacology',
    moduleId: 'autonomic-pharmacology',
  };
  return {
    ...createEmptyStoreV2(),
    read: { 'aqueous-vitreous': ['flow'] },
    results: { 'aqueous-vitreous': [] },
    assessment: {
      activeAttempts: { [aqueous.id]: aqueous, [other.id]: other },
      results: {
        'result-aqueous': { ...makeResult(aqueous), id: 'result-aqueous' },
        'result-other': { ...makeResult(other), id: 'result-other' },
      },
      questionHistory: {
        'question-history': {
          questionId: 'question-history',
          version: 1,
          attemptCount: 1,
          correctCount: 0,
        },
      },
    },
  };
}

describe('pilot assessment resets', () => {
  it('clears only matching module attempts and results immutably', () => {
    const source = pilotStore();
    const before = structuredClone(source);
    const reset = resetAssessmentModule(source, 'aqueous-vitreous');
    expect(source).toEqual(before);
    expect(reset.assessment.activeAttempts['attempt-aqueous']).toBeUndefined();
    expect(reset.assessment.results['result-aqueous']).toBeUndefined();
    expect(reset.assessment.activeAttempts['attempt-other']).toBeDefined();
    expect(reset.assessment.results['result-other']).toBeDefined();
    expect(reset.assessment.questionHistory).toEqual(source.assessment.questionHistory);
    expect(reset.read).toEqual(source.read);
  });

  it('clears only matching course records and keeps global empty behavior intact', () => {
    const source = pilotStore();
    const reset = resetAssessmentCourse(source, 'neuro-anatomy');
    expect(reset.assessment.activeAttempts['attempt-aqueous']).toBeUndefined();
    expect(reset.assessment.results['result-aqueous']).toBeUndefined();
    expect(reset.assessment.activeAttempts['attempt-other']).toBeDefined();
    expect(createEmptyStoreV2().assessment).toEqual({
      activeAttempts: {},
      results: {},
      questionHistory: {},
    });
  });
});
