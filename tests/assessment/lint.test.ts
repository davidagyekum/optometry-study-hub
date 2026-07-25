import { describe, expect, it } from 'vitest';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { makeValidQuestionBank } from '@/tests/fixtures/valid-question-bank';

describe('question-bank linting', () => {
  it('emits no warnings for the committed pilot bank', () => {
    expect(lintQuestionBank(makeValidQuestionBank())).toEqual([]);
  });

  it('detects deterministic authoring-quality warnings', () => {
    const bank = makeValidQuestionBank();
    const singleBestAnswer = bank.questions.find(
      (question) => question.format === 'single_best_answer',
    );
    const multipleResponse = bank.questions.find(
      (question) => question.format === 'multiple_response',
    );
    const ordering = bank.questions.find((question) => question.format === 'ordering');
    const matching = bank.questions.find((question) => question.format === 'matching');
    const extended = bank.questions.find(
      (question) => question.format === 'extended_matching',
    );
    const shortAnswer = bank.questions.find((question) => question.format === 'short_answer');

    if (
      !singleBestAnswer
      || !multipleResponse
      || !ordering
      || !matching
      || !extended
      || !shortAnswer
    ) {
      throw new Error('Pilot fixture does not contain all expected formats.');
    }

    singleBestAnswer.stem = 'Which structure is NOT part of conventional outflow?';
    singleBestAnswer.options[0].text = 'The structure is trabecular meshwork';
    singleBestAnswer.options[1].text = 'The structure is none of the above';
    singleBestAnswer.options[2].text = 'The structure is an exceptionally and unnecessarily long distractor that cues the learner';
    singleBestAnswer.sources[0].locator = undefined;

    multipleResponse.options[0].text = 'All of the above';
    multipleResponse.misconceptionTags = [];

    ordering.explanation = ordering.stem;
    matching.reviewer = matching.author;
    extended.stem = 'Which factor determines the observed pressure change?';
    shortAnswer.stem = singleBestAnswer.stem;

    const first = lintQuestionBank(bank);
    const second = lintQuestionBank(bank);
    const codes = new Set(first.map((diagnostic) => diagnostic.code));
    const expectedCodes = [
      'UNDECLARED_NEGATIVE_STEM',
      'ALL_OF_THE_ABOVE',
      'NONE_OF_THE_ABOVE',
      'OPTION_LENGTH_IMBALANCE',
      'REPEATED_OPTION_PREFIX',
      'NEAR_DUPLICATE_STEM',
      'STEM_COPIED_FROM_EXPLANATION',
      'AUTHOR_IS_REVIEWER',
      'MISSING_MISCONCEPTION_TAGS',
      'POSSIBLE_BLOOM_MISMATCH',
      'MISSING_SOURCE_LOCATOR',
    ];

    expect(second).toEqual(first);
    expectedCodes.forEach((code) => expect(codes.has(code), code).toBe(true));
  });
});
