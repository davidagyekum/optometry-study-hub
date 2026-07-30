import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  validateTissueCuratedAttempt,
  validateTissueCuratedResult,
} from '@/lib/assessment/tissue-foundations/compatibility';
import {
  TISSUE_CURATED_BLUEPRINT_ID,
  TISSUE_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/tissue-foundations/config';
import { tissuePracticeDefinition } from '@/lib/assessment/tissue-foundations/definition';
import { buildDraftOnlyTissueRegistry } from '@/lib/assessment/tissue-foundations/registry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

function fixture() {
  const built = buildDraftOnlyTissueRegistry();
  if (!built.ok) throw new Error('Tissue registry should build.');
  return { registry: built.value, store: createEmptyStoreV2() };
}

describe('Tissue Foundations curated compatibility', () => {
  it('creates and verifies exact Full attempts and deterministic results', () => {
    const { registry, store } = fixture();
    const created = tissuePracticeDefinition.createAttempt(
      { ...tissuePracticeDefinition.defaultRequest(), seed: 'tissue-full' },
      store,
      registry,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.blueprintId).toBe(TISSUE_CURATED_BLUEPRINT_ID);
    expect(created.value.orderedQuestionIds).toHaveLength(50);
    expect(validateTissueCuratedAttempt(created.value, registry).ok).toBe(true);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T10:30:00.000Z'),
      idFactory: () => 'result-tissue-full',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(validateTissueCuratedResult(
      finalized.value.result,
      registry,
    ).ok).toBe(true);
  });

  it('fails closed on blueprint, version, profile and evidence tampering', () => {
    const { registry, store } = fixture();
    const created = tissuePracticeDefinition.createAttempt(
      { ...tissuePracticeDefinition.defaultRequest(), seed: 'tissue-tamper' },
      store,
      registry,
    );
    if (!created.ok) throw new Error('Tissue attempt should build.');
    expect(validateTissueCuratedAttempt({
      ...created.value,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);

    const version = structuredClone(created.value);
    version.questionVersions[version.orderedQuestionIds[0]] += 1;
    expect(validateTissueCuratedAttempt(version, registry).ok).toBe(false);

    const profile = structuredClone(created.value);
    profile.practiceSelection!.profileId = 'quick';
    expect(validateTissueCuratedAttempt(profile, registry).ok).toBe(false);

    const evidence = structuredClone(created.value);
    evidence.practiceSelection!.strategyEligibleQuestionIds = [
      evidence.orderedQuestionIds[0],
    ];
    expect(validateTissueCuratedAttempt(evidence, registry).ok).toBe(false);
  });

  it('supports generic Custom and Targeted practice without weakening filters', () => {
    const { registry, store } = fixture();
    const custom = tissuePracticeDefinition.createAttempt({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['tissue-nervous'],
      formats: ['single_best_answer'],
      difficulties: ['foundation'],
      seed: 'tissue-custom',
    }, store, registry);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.value.orderedQuestionIds).toHaveLength(5);
      expect(validateTissueCuratedAttempt(custom.value, registry).ok).toBe(true);
    }
    const targeted = tissuePracticeDefinition.createAttempt({
      profileId: 'targeted',
      strategy: 'unseen',
      requestedCount: 10,
      seed: 'tissue-targeted',
    }, store, registry);
    expect(targeted.ok).toBe(true);
    if (targeted.ok) {
      expect(targeted.value.orderedQuestionIds).toHaveLength(10);
      expect(validateTissueCuratedAttempt(
        targeted.value,
        registry,
      ).ok).toBe(true);
    }
  });

  it.each([0, 1, 2])(
    'keeps Written practice manual-only with %i supplied responses',
    (responseCount) => {
      const { registry, store } = fixture();
      const created = tissuePracticeDefinition.createAttempt({
        profileId: 'written',
        requestedCount: 2,
        seed: `tissue-written-${responseCount}`,
      }, store, registry);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.blueprintId).toBe(TISSUE_WRITTEN_BLUEPRINT_ID);
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
        idFactory: () => `result-tissue-written-${responseCount}`,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) return;
      expect(finalized.value.result.score).toBeNull();
      expect(finalized.value.result.maxScore).toBeNull();
      expect(finalized.value.report.manualRequiredCount).toBe(responseCount);
      expect(validateTissueCuratedResult(
        finalized.value.result,
        registry,
      ).ok).toBe(true);
    },
  );
});
