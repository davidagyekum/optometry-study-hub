import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { aqueousVitreousCuratedPracticeDefinition } from '@/lib/assessment/aqueous-vitreous-curated/definition';
import {
  getAqueousVitreousCuratedProgressContribution,
} from '@/lib/progress/aqueousVitreousCuratedProgressModule';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('generic Aqueous and Vitreous progress adapter', () => {
  it('keeps current-version curated evidence separate from legacy scores', () => {
    const store = createEmptyStoreV2();
    if (!aqueousVitreousCuratedPracticeDefinition.registryResult.ok) {
      throw new Error('Aqueous and Vitreous registry should build.');
    }
    const registry = aqueousVitreousCuratedPracticeDefinition.registryResult.value;
    const created = aqueousVitreousCuratedPracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'aqueous-curated-progress',
    }, store, registry);
    if (!created.ok) throw new Error('Quick practice should build.');
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T12:00:00.000Z'),
      idFactory: () => 'result-aqueous-curated-progress',
    });
    if (!finalized.ok) throw new Error('Quick practice should finalize.');
    store.assessment.results[finalized.value.result.id] =
      finalized.value.result;
    store.results['aqueous-vitreous'] = [{
      id: 'legacy-aqueous-curated-result',
      moduleId: 'aqueous-vitreous',
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

    const contribution = getAqueousVitreousCuratedProgressContribution(store);
    expect(contribution).toMatchObject({
      experienceId: 'aqueous-vitreous-curated',
      moduleId: 'aqueous-vitreous',
      hasStoredData: true,
      integrityOmissionCount: 0,
    });
    expect(contribution.activity).toEqual([
      expect.objectContaining({
        id: 'curated-completed:result-aqueous-curated-progress',
        label: 'Curated practice completed',
      }),
    ]);
    expect(contribution.activity.some(
      (activity) => activity.id.includes('legacy'),
    )).toBe(false);
  });
});
