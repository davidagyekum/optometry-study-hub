import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { HVP_SECTION_FORMAT_ALLOCATION } from '@/lib/assessment/hvp/assembler';
import {
  createHvpPracticeSelection,
  hvpCuratedPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import type { QuestionHistoryRecord } from '@/lib/storage/schemas';

const HIGHER_ORDER = new Set(['apply', 'analyze', 'evaluate', 'create']);
const automatic = humanVisualPerceptionCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

function historyRecord(question: AssessmentQuestion): QuestionHistoryRecord {
  return {
    questionId: question.id,
    version: question.version,
    attemptCount: 1,
    correctCount: 1,
    encounterCount: 1,
    lastStatus: 'correct',
  };
}

describe('fixed-profile hard-constraint-first selection', () => {
  it('uses seen higher-order questions when unseen lower-order questions cannot satisfy Bloom', () => {
    const source = automatic.find(
      (question) => question.format === 'single_best_answer',
    )!;
    const sectionId = source.sectionId;
    const questions = Array.from({ length: 6 }, (_, index) => ({
      ...structuredClone(source),
      id: `synthetic-hard-constraint-${index + 1}`,
      familyId: `synthetic-family-${index + 1}`,
      sectionId,
      difficulty: 'intermediate' as const,
      bloomLevel: index < 2 ? 'apply' as const : 'remember' as const,
    }));
    const blueprint = practiceBlueprintSchema.parse({
      schemaVersion: 1,
      id: 'synthetic-hard-constraint-blueprint',
      practiceFamilyId: 'synthetic-hard-constraint-family',
      courseId: source.courseId,
      moduleId: source.moduleId,
      allowedReviewStatuses: ['draft'],
      defaultMode: 'study',
      gradingPolicy: { id: 'diagnostic', version: 1 },
      eligibleFormats: ['single_best_answer'],
      resultMode: 'automatic',
      sectionIds: [sectionId],
      profiles: [{
        id: 'fixed',
        label: 'Fixed',
        count: 4,
        sectionTargets: { [sectionId]: 4 },
        formatTargets: { single_best_answer: 4 },
        difficultyTargets: { intermediate: 4 },
        higherOrderMinimum: 2,
      }],
      maximumFamilyRepetition: 1,
      historyPolicy: 'scored',
    });
    const selection = {
      schemaVersion: 1 as const,
      blueprintId: blueprint.id,
      practiceFamilyId: blueprint.practiceFamilyId,
      profileId: 'fixed',
      strategy: 'mixed' as const,
      requestedCount: 4,
      sectionIds: [sectionId],
      formats: ['single_best_answer' as const],
      difficulties: ['intermediate' as const],
      seed: 'seen-higher-order-required',
      resultMode: 'automatic' as const,
      historyPolicy: 'scored' as const,
    };
    const history = Object.fromEntries(
      questions.slice(0, 2).map((question) => [question.id, historyRecord(question)]),
    );
    const assemble = () => assemblePractice({
      questions,
      blueprint,
      selection,
      history,
      sectionFormatAvailability: {
        [sectionId]: { single_best_answer: questions.length },
      },
    });
    const first = assemble();
    const repeated = assemble();
    expect(first.ok).toBe(true);
    expect(repeated.ok).toBe(true);
    if (!first.ok || !repeated.ok) return;
    expect(first.value.questionIds).toEqual(repeated.value.questionIds);
    expect(first.value.questionIds).toHaveLength(4);
    expect(first.value.sectionCounts).toEqual({ [sectionId]: 4 });
    expect(first.value.formatCounts).toEqual({ single_best_answer: 4 });
    expect(first.value.difficultyCounts).toEqual({ intermediate: 4 });
    expect(first.value.higherOrderCount).toBe(2);
    expect(first.value.questionIds.filter((id) => !history[id])).toHaveLength(2);
    const familyCounts = first.value.questions.reduce<Record<string, number>>(
      (counts, question) => ({
        ...counts,
        [question.familyId]: (counts[question.familyId] ?? 0) + 1,
      }),
      {},
    );
    expect(Math.max(...Object.values(familyCounts))).toBe(1);
  });

  it.each([
    ['quick', 10, 4, 0],
    ['standard', 25, 10, 1],
  ] as const)(
    'keeps the HVP %s profile satisfiable when every higher-order candidate is seen',
    (profileId, requestedCount, minimumHigherOrder, profileIndex) => {
      const selection = createHvpPracticeSelection({
        profileId,
        requestedCount,
        seed: `seen-higher-order-${profileId}`,
      });
      const history = Object.fromEntries(
        automatic
          .filter((question) => HIGHER_ORDER.has(question.bloomLevel))
          .map((question) => [question.id, historyRecord(question)]),
      );
      const assemble = () => assemblePractice({
        questions: automatic,
        blueprint: hvpCuratedPracticeBlueprint,
        selection,
        history,
        sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
      });
      const first = assemble();
      const repeated = assemble();
      expect(first.ok).toBe(true);
      expect(repeated.ok).toBe(true);
      if (!first.ok || !repeated.ok) return;
      expect(first.value.questionIds).toEqual(repeated.value.questionIds);
      expect(first.value.sectionCounts).toEqual(
        hvpCuratedPracticeBlueprint.profiles[profileIndex].sectionTargets,
      );
      expect(first.value.formatCounts).toEqual(Object.fromEntries(
        Object.entries(
          hvpCuratedPracticeBlueprint.profiles[profileIndex].formatTargets ?? {},
        ).filter(([, count]) => count > 0),
      ));
      expect(first.value.difficultyCounts).toEqual(
        hvpCuratedPracticeBlueprint.profiles[profileIndex].difficultyTargets,
      );
      expect(first.value.higherOrderCount).toBeGreaterThanOrEqual(minimumHigherOrder);
      expect(
        Math.max(...Object.values(first.value.questions.reduce<Record<string, number>>(
          (counts, question) => ({
            ...counts,
            [question.familyId]: (counts[question.familyId] ?? 0) + 1,
          }),
          {},
        ))),
      ).toBeLessThanOrEqual(2);
    },
  );
});
