import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { ocularAdnexaPracticeDefinition } from '@/lib/assessment/ocular-adnexa/definition';
import {
  getOcularAdnexaProgressContribution,
} from '@/lib/progress/ocularAdnexaProgressModule';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('generic Ocular Adnexa progress adapter', () => {
  it('keeps current-version curated evidence separate from legacy scores', () => {
    const store = createEmptyStoreV2();
    if (!ocularAdnexaPracticeDefinition.registryResult.ok) {
      throw new Error('Ocular Adnexa registry should build.');
    }
    const registry = ocularAdnexaPracticeDefinition.registryResult.value;
    const created = ocularAdnexaPracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'ocular-progress',
    }, store, registry);
    if (!created.ok) throw new Error('Quick practice should build.');
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T12:00:00.000Z'),
      idFactory: () => 'result-ocular-progress',
    });
    if (!finalized.ok) throw new Error('Quick practice should finalize.');
    store.assessment.results[finalized.value.result.id] =
      finalized.value.result;
    store.results['ocular-adnexa'] = [{
      id: 'legacy-ocular-result',
      moduleId: 'ocular-adnexa',
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

    const contribution = getOcularAdnexaProgressContribution(store);
    expect(contribution).toMatchObject({
      experienceId: 'ocular-adnexa',
      moduleId: 'ocular-adnexa',
      hasStoredData: true,
      integrityOmissionCount: 0,
    });
    expect(contribution.activity).toEqual([
      expect.objectContaining({
        id: 'curated-completed:result-ocular-progress',
        label: 'Curated practice completed',
      }),
    ]);
    expect(contribution.activity.some(
      (activity) => activity.id.includes('legacy'),
    )).toBe(false);
  });
});
