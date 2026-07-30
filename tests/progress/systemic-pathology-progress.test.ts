import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { systemicPathologyPracticeDefinition } from '@/lib/assessment/systemic-pathology/definition';
import {
  getSystemicPathologyProgressContribution,
} from '@/lib/progress/systemicPathologyProgressModule';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('generic Systemic Pathology progress adapter', () => {
  it('keeps current-version curated evidence separate from legacy scores', () => {
    const store = createEmptyStoreV2();
    if (!systemicPathologyPracticeDefinition.registryResult.ok) {
      throw new Error('Systemic Pathology registry should build.');
    }
    const registry = systemicPathologyPracticeDefinition.registryResult.value;
    const created = systemicPathologyPracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'systemic-pathology-progress',
    }, store, registry);
    if (!created.ok) throw new Error('Quick practice should build.');
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T12:00:00.000Z'),
      idFactory: () => 'result-systemic-pathology-progress',
    });
    if (!finalized.ok) throw new Error('Quick practice should finalize.');
    store.assessment.results[finalized.value.result.id] =
      finalized.value.result;
    store.results['systemic-pathology'] = [{
      id: 'legacy-systemic-pathology-result',
      moduleId: 'systemic-pathology',
      startedAt: '2026-07-30T10:00:00.000Z',
      submittedAt: '2026-07-30T11:00:00.000Z',
      order: [],
      optionOrder: {},
      answers: {},
      flags: [],
      current: 0,
      score: 50,
      total: 50,
    }];

    const contribution = getSystemicPathologyProgressContribution(store);
    expect(contribution).toMatchObject({
      experienceId: 'systemic-pathology',
      moduleId: 'systemic-pathology',
      hasStoredData: true,
      integrityOmissionCount: 0,
    });
    expect(contribution.activity).toEqual([
      expect.objectContaining({
        id: 'curated-completed:result-systemic-pathology-progress',
        label: 'Curated practice completed',
      }),
    ]);
    expect(contribution.activity.some(
      (activity) => activity.id.includes('legacy'),
    )).toBe(false);
  });
});
