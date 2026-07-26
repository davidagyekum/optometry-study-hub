import type { QuestionGradeOutcome } from '@/lib/assessment/grading/types';

export function roundGradingScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

export function questionGradeContribution(
  grade: Pick<
    QuestionGradeOutcome,
    'status' | 'score' | 'correctParts' | 'totalParts'
  >,
): number | null {
  if (grade.score === null) return null;
  if (
    grade.status === 'partial'
    && grade.correctParts !== undefined
    && grade.totalParts !== undefined
  ) {
    return grade.correctParts / grade.totalParts;
  }
  return grade.score;
}
