import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { environmentalVisionPracticeDefinition } from '@/lib/assessment/environmental-vision/definition';
import {
  getEnvironmentalVisionProgressContribution,
} from '@/lib/progress/environmentalVisionProgressModule';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('generic Environmental Vision progress adapter', () => {
  it('keeps current-version curated evidence separate from legacy scores', () => {
    const store = createEmptyStoreV2();
    if (!environmentalVisionPracticeDefinition.registryResult.ok) {
      throw new Error('Environmental Vision registry should build.');
    }
    const registry = environmentalVisionPracticeDefinition.registryResult.value;
    const created = environmentalVisionPracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'environmental-vision-progress',
    }, store, registry);
    if (!created.ok) throw new Error('Quick practice should build.');
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T12:00:00.000Z'),
      idFactory: () => 'result-environmental-vision-progress',
    });
    if (!finalized.ok) throw new Error('Quick practice should finalize.');
    store.assessment.results[finalized.value.result.id] =
      finalized.value.result;
    store.results['environmental-vision'] = [{
      id: 'legacy-environmental-vision-result',
      moduleId: 'environmental-vision',
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

    const contribution = getEnvironmentalVisionProgressContribution(store);
    expect(contribution).toMatchObject({
      experienceId: 'environmental-vision',
      moduleId: 'environmental-vision',
      hasStoredData: true,
      integrityOmissionCount: 0,
    });
    expect(contribution.activity).toEqual([
      expect.objectContaining({
        id: 'curated-completed:result-environmental-vision-progress',
        label: 'Curated practice completed',
      }),
    ]);
    expect(contribution.activity.some(
      (activity) => activity.id.includes('legacy'),
    )).toBe(false);
  });
});
