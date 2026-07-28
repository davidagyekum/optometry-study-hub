import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { nextHistoryRecord } from '@/lib/assessment/practice/history';
import { putActiveAssessmentAttempt, finalizeAssessmentStore } from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type {
  AssessmentResultSnapshot,
  QuestionHistoryRecord,
} from '@/lib/storage/schemas';
import {
  makeAttempt,
  makeDraftRegistry,
  questionByFormat,
} from '@/tests/fixtures/session-engine';
import { correctResponseFor, incorrectResponseFor } from '@/tests/fixtures/grading';

function storedAttempt(questionId: string, response?: ReturnType<typeof correctResponseFor>) {
  const registry = makeDraftRegistry();
  const attempt = makeAttempt([questionId], {
    registry,
    gradingPolicy: { id: 'diagnostic', version: 1 },
    idFactory: () => `attempt-history-${questionId}`,
  });
  if (response) attempt.responses[questionId] = response;
  const finalized = finalizeGradedAssessmentAttempt({
    attempt,
    registry,
    now: () => new Date('2026-07-27T12:00:00.000Z'),
    idFactory: () => `result-history-${questionId}`,
  });
  if (!finalized.ok) throw new Error(finalized.issues.map((issue) => issue.code).join(','));
  const inserted = putActiveAssessmentAttempt(createEmptyStoreV2(), attempt.id, attempt);
  if (!inserted.ok) throw new Error(inserted.issues.map((issue) => issue.code).join(','));
  return { store: inserted.value, attempt, result: finalized.value.result, registry };
}

function finalize(questionId: string, response?: ReturnType<typeof correctResponseFor>) {
  const fixture = storedAttempt(questionId, response);
  return finalizeAssessmentStore(
    fixture.store,
    fixture.attempt.id,
    fixture.result.id,
    fixture.result,
    { historyPolicy: 'scored', registry: fixture.registry },
  );
}

