import { describe, expect, it } from 'vitest';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
import { makeInvalidQuestionBank } from '@/tests/fixtures/invalid-question-bank';
import { makeValidQuestionBank } from '@/tests/fixtures/valid-question-bank';

describe('question-bank validation', () => {
  it('accepts the valid nine-format pilot bank', () => {
    const result = validateQuestionBank(makeValidQuestionBank());
    expect(result.bank).toBeDefined();
    expect(result.diagnostics).toEqual([]);
  });

  it('returns deterministic actionable semantic diagnostics', () => {
    const first = validateQuestionBank(makeInvalidQuestionBank()).diagnostics;
    const second = validateQuestionBank(makeInvalidQuestionBank()).diagnostics;
    const codes = new Set(first.map((diagnostic) => diagnostic.code));

    expect(second).toEqual(first);
    const expectedCodes = [
      'DUPLICATE_QUESTION_ID',
      'DUPLICATE_OBJECTIVE_ID',
      'DUPLICATE_SOURCE_ID',
      'MISSING_OBJECTIVE_REFERENCE',
      'MISSING_SOURCE_REFERENCE',
      'DUPLICATE_OPTION_ID',
      'DUPLICATE_OPTION_TEXT',
      'CORRECT_OPTION_NOT_FOUND',
      'INVALID_ORDERING_PERMUTATION',
      'INVALID_MATCHING_REFERENCE',
      'INVALID_HOTSPOT_COORDINATES',
      'MISSING_REVIEWER',
      'MISSING_REQUIRED_SOURCE',
      'MISSING_OPTION_RATIONALE',
      'EMPTY_STEM',
      'EMPTY_EXPLANATION',
      'RETIRED_QUESTION_IN_PRODUCTION_BANK',
    ];
    expectedCodes.forEach((code) => expect(codes.has(code), code).toBe(true));
  });

  it('reports invalid versions and unsupported formats at the schema boundary', () => {
    const wrongVersion = makeValidQuestionBank();
    const wrongFormat = makeValidQuestionBank();
    const versionResult = validateQuestionBank({ ...wrongVersion, schemaVersion: 2 });
    const formatResult = validateQuestionBank({
      ...wrongFormat,
      questions: [{ ...wrongFormat.questions[0], format: 'unsupported_format' }],
    });

    expect(versionResult.diagnostics.some((item) => item.code === 'INVALID_VERSION')).toBe(true);
    expect(formatResult.diagnostics.some((item) => item.code === 'UNSUPPORTED_FORMAT')).toBe(true);
  });

  it('allows retired questions only for explicit archival reporting', () => {
    const bank = makeValidQuestionBank();
    bank.questions[0].reviewStatus = 'retired';
    expect(validateQuestionBank(bank).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'RETIRED_QUESTION_IN_PRODUCTION_BANK' }),
    );
    expect(validateQuestionBank(bank, { includeRetired: true }).diagnostics).toEqual([]);
  });
});
