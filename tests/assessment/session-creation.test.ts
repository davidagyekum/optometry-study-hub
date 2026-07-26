import { describe, expect, it } from 'vitest';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { authoredPresentationIds } from '@/lib/assessment/session/ordering';
import { assessmentAttemptSnapshotSchema } from '@/lib/storage/schemas';
import {
  FIXED_NOW,
  PILOT_COURSE_ID,
  PILOT_MODULE_ID,
  fixedRandom,
  makeDraftRegistry,
} from '@/tests/fixtures/session-engine';

function create(questionIds: string[], overrides = {}) {
  return createAssessmentAttempt({
    registry: makeDraftRegistry(),
    questionIds,
    mode: 'study',
    courseId: PILOT_COURSE_ID,
    moduleId: PILOT_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    random: fixedRandom(),
    now: () => FIXED_NOW,
    idFactory: () => 'attempt-session-test',
    ...overrides,
  });
}

function errorCodes(result: ReturnType<typeof create>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('assessment session creation', () => {
  it.each([1, 3, 9])('creates a valid arbitrary-length %i-question session', (length) => {
    const ids = makeDraftRegistry().questionIds().slice(0, length);
    const result = create(ids);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.orderedQuestionIds).toHaveLength(length);
    expect(new Set(result.value.orderedQuestionIds)).toEqual(new Set(ids));
    expect(result.value.id).toBe('attempt-session-test');
    expect(result.value.startedAt).toBe('2026-07-26T09:00:00.000Z');
    expect(result.value.currentIndex).toBe(0);
    expect(result.value.responses).toEqual({});
    expect(result.value.flags).toEqual([]);
    expect(assessmentAttemptSnapshotSchema.safeParse(result.value).success).toBe(true);
  });

  it('creates repeatable question and option order from repeatable randomness', () => {
    const ids = makeDraftRegistry().questionIds();
    const first = create(ids);
    const second = create(ids);
    if (!first.ok || !second.ok) throw new Error('Creation should succeed');

    expect(second.value.orderedQuestionIds).toEqual(first.value.orderedQuestionIds);
    expect(second.value.optionOrder).toEqual(first.value.optionOrder);
  });

  it('records exact current question versions and only shuffleable presentation orders', () => {
    const registry = makeDraftRegistry();
    const result = create(registry.questionIds());
    if (!result.ok) throw new Error('Creation should succeed');

    expect(Object.keys(result.value.questionVersions).sort())
      .toEqual([...result.value.orderedQuestionIds].sort());
    result.value.orderedQuestionIds.forEach((questionId) => {
      const question = registry.get(questionId);
      if (!question) throw new Error('Question should resolve');
      expect(result.value.questionVersions[questionId]).toBe(question.version);
      const authored = authoredPresentationIds(question);
      if (authored) {
        expect(new Set(result.value.optionOrder[questionId])).toEqual(new Set(authored));
      } else {
        expect(result.value.optionOrder[questionId]).toBeUndefined();
      }
    });
    expect(Object.keys(result.value.optionOrder)).toHaveLength(6);
  });

  it('rejects duplicate, unknown, wrong-course, wrong-module, and ineligible questions', () => {
    const registry = makeDraftRegistry();
    const id = registry.questionIds()[0];

    expect(errorCodes(create([id, id]))).toContain('DUPLICATE_SESSION_QUESTION');
    expect(errorCodes(create(['missing-question']))).toContain('QUESTION_NOT_FOUND');
    expect(errorCodes(create([id], { courseId: 'wrong-course' })))
      .toContain('QUESTION_COURSE_MISMATCH');
    expect(errorCodes(create([id], { moduleId: 'wrong-module' })))
      .toContain('QUESTION_MODULE_MISMATCH');

    const ineligible = createAssessmentAttempt({
      registry,
      questionIds: [id],
      mode: 'study',
      courseId: PILOT_COURSE_ID,
      moduleId: PILOT_MODULE_ID,
      random: fixedRandom(),
      now: () => FIXED_NOW,
      idFactory: () => 'attempt-ineligible',
    });
    expect(errorCodes(ineligible)).toContain('QUESTION_NOT_ELIGIBLE');
  });

  it('rejects empty sessions, unstable IDs, invalid clocks, and invalid randomness', () => {
    expect(errorCodes(create([]))).toContain('EMPTY_SESSION');
    expect(errorCodes(create([makeDraftRegistry().questionIds()[0]], {
      idFactory: () => 'Invalid Attempt ID',
    }))).toContain('INVALID_ATTEMPT_ID');
    expect(errorCodes(create([makeDraftRegistry().questionIds()[0]], {
      now: () => new Date('invalid'),
    }))).toContain('INVALID_TIMESTAMP');
    expect(errorCodes(create(makeDraftRegistry().questionIds().slice(0, 2), {
      random: () => 1,
    }))).toContain('INVALID_RANDOM_VALUE');
  });
});
