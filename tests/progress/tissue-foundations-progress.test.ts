import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { tissuePracticeDefinition } from '@/lib/assessment/tissue-foundations/definition';
import {
  getTissueProgressContribution,
} from '@/lib/progress/tissueFoundationsProgressModule';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('generic Tissue Foundations progress adapter', () => {
  it('keeps current-version curated evidence separate from legacy scores', () => {
    const store = createEmptyStoreV2();
    if (!tissuePracticeDefinition.registryResult.ok) {
      throw new Error('Tissue registry should build.');
    }
    const registry = tissuePracticeDefinition.registryResult.value;
    const created = tissuePracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'tissue-progress',
    }, store, registry);
    if (!created.ok) throw new Error('Quick practice should build.');
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T12:00:00.000Z'),
      idFactory: () => 'result-tissue-progress',
    });
    if (!finalized.ok) throw new Error('Quick practice should finalize.');
    store.assessment.results[finalized.value.result.id] =
      finalized.value.result;
    store.results['tissue-foundations'] = [{
      id: 'legacy-tissue-result',
      moduleId: 'tissue-foundations',
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

    const contribution = getTissueProgressContribution(store);
    expect(contribution).toMatchObject({
      experienceId: 'opt376-tissue-foundations-curated-v1',
      moduleId: 'tissue-foundations',
      hasStoredData: true,
      integrityOmissionCount: 0,
    });
    expect(contribution.activity).toEqual([
      expect.objectContaining({
        id: 'curated-completed:result-tissue-progress',
        label: 'Curated practice completed',
      }),
    ]);
    expect(contribution.activity.some(
      (activity) => activity.id.includes('legacy'),
    )).toBe(false);
  });
});
