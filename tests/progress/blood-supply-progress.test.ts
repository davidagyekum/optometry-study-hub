import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { bloodSupplyPracticeDefinition } from '@/lib/assessment/blood-supply/definition';
import {
  getBloodSupplyProgressContribution,
} from '@/lib/progress/bloodSupplyProgressModule';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('generic Blood Supply progress adapter', () => {
  it('keeps current-version curated evidence separate from legacy scores', () => {
    const store = createEmptyStoreV2();
    if (!bloodSupplyPracticeDefinition.registryResult.ok) {
      throw new Error('Blood Supply registry should build.');
    }
    const registry = bloodSupplyPracticeDefinition.registryResult.value;
    const created = bloodSupplyPracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'blood-progress',
    }, store, registry);
    if (!created.ok) throw new Error('Quick practice should build.');
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T12:00:00.000Z'),
      idFactory: () => 'result-blood-progress',
    });
    if (!finalized.ok) throw new Error('Quick practice should finalize.');
    store.assessment.results[finalized.value.result.id] =
      finalized.value.result;
    store.results['blood-supply'] = [{
      id: 'legacy-ocular-result',
      moduleId: 'blood-supply',
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

    const contribution = getBloodSupplyProgressContribution(store);
    expect(contribution).toMatchObject({
      experienceId: 'blood-supply',
      moduleId: 'blood-supply',
      hasStoredData: true,
      integrityOmissionCount: 0,
    });
    expect(contribution.activity).toEqual([
      expect.objectContaining({
        id: 'curated-completed:result-blood-progress',
        label: 'Curated practice completed',
      }),
    ]);
    expect(contribution.activity.some(
      (activity) => activity.id.includes('legacy'),
    )).toBe(false);
  });
});
