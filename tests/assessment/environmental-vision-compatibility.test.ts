import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  validateEnvironmentalVisionCuratedAttempt,
  validateEnvironmentalVisionCuratedResult,
} from '@/lib/assessment/environmental-vision/compatibility';
import {
  ENVIRONMENTAL_VISION_BLUEPRINT_ID,
  ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/environmental-vision/config';
import { environmentalVisionPracticeDefinition } from '@/lib/assessment/environmental-vision/definition';
import { buildDraftOnlyEnvironmentalVisionRegistry } from '@/lib/assessment/environmental-vision/registry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

function fixture() {
  const built = buildDraftOnlyEnvironmentalVisionRegistry();
  if (!built.ok) throw new Error('Environmental Vision registry should build.');
  return { registry: built.value, store: createEmptyStoreV2() };
}

describe('Environmental Vision curated compatibility', () => {
  it('creates and verifies exact Full attempts and deterministic results', () => {
    const { registry, store } = fixture();
    const created = environmentalVisionPracticeDefinition.createAttempt(
      { ...environmentalVisionPracticeDefinition.defaultRequest(), seed: 'environmental-vision-full' },
      store,
      registry,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.blueprintId).toBe(ENVIRONMENTAL_VISION_BLUEPRINT_ID);
    expect(created.value.orderedQuestionIds).toHaveLength(50);
    expect(validateEnvironmentalVisionCuratedAttempt(created.value, registry).ok).toBe(true);

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-30T10:30:00.000Z'),
      idFactory: () => 'result-environmental-vision-full',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(validateEnvironmentalVisionCuratedResult(
      finalized.value.result,
      registry,
    ).ok).toBe(true);
  });

  it('fails closed on blueprint, version, profile and evidence tampering', () => {
    const { registry, store } = fixture();
    const created = environmentalVisionPracticeDefinition.createAttempt(
      { ...environmentalVisionPracticeDefinition.defaultRequest(), seed: 'environmental-vision-tamper' },
      store,
      registry,
    );
    if (!created.ok) throw new Error('Environmental Vision attempt should build.');
    expect(validateEnvironmentalVisionCuratedAttempt({
      ...created.value,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);

    const version = structuredClone(created.value);
    version.questionVersions[version.orderedQuestionIds[0]] += 1;
    expect(validateEnvironmentalVisionCuratedAttempt(version, registry).ok).toBe(false);

    const profile = structuredClone(created.value);
    profile.practiceSelection!.profileId = 'quick';
    expect(validateEnvironmentalVisionCuratedAttempt(profile, registry).ok).toBe(false);

    const evidence = structuredClone(created.value);
    evidence.practiceSelection!.strategyEligibleQuestionIds = [
      evidence.orderedQuestionIds[0],
    ];
    expect(validateEnvironmentalVisionCuratedAttempt(evidence, registry).ok).toBe(false);
  });

  it('supports generic Custom and Targeted practice without weakening filters', () => {
    const { registry, store } = fixture();
    const custom = environmentalVisionPracticeDefinition.createAttempt({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['env-optics'],
      formats: ['single_best_answer'],
      difficulties: ['foundation', 'intermediate'],
      seed: 'environmental-vision-custom',
    }, store, registry);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.value.orderedQuestionIds).toHaveLength(5);
      expect(validateEnvironmentalVisionCuratedAttempt(custom.value, registry).ok).toBe(true);
    }
    const targeted = environmentalVisionPracticeDefinition.createAttempt({
      profileId: 'targeted',
      strategy: 'unseen',
      requestedCount: 10,
      seed: 'environmental-vision-targeted',
    }, store, registry);
    expect(targeted.ok).toBe(true);
    if (targeted.ok) {
      expect(targeted.value.orderedQuestionIds).toHaveLength(10);
      expect(validateEnvironmentalVisionCuratedAttempt(
        targeted.value,
        registry,
      ).ok).toBe(true);
    }
  });

  it.each([0, 1, 2])(
    'keeps Written practice manual-only with %i supplied responses',
    (responseCount) => {
      const { registry, store } = fixture();
      const created = environmentalVisionPracticeDefinition.createAttempt({
        profileId: 'written',
        requestedCount: 2,
        seed: `environmental-vision-written-${responseCount}`,
      }, store, registry);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.blueprintId).toBe(ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID);
      expect(new Set(created.value.orderedQuestionIds)).toEqual(new Set([
        'env-ergonomics-workstation-evaluation-open-001',
        'env-lighting-workplace-audit-open-001',
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
        idFactory: () => `result-environmental-vision-written-${responseCount}`,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) return;
      expect(finalized.value.result.score).toBeNull();
      expect(finalized.value.result.maxScore).toBeNull();
      expect(finalized.value.report.manualRequiredCount).toBe(responseCount);
      expect(validateEnvironmentalVisionCuratedResult(
        finalized.value.result,
        registry,
      ).ok).toBe(true);
    },
  );
});
