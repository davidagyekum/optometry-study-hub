import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  validateAutonomicPharmacologyCuratedAttempt,
  validateAutonomicPharmacologyCuratedResult,
} from '@/lib/assessment/autonomic-pharmacology/compatibility';
import {
  AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
  AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/autonomic-pharmacology/config';
import { autonomicPharmacologyPracticeDefinition } from '@/lib/assessment/autonomic-pharmacology/definition';
import { buildDraftOnlyAutonomicPharmacologyRegistry } from '@/lib/assessment/autonomic-pharmacology/registry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

function fixture() {
  const built = buildDraftOnlyAutonomicPharmacologyRegistry();
  if (!built.ok) throw new Error('Autonomic Pharmacology registry should build.');
  return { registry: built.value, store: createEmptyStoreV2() };
}

describe('Autonomic Pharmacology curated compatibility', () => {
  it('creates and verifies exact Full attempts and deterministic results', () => {
    const { registry, store } = fixture();
    const created = autonomicPharmacologyPracticeDefinition.createAttempt(
      { ...autonomicPharmacologyPracticeDefinition.defaultRequest(), seed: 'autonomic-pharmacology-full' },
      store,
      registry,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.blueprintId).toBe(AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID);
    expect(created.value.orderedQuestionIds).toHaveLength(50);
    expect(validateAutonomicPharmacologyCuratedAttempt(created.value, registry).ok).toBe(true);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T10:30:00.000Z'),
      idFactory: () => 'result-autonomic-pharmacology-full',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(validateAutonomicPharmacologyCuratedResult(
      finalized.value.result,
      registry,
    ).ok).toBe(true);
  });

  it('fails closed on blueprint, version, profile and evidence tampering', () => {
    const { registry, store } = fixture();
    const created = autonomicPharmacologyPracticeDefinition.createAttempt(
      { ...autonomicPharmacologyPracticeDefinition.defaultRequest(), seed: 'autonomic-pharmacology-tamper' },
      store,
      registry,
    );
    if (!created.ok) throw new Error('Autonomic Pharmacology attempt should build.');
    expect(validateAutonomicPharmacologyCuratedAttempt({
      ...created.value,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);

    const version = structuredClone(created.value);
    version.questionVersions[version.orderedQuestionIds[0]] += 1;
    expect(validateAutonomicPharmacologyCuratedAttempt(version, registry).ok).toBe(false);

    const profile = structuredClone(created.value);
    profile.practiceSelection!.profileId = 'quick';
    expect(validateAutonomicPharmacologyCuratedAttempt(profile, registry).ok).toBe(false);

    const evidence = structuredClone(created.value);
    evidence.practiceSelection!.strategyEligibleQuestionIds = [
      evidence.orderedQuestionIds[0],
    ];
    expect(validateAutonomicPharmacologyCuratedAttempt(evidence, registry).ok).toBe(false);
  });

  it('supports generic Custom and Targeted practice without weakening filters', () => {
    const { registry, store } = fixture();
    const custom = autonomicPharmacologyPracticeDefinition.createAttempt({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['pharm-adrenergic'],
      formats: ['single_best_answer'],
      difficulties: ['foundation', 'intermediate'],
      seed: 'autonomic-pharmacology-custom',
    }, store, registry);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.value.orderedQuestionIds).toHaveLength(5);
      expect(validateAutonomicPharmacologyCuratedAttempt(custom.value, registry).ok).toBe(true);
    }
    const targeted = autonomicPharmacologyPracticeDefinition.createAttempt({
      profileId: 'targeted',
      strategy: 'unseen',
      requestedCount: 10,
      seed: 'autonomic-pharmacology-targeted',
    }, store, registry);
    expect(targeted.ok).toBe(true);
    if (targeted.ok) {
      expect(targeted.value.orderedQuestionIds).toHaveLength(10);
      expect(validateAutonomicPharmacologyCuratedAttempt(
        targeted.value,
        registry,
      ).ok).toBe(true);
    }
  });

  it.each([0, 1, 2])(
    'keeps Written practice manual-only with %i supplied responses',
    (responseCount) => {
      const { registry, store } = fixture();
      const created = autonomicPharmacologyPracticeDefinition.createAttempt({
        profileId: 'written',
        requestedCount: 2,
        seed: `autonomic-pharmacology-written-${responseCount}`,
      }, store, registry);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.blueprintId).toBe(AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID);
      expect(new Set(created.value.orderedQuestionIds)).toEqual(new Set([
        'pharm-adr-ocular-regimen-open-001',
        'pharm-chol-organophosphate-plan-open-001',
      ]));
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
        idFactory: () => `result-autonomic-pharmacology-written-${responseCount}`,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) return;
      expect(finalized.value.result.score).toBeNull();
      expect(finalized.value.result.maxScore).toBeNull();
      expect(finalized.value.report.manualRequiredCount).toBe(responseCount);
      expect(validateAutonomicPharmacologyCuratedResult(
        finalized.value.result,
        registry,
      ).ok).toBe(true);
    },
  );
});
