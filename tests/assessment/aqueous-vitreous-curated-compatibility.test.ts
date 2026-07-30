import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  validateAqueousVitreousCuratedAttempt,
  validateAqueousVitreousCuratedResult,
} from '@/lib/assessment/aqueous-vitreous-curated/compatibility';
import {
  AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
  AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/aqueous-vitreous-curated/config';
import { aqueousVitreousCuratedPracticeDefinition } from '@/lib/assessment/aqueous-vitreous-curated/definition';
import { buildDraftOnlyAqueousVitreousCuratedRegistry } from '@/lib/assessment/aqueous-vitreous-curated/registry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

function fixture() {
  const built = buildDraftOnlyAqueousVitreousCuratedRegistry();
  if (!built.ok) throw new Error('Aqueous and Vitreous registry should build.');
  return { registry: built.value, store: createEmptyStoreV2() };
}

describe('Aqueous and Vitreous curated compatibility', () => {
  it('creates and verifies exact Full attempts and deterministic results', () => {
    const { registry, store } = fixture();
    const created = aqueousVitreousCuratedPracticeDefinition.createAttempt(
      { ...aqueousVitreousCuratedPracticeDefinition.defaultRequest(), seed: 'aqueous-curated-full' },
      store,
      registry,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.blueprintId).toBe(AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID);
    expect(created.value.orderedQuestionIds).toHaveLength(50);
    expect(validateAqueousVitreousCuratedAttempt(created.value, registry).ok).toBe(true);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T10:30:00.000Z'),
      idFactory: () => 'result-aqueous-curated-full',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(validateAqueousVitreousCuratedResult(
      finalized.value.result,
      registry,
    ).ok).toBe(true);
  });

  it('fails closed on blueprint, version, profile and evidence tampering', () => {
    const { registry, store } = fixture();
    const created = aqueousVitreousCuratedPracticeDefinition.createAttempt(
      { ...aqueousVitreousCuratedPracticeDefinition.defaultRequest(), seed: 'aqueous-curated-tamper' },
      store,
      registry,
    );
    if (!created.ok) throw new Error('Aqueous and Vitreous attempt should build.');
    expect(validateAqueousVitreousCuratedAttempt({
      ...created.value,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);

    const version = structuredClone(created.value);
    version.questionVersions[version.orderedQuestionIds[0]] += 1;
    expect(validateAqueousVitreousCuratedAttempt(version, registry).ok).toBe(false);

    const profile = structuredClone(created.value);
    profile.practiceSelection!.profileId = 'quick';
    expect(validateAqueousVitreousCuratedAttempt(profile, registry).ok).toBe(false);

    const evidence = structuredClone(created.value);
    evidence.practiceSelection!.strategyEligibleQuestionIds = [
      evidence.orderedQuestionIds[0],
    ];
    expect(validateAqueousVitreousCuratedAttempt(evidence, registry).ok).toBe(false);
  });

  it('supports generic Custom and Targeted practice without weakening filters', () => {
    const { registry, store } = fixture();
    const custom = aqueousVitreousCuratedPracticeDefinition.createAttempt({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['flow'],
      formats: ['single_best_answer', 'matching'],
      difficulties: ['foundation', 'intermediate', 'advanced'],
      seed: 'aqueous-curated-custom',
    }, store, registry);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.value.orderedQuestionIds).toHaveLength(5);
      expect(validateAqueousVitreousCuratedAttempt(custom.value, registry).ok).toBe(true);
    }
    const targeted = aqueousVitreousCuratedPracticeDefinition.createAttempt({
      profileId: 'targeted',
      strategy: 'unseen',
      requestedCount: 10,
      seed: 'aqueous-curated-targeted',
    }, store, registry);
    expect(targeted.ok).toBe(true);
    if (targeted.ok) {
      expect(targeted.value.orderedQuestionIds).toHaveLength(10);
      expect(validateAqueousVitreousCuratedAttempt(
        targeted.value,
        registry,
      ).ok).toBe(true);
    }
  });

  it.each([0, 1, 2])(
    'keeps Written practice manual-only with %i supplied responses',
    (responseCount) => {
      const { registry, store } = fixture();
      const created = aqueousVitreousCuratedPracticeDefinition.createAttempt({
        profileId: 'written',
        requestedCount: 2,
        seed: `aqueous-curated-written-${responseCount}`,
      }, store, registry);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.blueprintId).toBe(AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID);
      created.value.orderedQuestionIds
        .slice(0, responseCount)
        .forEach((questionId) => {
          created.value.responses[questionId] = {
            format: 'open_response',
            text: `Learner response for ${questionId}`,
          };
        });
      const finalized = finalizeGradedAssessmentAttempt({
        attempt: created.value,
        registry,
        now: () => new Date('2026-07-30T11:00:00.000Z'),
        idFactory: () => `result-aqueous-curated-written-${responseCount}`,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) return;
      expect(finalized.value.result.score).toBeNull();
      expect(finalized.value.result.maxScore).toBeNull();
      expect(finalized.value.report.manualRequiredCount).toBe(responseCount);
      expect(validateAqueousVitreousCuratedResult(
        finalized.value.result,
        registry,
      ).ok).toBe(true);
    },
  );
});
