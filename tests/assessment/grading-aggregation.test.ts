import { describe, expect, it } from 'vitest';
import { aggregateQuestionGrades } from '@/lib/assessment/grading/gradeAssessment';
import { roundGradingScore } from '@/lib/assessment/grading/scoreContribution';
import {
  persistedGradingSnapshotSchema,
  questionGradeOutcomeSchema,
} from '@/lib/assessment/grading/schemas';
import type { QuestionGradeOutcome } from '@/lib/assessment/grading/types';

const diagnostic = { id: 'diagnostic', version: 1 };

function partialOutcome(
  questionId: string,
  correctParts: number,
  totalParts = 3,
): QuestionGradeOutcome {
  return {
    questionId,
    questionVersion: 1,
    format: 'matching',
    status: 'partial',
    score: roundGradingScore(correctParts / totalParts),
    maxScore: 1,
    correctParts,
    totalParts,
  };
}

describe('exact grading contributions', () => {
  it.each([
    [[1, 1, 1], 1],
    [[1, 2], 1],
    [[2, 2, 2], 2],
  ] as const)('aggregates component numerators %j before rounding', (parts, expected) => {
    const outcomes = parts.map((correctParts, index) => partialOutcome(
      `component-${index + 1}`,
      correctParts,
    ));
    const report = aggregateQuestionGrades(
      diagnostic,
      outcomes.map((outcome) => outcome.questionId),
      outcomes,
    );
    expect(report.ok && report.value.autoScore).toBe(expected);
    expect(report.ok && report.value.score).toBe(expected);
  });

  it('requires partial outcomes to contain a proper component fraction', () => {
    const missingParts = {
      ...partialOutcome('component-one', 1),
      correctParts: undefined,
      totalParts: undefined,
    };
    expect(questionGradeOutcomeSchema.safeParse(missingParts).success).toBe(false);
    expect(questionGradeOutcomeSchema.safeParse({
      ...partialOutcome('component-one', 1),
      correctParts: 0,
    }).success).toBe(false);
    expect(questionGradeOutcomeSchema.safeParse({
      ...partialOutcome('component-one', 1),
      correctParts: 3,
    }).success).toBe(false);
  });

  it('rejects persisted partial scores inconsistent with their components', () => {
    const grade = {
      ...partialOutcome('component-one', 1),
      score: 0.5,
    };
    expect(persistedGradingSnapshotSchema.safeParse({
      schemaVersion: 1,
      policy: diagnostic,
      status: 'complete',
      questionGrades: { [grade.questionId]: grade },
      score: 0.333333,
      maxScore: 1,
      autoScore: 0.333333,
      autoMaxScore: 1,
      correctCount: 0,
      partialCount: 1,
      incorrectCount: 0,
      unansweredCount: 0,
      manualRequiredCount: 0,
    }).success).toBe(false);
  });
});
