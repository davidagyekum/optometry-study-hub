import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { autonomicPharmacologyPracticeDefinition } from '@/lib/assessment/autonomic-pharmacology/definition';
import {
  getAutonomicPharmacologyProgressContribution,
} from '@/lib/progress/autonomicPharmacologyProgressModule';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('generic Autonomic Pharmacology progress adapter', () => {
  it('keeps current-version curated evidence separate from legacy scores', () => {
    const store = createEmptyStoreV2();
    if (!autonomicPharmacologyPracticeDefinition.registryResult.ok) {
      throw new Error('Autonomic Pharmacology registry should build.');
    }
    const registry = autonomicPharmacologyPracticeDefinition.registryResult.value;
    const created = autonomicPharmacologyPracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'autonomic-pharmacology-progress',
    }, store, registry);
    if (!created.ok) throw new Error('Quick practice should build.');
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T12:00:00.000Z'),
      idFactory: () => 'result-autonomic-pharmacology-progress',
    });
    if (!finalized.ok) throw new Error('Quick practice should finalize.');
    store.assessment.results[finalized.value.result.id] =
      finalized.value.result;
    store.results['autonomic-pharmacology'] = [{
      id: 'legacy-autonomic-pharmacology-result',
      moduleId: 'autonomic-pharmacology',
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

    const contribution = getAutonomicPharmacologyProgressContribution(store);
    expect(contribution).toMatchObject({
      experienceId: 'autonomic-pharmacology',
      moduleId: 'autonomic-pharmacology',
      hasStoredData: true,
      integrityOmissionCount: 0,
    });
    expect(contribution.activity).toEqual([
      expect.objectContaining({
        id: 'curated-completed:result-autonomic-pharmacology-progress',
        label: 'Curated practice completed',
      }),
    ]);
    expect(contribution.activity.some(
      (activity) => activity.id.includes('legacy'),
    )).toBe(false);
  });
});
