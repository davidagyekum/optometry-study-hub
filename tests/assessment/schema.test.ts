import { describe, expect, it } from 'vitest';
import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import {
  assessmentQuestionSchema,
  questionBankSchema,
} from '@/lib/assessment/schemas';
import { persistedResponseSchema } from '@/lib/storage/schemas';
import { makeValidQuestionBank } from '@/tests/fixtures/valid-question-bank';

describe('assessment schemas', () => {
  it('parses a bank containing every supported question format', () => {
    const result = questionBankSchema.safeParse(makeValidQuestionBank());
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.questions.map((question) => question.format).sort()).toEqual(
      [...QUESTION_FORMATS].sort(),
    );
    result.data.questions.forEach((question) => {
      expect(assessmentQuestionSchema.safeParse(question).success).toBe(true);
    });
  });

  it('requires stable slug-style IDs', () => {
    const bank = makeValidQuestionBank();
    bank.questions[0].id = 'Unstable Question ID';
    expect(questionBankSchema.safeParse(bank).success).toBe(false);
  });

  it('parses every persisted response shape using stable IDs', () => {
    const responses = [
      { format: 'single_best_answer', optionId: 'trabecular-meshwork' },
      { format: 'multiple_response', optionIds: ['nourish', 'remove-waste'] },
      { format: 'ordering', itemIds: ['posterior-chamber', 'pupil'] },
      { format: 'matching', matches: { pupil: 'chamber-connection' } },
      { format: 'extended_matching', answers: { 'case-one': 'formation-rate' } },
      { format: 'image_hotspot', regionIds: ['iridocorneal-angle'] },
      { format: 'image_label', matches: { 'cornea-target': 'cornea' } },
      { format: 'short_answer', text: 'tonometer' },
      { format: 'open_response', text: 'Vitreoretinal traction may create a tear.' },
    ];

    responses.forEach((response) => {
      expect(persistedResponseSchema.safeParse(response).success).toBe(true);
    });
  });

  it('does not permit automatically graded open responses', () => {
    expect(persistedResponseSchema.safeParse({
      format: 'open_response',
      text: 'A reflective response.',
    }).success).toBe(true);

    const bank = makeValidQuestionBank();
    const openResponse = bank.questions.find((question) => question.format === 'open_response');
    expect(openResponse?.autoGraded).toBe(false);
  });
});