describe('atomic assessment question history', () => {
  it('records correct, incorrect, unanswered, partial, and manual-required outcomes', () => {
    const sba = questionByFormat('single_best_answer');
    const correct = finalize(sba.id, correctResponseFor(sba));
    const incorrect = finalize(sba.id, incorrectResponseFor(sba));
    const unanswered = finalize(sba.id);
    expect(correct.ok && correct.value.assessment.questionHistory[sba.id]).toMatchObject({
      encounterCount: 1,
      attemptCount: 1,
      correctCount: 1,
      lastStatus: 'correct',
    });
    expect(incorrect.ok && incorrect.value.assessment.questionHistory[sba.id]).toMatchObject({
      encounterCount: 1,
      attemptCount: 1,
      incorrectCount: 1,
      lastStatus: 'incorrect',
    });
    expect(unanswered.ok && unanswered.value.assessment.questionHistory[sba.id]).toMatchObject({
      encounterCount: 1,
      attemptCount: 0,
      unansweredCount: 1,
      lastStatus: 'unanswered',
    });

    const matching = questionByFormat('matching');
    const entries = Object.entries(matching.correctMatches);
    const partialResponse = {
      format: 'matching' as const,
      matches: {
        ...matching.correctMatches,
        [entries[0][0]]: entries[1][1],
        [entries[1][0]]: entries[0][1],
      },
    };
    const partial = finalize(matching.id, partialResponse);
    expect(partial.ok && partial.value.assessment.questionHistory[matching.id]).toMatchObject({
      partialCount: 1,
      lastStatus: 'partial',
    });

    const open = questionByFormat('open_response');
    const fixture = storedAttempt(open.id, correctResponseFor(open));
    const manual = finalizeAssessmentStore(
      fixture.store,
      fixture.attempt.id,
      fixture.result.id,
      fixture.result,
      { historyPolicy: 'encounter-and-manual', registry: fixture.registry },
    );
    expect(manual.ok && manual.value.assessment.questionHistory[open.id]).toMatchObject({
      encounterCount: 1,
      attemptCount: 0,
      responseCount: 1,
      correctCount: 0,
      manualRequiredCount: 1,
      lastStatus: 'manual_required',
    });

    const priorAutomaticMastery: QuestionHistoryRecord = {
      questionId: open.id,
      version: fixture.result.questionVersions[open.id],
      attemptCount: 4,
      correctCount: 3,
      partialCount: 0,
      incorrectCount: 1,
      encounterCount: 4,
    };
    expect(nextHistoryRecord(
      priorAutomaticMastery,
      fixture.result,
      open.id,
      'encounter-and-manual',
    )).toMatchObject({
      encounterCount: 5,
      responseCount: 1,
      attemptCount: 4,
      correctCount: 3,
      partialCount: 0,
      incorrectCount: 1,
      manualRequiredCount: 1,
    });
  });

  it('preserves old compatible counters and replaces mastery on a newer version', () => {
    const question = questionByFormat('single_best_answer');
    const fixture = storedAttempt(question.id, correctResponseFor(question));
    fixture.store.assessment.questionHistory[question.id] = {
      questionId: question.id,
      version: 1,
      attemptCount: 4,
      correctCount: 2,
      lastAnsweredAt: '2026-07-20T12:00:00.000Z',
    };
    const updated = finalizeAssessmentStore(
      fixture.store,
      fixture.attempt.id,
      fixture.result.id,
      fixture.result,
      { historyPolicy: 'scored', registry: fixture.registry },
    );
    expect(updated.ok && updated.value.assessment.questionHistory[question.id]).toMatchObject({
      attemptCount: 5,
      correctCount: 3,
      encounterCount: 1,
    });

    const old: QuestionHistoryRecord = {
      questionId: question.id,
      version: 1,
      attemptCount: 9,
      correctCount: 8,
    };
    const versionTwo = {
      ...fixture.result,
      questionVersions: { [question.id]: 2 },
      grading: {
        ...fixture.result.grading!,
        questionGrades: {
          [question.id]: {
            ...fixture.result.grading!.questionGrades[question.id],
            questionVersion: 2,
          },
        },
      },
    } satisfies AssessmentResultSnapshot;
    expect(nextHistoryRecord(old, versionTwo, question.id, 'scored')).toMatchObject({
      version: 2,
      attemptCount: 1,
      correctCount: 1,
      encounterCount: 1,
    });
  });

  it('rejects version downgrades and rolls the whole transaction back on failure', () => {
    const question = questionByFormat('single_best_answer');
    const fixture = storedAttempt(question.id, correctResponseFor(question));
    const newer: QuestionHistoryRecord = {
      questionId: question.id,
      version: 2,
      attemptCount: 1,
      correctCount: 1,
    };
    fixture.store.assessment.questionHistory[question.id] = newer;
    const before = structuredClone(fixture.store);
    const failed = finalizeAssessmentStore(
      fixture.store,
      fixture.attempt.id,
      fixture.result.id,
      fixture.result,
      { historyPolicy: 'scored', registry: fixture.registry },
    );
    expect(failed.ok).toBe(false);
    expect(fixture.store).toEqual(before);
    expect(fixture.store.assessment.activeAttempts[fixture.attempt.id]).toBeDefined();
    expect(fixture.store.assessment.results[fixture.result.id]).toBeUndefined();
  });

  it('prevents collision and repeated-finalization double counting', () => {
    const question = questionByFormat('single_best_answer');
    const fixture = storedAttempt(question.id, correctResponseFor(question));
    fixture.store.assessment.results[fixture.result.id] = structuredClone(fixture.result);
    const collision = finalizeAssessmentStore(
      fixture.store,
      fixture.attempt.id,
      fixture.result.id,
      fixture.result,
      { historyPolicy: 'scored', registry: fixture.registry },
    );
    expect(collision.ok).toBe(false);
    expect(fixture.store.assessment.questionHistory).toEqual({});

    delete fixture.store.assessment.results[fixture.result.id];
    const first = finalizeAssessmentStore(
      fixture.store,
      fixture.attempt.id,
      fixture.result.id,
      fixture.result,
      { historyPolicy: 'scored', registry: fixture.registry },
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const repeated = finalizeAssessmentStore(
      first.value,
      fixture.attempt.id,
      fixture.result.id,
      fixture.result,
      { historyPolicy: 'scored', registry: fixture.registry },
    );
    expect(repeated.ok).toBe(false);
    expect(first.value.assessment.questionHistory[question.id].encounterCount).toBe(1);
  });
});
