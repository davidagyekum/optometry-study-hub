import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { putActiveAssessmentAttempt, finalizeAssessmentStore } from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { makeAttempt, makeDraftRegistry, questionByFormat } from '@/tests/fixtures/session-engine';
import { correctResponseFor } from '@/tests/fixtures/grading';

function fixture() {
  const registry = makeDraftRegistry();
  const question = questionByFormat('single_best_answer');
  const selection = {
    schemaVersion: 1 as const,
    blueprintId: 'review-scored-blueprint',
    practiceFamilyId: 'review-family',
    profileId: 'quick',
    strategy: 'mixed' as const,
    requestedCount: 1,
    sectionIds: [question.sectionId],
    formats: ['single_best_answer' as const],
    difficulties: [question.difficulty],
    seed: 'atomic-review',
    resultMode: 'automatic' as const,
    historyPolicy: 'scored' as const,
  };
  const attempt = makeAttempt([question.id], {
    registry,
    blueprintId: selection.blueprintId,
    practiceSelection: selection,
    gradingPolicy: { id: 'diagnostic', version: 1 },
    idFactory: () => 'attempt-atomic-review',
  });
  attempt.responses[question.id] = correctResponseFor(question);
  const finalized = finalizeGradedAssessmentAttempt({
    attempt,
    registry,
    idFactory: () => 'result-atomic-review',
  });
  if (!finalized.ok) throw new Error('finalize');
  const inserted = putActiveAssessmentAttempt(createEmptyStoreV2(), attempt.id, attempt);
  if (!inserted.ok) throw new Error('insert');
  return { registry, attempt, result: finalized.value.result, store: inserted.value };
}

describe('atomic finalization integrity review', () => {
  it.each([
    ['blueprint mismatch', (result: ReturnType<typeof fixture>['result']) => ({ ...result, blueprintId: 'other-blueprint' })],
    ['malformed grading', (result: ReturnType<typeof fixture>['result']) => ({
      ...result,
      grading: {
        ...result.grading!,
        questionGrades: {
          ...result.grading!.questionGrades,
          [result.orderedQuestionIds[0]]: {
            ...result.grading!.questionGrades[result.orderedQuestionIds[0]],
            status: 'incorrect' as const,
          },
        },
      },
    })],
  ])('rolls back on %s', (_label, mutate) => {
    const current = fixture();
    const before = structuredClone(current.store);
    const failed = finalizeAssessmentStore(
      current.store,
      current.attempt.id,
      current.result.id,
      mutate(current.result),
      { historyPolicy: 'scored', registry: current.registry },
    );
    expect(failed.ok).toBe(false);
    expect(current.store).toEqual(before);
    expect(current.store.assessment.activeAttempts[current.attempt.id]).toBeDefined();
    expect(current.store.assessment.results[current.result.id]).toBeUndefined();
    expect(current.store.assessment.questionHistory).toEqual({});
  });

  it('rolls back when the supplied history policy does not match the active blueprint', () => {
    const current = fixture();
    const before = structuredClone(current.store);
    const failed = finalizeAssessmentStore(
      current.store,
      current.attempt.id,
      current.result.id,
      current.result,
      { historyPolicy: 'encounter-and-manual', registry: current.registry },
    );
    expect(failed.ok).toBe(false);
    expect(failed.ok ? [] : failed.issues.map((issue) => issue.code)).toContain('PRACTICE_HISTORY_POLICY_MISMATCH');
    expect(current.store).toEqual(before);
  });
});
