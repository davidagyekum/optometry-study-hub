import { describe, expect, it } from 'vitest';
import {
  formatQuestionBankReport,
  reportQuestionBank,
} from '@/lib/assessment/reportQuestionBank';
import { makeValidQuestionBank } from '@/tests/fixtures/valid-question-bank';

describe('question-bank reporting', () => {
  it('reports deterministic coverage across all required dimensions', () => {
    const bank = makeValidQuestionBank();
    const first = reportQuestionBank(bank);
    const second = reportQuestionBank(bank);

    expect(second).toEqual(first);
    expect(first.totalQuestions).toBe(9);
    expect(first.totalObjectives).toBe(8);
    expect(first.byCourse).toEqual({ 'neuro-anatomy': 9 });
    expect(first.byModule).toEqual({ 'aqueous-vitreous': 9 });
    expect(Object.keys(first.byFormat)).toHaveLength(9);
    expect(first.byReviewStatus).toEqual({ draft: 9 });
    expect(first.byObjective).toEqual(expect.objectContaining({
      'vitreous-identify-anatomy': 0,
    }));
    expect(first.familiesWithMultipleVariants).toEqual({
      'aqueous-conventional-outflow-sequence': 2,
    });
  });

  it('formats the same report text on repeated calls', () => {
    const report = reportQuestionBank(makeValidQuestionBank());
    const first = formatQuestionBankReport(report);
    expect(formatQuestionBankReport(report)).toBe(first);
    expect(first).toContain('Total questions: 9');
    expect(first).toContain('By Bloom level');
    expect(first).toContain('By difficulty');
    expect(first).toContain('By stimulus type');
  });
});
