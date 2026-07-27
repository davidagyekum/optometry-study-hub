import { describe, expect, it } from 'vitest';
import { gradeResponseForQuestion } from '@/lib/assessment/grading/gradeQuestion';
import { assessmentQuestionSchema } from '@/lib/assessment/schemas';
import {
  completeResponseFromDraft,
  validateDraftResponseForQuestion,
} from '@/lib/assessment/session/draftResponses';
import { validateResponseForQuestion } from '@/lib/assessment/session/responseValidation';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import { questionByFormat } from '@/tests/fixtures/session-engine';

function trueFalseQuestion(): Extract<AssessmentQuestion, { format: 'true_false' }> {
  const source = questionByFormat('single_best_answer');
  const { options: _options, correctOptionId: _correctOptionId, ...base } = source;
  void _options;
  void _correctOptionId;
  return {
    ...base,
    id: 'isolated-true-false',
    familyId: 'isolated-true-false-family',
    format: 'true_false',
    stem: 'The physiological blind spot contains no photoreceptors.',
    correctAnswer: true,
  };
}

describe('dedicated True/False format', () => {
  it('parses without an authored options array', () => {
    const parsed = assessmentQuestionSchema.safeParse(trueFalseQuestion());
    expect(parsed.success).toBe(true);
    expect('options' in trueFalseQuestion()).toBe(false);
  });

  it('uses boolean draft and persisted response contracts', () => {
    const question = trueFalseQuestion();
    const draft = { format: 'true_false' as const, answer: false };
    expect(validateDraftResponseForQuestion(question, draft).ok).toBe(true);
    expect(completeResponseFromDraft(question, draft)).toEqual(draft);
    expect(validateResponseForQuestion(question, draft).ok).toBe(true);
    expect(validateResponseForQuestion(question, {
      format: 'true_false',
      answer: 'true',
    }).ok).toBe(false);
  });

  it('grades all-or-nothing under strict and diagnostic policies', () => {
    const question = trueFalseQuestion();
    for (const policy of [
      { id: 'strict', version: 1 },
      { id: 'diagnostic', version: 1 },
    ]) {
      const correct = gradeResponseForQuestion({
        question,
        response: { format: 'true_false', answer: true },
        policy,
      });
      const incorrect = gradeResponseForQuestion({
        question,
        response: { format: 'true_false', answer: false },
        policy,
      });
      const unanswered = gradeResponseForQuestion({ question, policy });
      expect(correct.ok && correct.value.status).toBe('correct');
      expect(incorrect.ok && incorrect.value.status).toBe('incorrect');
      expect(unanswered.ok && unanswered.value.status).toBe('unanswered');
    }
  });
});
