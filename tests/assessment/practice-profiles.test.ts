import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  HVP_SECTION_FORMAT_ALLOCATION,
  assembleHvpCuratedPractice,
} from '@/lib/assessment/hvp/assembler';
import {
  createHvpPracticeSelection,
  HVP_AUTOMATIC_FORMATS,
  HVP_DIFFICULTIES,
  HVP_SECTIONS,
  hvpCuratedPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { assemblePractice } from '@/lib/assessment/practice/assembler';

const HIGHER = new Set(['apply', 'analyze', 'evaluate', 'create']);

describe('versioned HVP practice profiles', () => {
  it.each([
    ['quick', 10, 4],
    ['standard', 25, 10],
  ] as const)('assembles %s deterministically across 1,000 seeds', (profileId, count, minimumHigher) => {
    const profile = hvpCuratedPracticeBlueprint.profiles.find(
      (candidate) => candidate.id === profileId,
    )!;
    for (let seedIndex = 0; seedIndex < 1_000; seedIndex += 1) {
      const selection = createHvpPracticeSelection({
        profileId,
        requestedCount: count,
        sectionIds: HVP_SECTIONS,
        formats: HVP_AUTOMATIC_FORMATS,
        difficulties: HVP_DIFFICULTIES,
        seed: `${profileId}-${seedIndex}`,
      });
      const first = assemblePractice({
        questions: humanVisualPerceptionCandidateBank.questions,
        blueprint: hvpCuratedPracticeBlueprint,
        selection,
        sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
      });
      const repeated = assemblePractice({
        questions: humanVisualPerceptionCandidateBank.questions,
        blueprint: hvpCuratedPracticeBlueprint,
        selection,
        sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
      });
      expect(first.ok).toBe(true);
      expect(repeated.ok).toBe(true);
      if (!first.ok || !repeated.ok) continue;
      expect(first.value.questionIds).toEqual(repeated.value.questionIds);
      expect(first.value.questionIds).toHaveLength(count);
      expect(new Set(first.value.questionIds).size).toBe(count);
      expect(first.value.sectionCounts).toEqual(profile.sectionTargets);
      expect(first.value.formatCounts).toEqual(Object.fromEntries(Object.entries(profile.formatTargets ?? {}).filter(([, value]) => value > 0)));
      expect(first.value.difficultyCounts).toEqual(profile.difficultyTargets);
      expect(first.value.higherOrderCount).toBeGreaterThanOrEqual(minimumHigher);
      expect(first.value.usedRelaxation).toBe(false);
      const familyCounts = first.value.questions.reduce<Record<string, number>>(
        (counts, question) => ({
          ...counts,
          [question.familyId]: (counts[question.familyId] ?? 0) + 1,
        }),
        {},
      );
      expect(Math.max(...Object.values(familyCounts))).toBeLessThanOrEqual(2);
      expect(first.value.questions.some((question) => question.format === 'open_response')).toBe(false);
      expect(first.value.questions.filter((question) => HIGHER.has(question.bloomLevel)).length)
        .toBeGreaterThanOrEqual(minimumHigher);
    }
  }, 120_000);

  it('retains the exact no-relaxation Full 50 contract across 1,000 seeds', () => {
    for (let seed = 0; seed < 1_000; seed += 1) {
      const assembled = assembleHvpCuratedPractice({
        questions: humanVisualPerceptionCandidateBank.questions,
        seed,
        allowDifficultyRelaxation: false,
      });
      expect(assembled.ok).toBe(true);
      if (!assembled.ok) continue;
      expect(assembled.value.questionIds).toHaveLength(50);
      expect(new Set(assembled.value.questionIds).size).toBe(50);
      expect(assembled.value.usedDifficultyRelaxation).toBe(false);
      expect(assembled.value.higherOrderCount).toBeGreaterThanOrEqual(20);
    }
  }, 30_000);
});
