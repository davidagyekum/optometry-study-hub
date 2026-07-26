import { describe, expect, it } from 'vitest';
import { gradeResponseForQuestion } from '@/lib/assessment/grading/gradeQuestion';
import { normalizeShortAnswer } from '@/lib/assessment/grading/normalizeShortAnswer';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
import {
  makePilotBank,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

const allOff = {
  trim: false,
  caseInsensitive: false,
  collapseWhitespace: false,
  ignoreTerminalPunctuation: false,
};

describe('shared short-answer normalization', () => {
  it('applies each normalization operation independently', () => {
    expect(normalizeShortAnswer('  Answer  ', { ...allOff, trim: true })).toBe('Answer');
    expect(normalizeShortAnswer('AnSwEr', {
      ...allOff,
      caseInsensitive: true,
    })).toBe('answer');
    expect(normalizeShortAnswer('one \n\t two', {
      ...allOff,
      collapseWhitespace: true,
    })).toBe('one two');
    expect(normalizeShortAnswer('answer?!\u2026', {
      ...allOff,
      ignoreTerminalPunctuation: true,
    })).toBe('answer');
  });

  it('keeps disabled operations disabled and applies the combined order deterministically', () => {
    expect(normalizeShortAnswer('  AnSwer!!  ', allOff)).toBe('  AnSwer!!  ');
    expect(normalizeShortAnswer(' \tA   TONOMETER\uFF1F\uFF01 ', {
      trim: true,
      caseInsensitive: true,
      collapseWhitespace: true,
      ignoreTerminalPunctuation: true,
    })).toBe('a tonometer');
  });

  it('removes terminal punctuation but preserves meaningful symbols', () => {
    const ignorePunctuation = {
      ...allOff,
      ignoreTerminalPunctuation: true,
    };
    expect(normalizeShortAnswer('Na+', ignorePunctuation)).toBe('Na+');
    expect(normalizeShortAnswer('15\u00B0', ignorePunctuation)).toBe('15\u00B0');
    expect(normalizeShortAnswer('Na+?!', ignorePunctuation)).toBe('Na+');
  });

  it('uses identical normalization for authoring duplicate detection and grading', () => {
    const bank = makePilotBank();
    const question = bank.questions.find((item) => item.format === 'short_answer');
    if (!question) throw new Error('Expected short-answer fixture');
    question.acceptedAnswers = ['tonometer', '  TONOMETER!!! '];
    expect(validateQuestionBank(bank).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'DUPLICATE_NORMALIZED_SHORT_ANSWER' }),
    );

    const grade = gradeResponseForQuestion({
      question: questionByFormat('short_answer'),
      response: { format: 'short_answer', text: '  TONOMETER!!! ' },
      policy: { id: 'strict', version: 1 },
    });
    expect(grade.ok && grade.value.status).toBe('correct');
  });

  it('rejects accepted answers that normalize to empty', () => {
    const bank = makePilotBank();
    const question = bank.questions.find((item) => item.format === 'short_answer');
    if (!question) throw new Error('Expected short-answer fixture');
    question.acceptedAnswers = ['?!\u2026'];
    expect(validateQuestionBank(bank).diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'EMPTY_NORMALIZED_SHORT_ANSWER',
        path: 'acceptedAnswers.0',
      }),
    );
  });

  it('does not grade punctuation-only learner responses as correct', () => {
    const question = questionByFormat('short_answer');
    const grade = gradeResponseForQuestion({
      question,
      response: { format: 'short_answer', text: '?!\u2026' },
      policy: { id: 'strict', version: 1 },
    });
    expect(grade.ok && grade.value.status).toBe('incorrect');
  });

  it('does not accept substrings or fuzzy spellings', () => {
    const question = questionByFormat('short_answer');
    for (const text of ['tonometer device', 'tonometre', 'tono']) {
      const grade = gradeResponseForQuestion({
        question,
        response: { format: 'short_answer', text },
        policy: { id: 'strict', version: 1 },
      });
      expect(grade.ok && grade.value.status, text).toBe('incorrect');
    }
  });
});
