import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  validateBloodSupplyCuratedAttempt,
  validateBloodSupplyCuratedResult,
} from '@/lib/assessment/blood-supply/compatibility';
import {
  BLOOD_SUPPLY_BLUEPRINT_ID,
  BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/blood-supply/config';
import { bloodSupplyPracticeDefinition } from '@/lib/assessment/blood-supply/definition';
import { buildDraftOnlyBloodSupplyRegistry } from '@/lib/assessment/blood-supply/registry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

function fixture() {
  const built = buildDraftOnlyBloodSupplyRegistry();
  if (!built.ok) throw new Error('Blood Supply registry should build.');
  return { registry: built.value, store: createEmptyStoreV2() };
}

describe('Blood Supply curated compatibility', () => {
  it('creates and verifies exact Full attempts and deterministic results', () => {
    const { registry, store } = fixture();
    const created = bloodSupplyPracticeDefinition.createAttempt(
      { ...bloodSupplyPracticeDefinition.defaultRequest(), seed: 'blood-full' },
      store,
      registry,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.blueprintId).toBe(BLOOD_SUPPLY_BLUEPRINT_ID);
    expect(created.value.orderedQuestionIds).toHaveLength(50);
    expect(validateBloodSupplyCuratedAttempt(created.value, registry).ok).toBe(true);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T10:30:00.000Z'),
      idFactory: () => 'result-blood-full',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(validateBloodSupplyCuratedResult(
      finalized.value.result,
      registry,
    ).ok).toBe(true);
  });

  it('fails closed on blueprint, version, profile and evidence tampering', () => {
    const { registry, store } = fixture();
    const created = bloodSupplyPracticeDefinition.createAttempt(
      { ...bloodSupplyPracticeDefinition.defaultRequest(), seed: 'blood-tamper' },
      store,
      registry,
    );
    if (!created.ok) throw new Error('Blood Supply attempt should build.');
    expect(validateBloodSupplyCuratedAttempt({
      ...created.value,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);

    const version = structuredClone(created.value);
    version.questionVersions[version.orderedQuestionIds[0]] += 1;
    expect(validateBloodSupplyCuratedAttempt(version, registry).ok).toBe(false);

    const profile = structuredClone(created.value);
    profile.practiceSelection!.profileId = 'quick';
    expect(validateBloodSupplyCuratedAttempt(profile, registry).ok).toBe(false);

    const evidence = structuredClone(created.value);
    evidence.practiceSelection!.strategyEligibleQuestionIds = [
      evidence.orderedQuestionIds[0],
    ];
    expect(validateBloodSupplyCuratedAttempt(evidence, registry).ok).toBe(false);
  });

  it('supports generic Custom and Targeted practice without weakening filters', () => {
    const { registry, store } = fixture();
    const custom = bloodSupplyPracticeDefinition.createAttempt({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['arterial-origins'],
      formats: ['single_best_answer'],
      difficulties: ['foundation', 'intermediate'],
      seed: 'blood-custom',
    }, store, registry);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.value.orderedQuestionIds).toHaveLength(5);
      expect(validateBloodSupplyCuratedAttempt(custom.value, registry).ok).toBe(true);
    }
    const targeted = bloodSupplyPracticeDefinition.createAttempt({
      profileId: 'targeted',
      strategy: 'unseen',
      requestedCount: 10,
      seed: 'blood-targeted',
    }, store, registry);
    expect(targeted.ok).toBe(true);
    if (targeted.ok) {
      expect(targeted.value.orderedQuestionIds).toHaveLength(10);
      expect(validateBloodSupplyCuratedAttempt(
        targeted.value,
        registry,
      ).ok).toBe(true);
    }
  });

  it.each([0, 1, 2])(
    'keeps Written practice manual-only with %i supplied responses',
    (responseCount) => {
      const { registry, store } = fixture();
      const created = bloodSupplyPracticeDefinition.createAttempt({
        profileId: 'written',
        requestedCount: 2,
        seed: `blood-written-${responseCount}`,
      }, store, registry);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.blueprintId).toBe(BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID);
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
        idFactory: () => `result-blood-written-${responseCount}`,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) return;
      expect(finalized.value.result.score).toBeNull();
      expect(finalized.value.result.maxScore).toBeNull();
      expect(finalized.value.report.manualRequiredCount).toBe(responseCount);
      expect(validateBloodSupplyCuratedResult(
        finalized.value.result,
        registry,
      ).ok).toBe(true);
    },
  );
});
