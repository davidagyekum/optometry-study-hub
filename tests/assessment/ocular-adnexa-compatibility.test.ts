import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  validateOcularAdnexaCuratedAttempt,
  validateOcularAdnexaCuratedResult,
} from '@/lib/assessment/ocular-adnexa/compatibility';
import {
  OCULAR_ADNEXA_BLUEPRINT_ID,
  OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/ocular-adnexa/config';
import { ocularAdnexaPracticeDefinition } from '@/lib/assessment/ocular-adnexa/definition';
import { buildDraftOnlyOcularAdnexaRegistry } from '@/lib/assessment/ocular-adnexa/registry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

function fixture() {
  const built = buildDraftOnlyOcularAdnexaRegistry();
  if (!built.ok) throw new Error('Ocular Adnexa registry should build.');
  return { registry: built.value, store: createEmptyStoreV2() };
}

describe('Ocular Adnexa curated compatibility', () => {
  it('creates and verifies exact Full attempts and deterministic results', () => {
    const { registry, store } = fixture();
    const created = ocularAdnexaPracticeDefinition.createAttempt(
      { ...ocularAdnexaPracticeDefinition.defaultRequest(), seed: 'ocular-full' },
      store,
      registry,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.blueprintId).toBe(OCULAR_ADNEXA_BLUEPRINT_ID);
    expect(created.value.orderedQuestionIds).toHaveLength(50);
    expect(validateOcularAdnexaCuratedAttempt(created.value, registry).ok).toBe(true);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T10:30:00.000Z'),
      idFactory: () => 'result-ocular-full',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(validateOcularAdnexaCuratedResult(
      finalized.value.result,
      registry,
    ).ok).toBe(true);
  });

  it('fails closed on blueprint, version, profile and evidence tampering', () => {
    const { registry, store } = fixture();
    const created = ocularAdnexaPracticeDefinition.createAttempt(
      { ...ocularAdnexaPracticeDefinition.defaultRequest(), seed: 'ocular-tamper' },
      store,
      registry,
    );
    if (!created.ok) throw new Error('Ocular Adnexa attempt should build.');
    expect(validateOcularAdnexaCuratedAttempt({
      ...created.value,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);

    const version = structuredClone(created.value);
    version.questionVersions[version.orderedQuestionIds[0]] += 1;
    expect(validateOcularAdnexaCuratedAttempt(version, registry).ok).toBe(false);

    const profile = structuredClone(created.value);
    profile.practiceSelection!.profileId = 'quick';
    expect(validateOcularAdnexaCuratedAttempt(profile, registry).ok).toBe(false);

    const evidence = structuredClone(created.value);
    evidence.practiceSelection!.strategyEligibleQuestionIds = [
      evidence.orderedQuestionIds[0],
    ];
    expect(validateOcularAdnexaCuratedAttempt(evidence, registry).ok).toBe(false);
  });

  it('supports generic Custom and Targeted practice without weakening filters', () => {
    const { registry, store } = fixture();
    const custom = ocularAdnexaPracticeDefinition.createAttempt({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['landmarks'],
      formats: ['single_best_answer'],
      difficulties: ['foundation', 'intermediate'],
      seed: 'ocular-custom',
    }, store, registry);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.value.orderedQuestionIds).toHaveLength(5);
      expect(validateOcularAdnexaCuratedAttempt(custom.value, registry).ok).toBe(true);
    }
    const targeted = ocularAdnexaPracticeDefinition.createAttempt({
      profileId: 'targeted',
      strategy: 'unseen',
      requestedCount: 10,
      seed: 'ocular-targeted',
    }, store, registry);
    expect(targeted.ok).toBe(true);
    if (targeted.ok) {
      expect(targeted.value.orderedQuestionIds).toHaveLength(10);
      expect(validateOcularAdnexaCuratedAttempt(
        targeted.value,
        registry,
      ).ok).toBe(true);
    }
  });

  it.each([0, 1, 2])(
    'keeps Written practice manual-only with %i supplied responses',
    (responseCount) => {
      const { registry, store } = fixture();
      const created = ocularAdnexaPracticeDefinition.createAttempt({
        profileId: 'written',
        requestedCount: 2,
        seed: `ocular-written-${responseCount}`,
      }, store, registry);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.blueprintId).toBe(OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID);
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
        idFactory: () => `result-ocular-written-${responseCount}`,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) return;
      expect(finalized.value.result.score).toBeNull();
      expect(finalized.value.result.maxScore).toBeNull();
      expect(finalized.value.report.manualRequiredCount).toBe(responseCount);
      expect(validateOcularAdnexaCuratedResult(
        finalized.value.result,
        registry,
      ).ok).toBe(true);
    },
  );
});
