import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  validateSystemicPathologyCuratedAttempt,
  validateSystemicPathologyCuratedResult,
} from '@/lib/assessment/systemic-pathology/compatibility';
import {
  SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
  SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/systemic-pathology/config';
import { systemicPathologyPracticeDefinition } from '@/lib/assessment/systemic-pathology/definition';
import { buildDraftOnlySystemicPathologyRegistry } from '@/lib/assessment/systemic-pathology/registry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

function fixture() {
  const built = buildDraftOnlySystemicPathologyRegistry();
  if (!built.ok) throw new Error('Systemic Pathology registry should build.');
  return { registry: built.value, store: createEmptyStoreV2() };
}

describe('Systemic Pathology curated compatibility', () => {
  it('creates and verifies exact Full attempts and deterministic results', () => {
    const { registry, store } = fixture();
    const created = systemicPathologyPracticeDefinition.createAttempt(
      { ...systemicPathologyPracticeDefinition.defaultRequest(), seed: 'systemic-pathology-full' },
      store,
      registry,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.blueprintId).toBe(SYSTEMIC_PATHOLOGY_BLUEPRINT_ID);
    expect(created.value.orderedQuestionIds).toHaveLength(50);
    expect(validateSystemicPathologyCuratedAttempt(created.value, registry).ok).toBe(true);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T10:30:00.000Z'),
      idFactory: () => 'result-systemic-pathology-full',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(validateSystemicPathologyCuratedResult(
      finalized.value.result,
      registry,
    ).ok).toBe(true);
  });

  it('fails closed on blueprint, version, profile and evidence tampering', () => {
    const { registry, store } = fixture();
    const created = systemicPathologyPracticeDefinition.createAttempt(
      { ...systemicPathologyPracticeDefinition.defaultRequest(), seed: 'systemic-pathology-tamper' },
      store,
      registry,
    );
    if (!created.ok) throw new Error('Systemic Pathology attempt should build.');
    expect(validateSystemicPathologyCuratedAttempt({
      ...created.value,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);

    const version = structuredClone(created.value);
    version.questionVersions[version.orderedQuestionIds[0]] += 1;
    expect(validateSystemicPathologyCuratedAttempt(version, registry).ok).toBe(false);

    const profile = structuredClone(created.value);
    profile.practiceSelection!.profileId = 'quick';
    expect(validateSystemicPathologyCuratedAttempt(profile, registry).ok).toBe(false);

    const evidence = structuredClone(created.value);
    evidence.practiceSelection!.strategyEligibleQuestionIds = [
      evidence.orderedQuestionIds[0],
    ];
    expect(validateSystemicPathologyCuratedAttempt(evidence, registry).ok).toBe(false);
  });

  it('supports generic Custom and Targeted practice without weakening filters', () => {
    const { registry, store } = fixture();
    const custom = systemicPathologyPracticeDefinition.createAttempt({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['path-breast'],
      formats: ['single_best_answer'],
      difficulties: ['foundation', 'intermediate'],
      seed: 'systemic-pathology-custom',
    }, store, registry);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.value.orderedQuestionIds).toHaveLength(5);
      expect(validateSystemicPathologyCuratedAttempt(custom.value, registry).ok).toBe(true);
    }
    const targeted = systemicPathologyPracticeDefinition.createAttempt({
      profileId: 'targeted',
      strategy: 'unseen',
      requestedCount: 10,
      seed: 'systemic-pathology-targeted',
    }, store, registry);
    expect(targeted.ok).toBe(true);
    if (targeted.ok) {
      expect(targeted.value.orderedQuestionIds).toHaveLength(10);
      expect(validateSystemicPathologyCuratedAttempt(
        targeted.value,
        registry,
      ).ok).toBe(true);
    }
  });

  it.each([0, 1, 2])(
    'keeps Written practice manual-only with %i supplied responses',
    (responseCount) => {
      const { registry, store } = fixture();
      const created = systemicPathologyPracticeDefinition.createAttempt({
        profileId: 'written',
        requestedCount: 2,
        seed: `systemic-pathology-written-${responseCount}`,
      }, store, registry);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.blueprintId).toBe(SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID);
      expect(new Set(created.value.orderedQuestionIds)).toEqual(new Set([
        'cardio-cardiomyopathy-compare-open-001',
        'endocrine-adrenal-feedback-open-001',
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
        idFactory: () => `result-systemic-pathology-written-${responseCount}`,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) return;
      expect(finalized.value.result.score).toBeNull();
      expect(finalized.value.result.maxScore).toBeNull();
      expect(finalized.value.report.manualRequiredCount).toBe(responseCount);
      expect(validateSystemicPathologyCuratedResult(
        finalized.value.result,
        registry,
      ).ok).toBe(true);
    },
  );
});
