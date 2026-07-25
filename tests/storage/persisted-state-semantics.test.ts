import { describe, expect, it } from 'vitest';
import {
  assessmentAttemptSnapshotSchema,
  assessmentResultSnapshotSchema,
  persistedResponseSchema,
  questionHistoryRecordSchema,
} from '@/lib/storage/schemas';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

function validAttempt(): AssessmentAttemptSnapshot {
  return {
    id: 'attempt-one',
    mode: 'study' as const,
    courseId: 'neuro-anatomy',
    moduleId: 'aqueous-vitreous',
    startedAt: '2026-07-25T10:00:00.000Z',
    orderedQuestionIds: ['question-one', 'question-two'],
    questionVersions: { 'question-one': 1, 'question-two': 2 },
    optionOrder: { 'question-one': ['option-a', 'option-b'] },
    responses: {
      'question-one': {
        format: 'single_best_answer' as const,
        optionId: 'option-a',
      },
    },
    flags: ['question-two'],
    currentIndex: 1,
  };
}

function validResult(): AssessmentResultSnapshot {
  const attempt = validAttempt();
  return {
    id: 'result-one',
    attemptId: attempt.id,
    courseId: attempt.courseId,
    moduleId: attempt.moduleId,
    submittedAt: '2026-07-25T10:30:00.000Z',
    orderedQuestionIds: attempt.orderedQuestionIds,
    questionVersions: attempt.questionVersions,
    responses: attempt.responses,
    score: 1,
    maxScore: 2,
  };
}

describe('assessment attempt persistence semantics', () => {
  it('accepts a complete internally consistent attempt', () => {
    expect(assessmentAttemptSnapshotSchema.safeParse(validAttempt()).success).toBe(true);
  });

  it.each([
    ['empty order', (value: ReturnType<typeof validAttempt>) => { value.orderedQuestionIds = []; }],
    ['duplicate order', (value: ReturnType<typeof validAttempt>) => {
      value.orderedQuestionIds = ['question-one', 'question-one'];
    }],
    ['out-of-range index', (value: ReturnType<typeof validAttempt>) => { value.currentIndex = 2; }],
    ['missing version', (value: ReturnType<typeof validAttempt>) => {
      delete value.questionVersions['question-two'];
    }],
    ['extra version', (value: ReturnType<typeof validAttempt>) => {
      value.questionVersions['question-three'] = 1;
    }],
    ['response outside attempt', (value: ReturnType<typeof validAttempt>) => {
      value.responses['question-three'] = {
        format: 'single_best_answer',
        optionId: 'option-a',
      };
    }],
    ['flag outside attempt', (value: ReturnType<typeof validAttempt>) => {
      value.flags = ['question-three'];
    }],
    ['duplicate flags', (value: ReturnType<typeof validAttempt>) => {
      value.flags = ['question-two', 'question-two'];
    }],
    ['option order outside attempt', (value: ReturnType<typeof validAttempt>) => {
      value.optionOrder['question-three'] = ['option-a'];
    }],
    ['invalid timestamp', (value: ReturnType<typeof validAttempt>) => {
      value.startedAt = 'yesterday';
    }],
    ['unstable question ID', (value: ReturnType<typeof validAttempt>) => {
      value.orderedQuestionIds = ['Question One', 'question-two'];
    }],
    ['unstable option ID', (value: ReturnType<typeof validAttempt>) => {
      value.responses['question-one'] = {
        format: 'single_best_answer',
        optionId: 'Option A',
      };
    }],
  ])('rejects %s', (_name, mutate) => {
    const attempt = validAttempt();
    mutate(attempt);
    expect(assessmentAttemptSnapshotSchema.safeParse(attempt).success).toBe(false);
  });
});

describe('assessment result persistence semantics', () => {
  it('accepts a complete internally consistent result', () => {
    expect(assessmentResultSnapshotSchema.safeParse(validResult()).success).toBe(true);
  });

  it.each([
    ['empty order', (value: ReturnType<typeof validResult>) => { value.orderedQuestionIds = []; }],
    ['duplicate order', (value: ReturnType<typeof validResult>) => {
      value.orderedQuestionIds = ['question-one', 'question-one'];
    }],
    ['missing version', (value: ReturnType<typeof validResult>) => {
      delete value.questionVersions['question-two'];
    }],
    ['extra version', (value: ReturnType<typeof validResult>) => {
      value.questionVersions['question-three'] = 1;
    }],
    ['response outside result', (value: ReturnType<typeof validResult>) => {
      value.responses['question-three'] = {
        format: 'single_best_answer',
        optionId: 'option-a',
      };
    }],
    ['invalid timestamp', (value: ReturnType<typeof validResult>) => {
      value.submittedAt = 'today';
    }],
    ['score above maximum', (value: ReturnType<typeof validResult>) => {
      value.score = 3;
      value.maxScore = 2;
    }],
  ])('rejects %s', (_name, mutate) => {
    const result = validResult();
    mutate(result);
    expect(assessmentResultSnapshotSchema.safeParse(result).success).toBe(false);
  });
});

describe('assessment history and response persistence semantics', () => {
  it('accepts valid history and nullable ungraded scores', () => {
    expect(questionHistoryRecordSchema.safeParse({
      questionId: 'question-one',
      version: 1,
      attemptCount: 3,
      correctCount: 2,
      lastAnsweredAt: '2026-07-25T10:30:00.000Z',
    }).success).toBe(true);
    expect(assessmentResultSnapshotSchema.safeParse({
      ...validResult(),
      score: null,
      maxScore: null,
    }).success).toBe(true);
  });

  it('rejects impossible history counts and invalid history timestamps', () => {
    expect(questionHistoryRecordSchema.safeParse({
      questionId: 'question-one',
      version: 1,
      attemptCount: 1,
      correctCount: 2,
    }).success).toBe(false);
    expect(questionHistoryRecordSchema.safeParse({
      questionId: 'question-one',
      version: 1,
      attemptCount: 1,
      correctCount: 1,
      lastAnsweredAt: 'not-iso',
    }).success).toBe(false);
  });

  it.each([
    { format: 'multiple_response', optionIds: ['option-a', 'option-a'] },
    { format: 'ordering', itemIds: ['item-a', 'item-a'] },
    { format: 'image_hotspot', regionIds: ['region-a', 'region-a'] },
  ])('rejects duplicate identifiers in $format responses', (response) => {
    expect(persistedResponseSchema.safeParse(response).success).toBe(false);
  });

  it.each([
    { format: 'ordering', itemIds: ['Item A'] },
    { format: 'matching', matches: { 'Prompt A': 'choice-a' } },
    { format: 'image_hotspot', regionIds: ['Region A'] },
  ])('rejects unstable identifiers in $format responses', (response) => {
    expect(persistedResponseSchema.safeParse(response).success).toBe(false);
  });
});
