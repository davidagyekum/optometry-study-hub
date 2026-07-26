import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  assessmentResultSnapshotSchema,
  type AssessmentResultSnapshot,
} from '@/lib/storage/schemas';
import { correctResponseFor } from '@/tests/fixtures/grading';
import {
  makeAttempt,
  makeDraftRegistry,
  makeResult,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function completeResult(): AssessmentResultSnapshot {
  const question = questionByFormat('single_best_answer');
  const attempt = makeAttempt([question.id], { mode: 'exam' });
  attempt.responses[question.id] = correctResponseFor(question);
  const finalized = finalizeGradedAssessmentAttempt({
    attempt,
    registry: makeDraftRegistry(),
    now: () => new Date('2026-07-26T12:00:00.000Z'),
    idFactory: () => 'result-schema-complete',
  });
  if (!finalized.ok) throw new Error('Complete fixture should finalize');
  return finalized.value.result;
}

function manualResult(): AssessmentResultSnapshot {
  const question = questionByFormat('open_response');
  const attempt = makeAttempt([question.id]);
  attempt.responses[question.id] = correctResponseFor(question);
  const finalized = finalizeGradedAssessmentAttempt({
    attempt,
    registry: makeDraftRegistry(),
    now: () => new Date('2026-07-26T12:00:00.000Z'),
    idFactory: () => 'result-schema-manual',
  });
  if (!finalized.ok) throw new Error('Manual fixture should finalize');
  return finalized.value.result;
}

function rejects(mutate: (result: AssessmentResultSnapshot) => void): void {
  const result = completeResult();
  mutate(result);
  expect(assessmentResultSnapshotSchema.safeParse(result).success).toBe(false);
}

describe('grading persistence schema', () => {
  it('keeps historical results without policy or grading valid', () => {
    const historical = makeResult();
    delete historical.gradingPolicy;
    delete historical.grading;
    expect(assessmentResultSnapshotSchema.safeParse(historical).success).toBe(true);
  });

  it('accepts complete and manual-required grading snapshots', () => {
    expect(assessmentResultSnapshotSchema.safeParse(completeResult()).success).toBe(true);
    expect(assessmentResultSnapshotSchema.safeParse(manualResult()).success).toBe(true);
  });

  it('rejects mismatched grading policy', () => {
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      result.grading.policy = { id: 'diagnostic', version: 1 };
    });
  });

  it('rejects missing and extra question-grade keys', () => {
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      delete result.grading.questionGrades[result.orderedQuestionIds[0]];
    });
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      result.grading.questionGrades['extra-question'] = {
        questionId: 'extra-question',
        questionVersion: 1,
        format: 'single_best_answer',
        status: 'unanswered',
        score: 0,
        maxScore: 1,
      };
    });
  });

  it('rejects question-version and grade-key identity mismatches', () => {
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      result.grading.questionGrades[result.orderedQuestionIds[0]].questionVersion += 1;
    });
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      result.grading.questionGrades[result.orderedQuestionIds[0]].questionId = 'wrong-id';
    });
  });

  it('rejects invalid status/score relations, totals, counts, and nonfinite values', () => {
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      const grade = result.grading.questionGrades[result.orderedQuestionIds[0]];
      grade.status = 'incorrect';
      grade.score = 1;
    });
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      result.grading.autoScore = 0;
    });
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      result.grading.correctCount = 0;
    });
    rejects((result) => {
      if (!result.grading) throw new Error('Expected grading');
      result.grading.autoScore = Number.POSITIVE_INFINITY;
    });
  });

  it('rejects complete and manual top-level score disagreement', () => {
    rejects((result) => {
      result.score = 0;
    });
    const manual = manualResult();
    manual.score = 0;
    manual.maxScore = 1;
    expect(assessmentResultSnapshotSchema.safeParse(manual).success).toBe(false);
  });
});
