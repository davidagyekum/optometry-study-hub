import { describe, expect, it } from 'vitest';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
import { makeValidQuestionBank } from '@/tests/fixtures/valid-question-bank';

function diagnosticCodes(input: unknown): Set<string> {
  return new Set(validateQuestionBank(input).diagnostics.map((diagnostic) => diagnostic.code));
}

describe('question-bank ownership validation', () => {
  it.each([
    [
      'OBJECTIVE_COURSE_NOT_IN_BANK',
      (bank: ReturnType<typeof makeValidQuestionBank>) => {
        bank.objectives[0].courseId = 'unlisted-course';
      },
    ],
    [
      'OBJECTIVE_COURSE_MISMATCH',
      (bank: ReturnType<typeof makeValidQuestionBank>) => {
        bank.questions[0].courseId = 'other-course';
      },
    ],
    [
      'OBJECTIVE_MODULE_MISMATCH',
      (bank: ReturnType<typeof makeValidQuestionBank>) => {
        bank.questions[0].moduleId = 'other-module';
      },
    ],
    [
      'OBJECTIVE_SECTION_MISMATCH',
      (bank: ReturnType<typeof makeValidQuestionBank>) => {
        bank.questions[0].sectionId = 'other-section';
      },
    ],
    [
      'BLOOM_OUTSIDE_OBJECTIVE_TARGET',
      (bank: ReturnType<typeof makeValidQuestionBank>) => {
        bank.questions[0].bloomLevel = 'understand';
      },
    ],
  ] as const)('emits %s', (expectedCode, mutate) => {
    const bank = makeValidQuestionBank();
    mutate(bank);
    expect(diagnosticCodes(bank).has(expectedCode)).toBe(true);
  });
});

describe('question-bank duplicate and reference validation', () => {
  it('rejects all newly prohibited duplicate identifiers and normalized text', () => {
    const bank = makeValidQuestionBank();
    bank.courseIds.push(bank.courseIds[0]);
    bank.objectives[0].sourceIds.push(bank.objectives[0].sourceIds[0]);
    bank.questions[0].sources.push(structuredClone(bank.questions[0].sources[0]));

    const matching = bank.questions.find((question) => question.format === 'matching');
    const extended = bank.questions.find((question) => question.format === 'extended_matching');
    const hotspot = bank.questions.find((question) => question.format === 'image_hotspot');
    const shortAnswer = bank.questions.find((question) => question.format === 'short_answer');
    if (!matching || !extended || !hotspot || !shortAnswer) throw new Error('Pilot formats missing');

    matching.prompts[1].id = matching.prompts[0].id;
    matching.prompts[1].text = `  ${matching.prompts[0].text.toUpperCase()}  `;
    extended.stems[1].id = extended.stems[0].id;
    extended.stems[1].text = `  ${extended.stems[0].text.toUpperCase()}  `;
    hotspot.correctRegionIds.push(hotspot.correctRegionIds[0]);
    shortAnswer.acceptedAnswers.push('  TONOMETER.  ');

    const codes = diagnosticCodes(bank);
    [
      'DUPLICATE_COURSE_ID',
      'DUPLICATE_OBJECTIVE_SOURCE_ID',
      'DUPLICATE_QUESTION_SOURCE_ID',
      'DUPLICATE_MATCHING_PROMPT_ID',
      'DUPLICATE_MATCHING_PROMPT_TEXT',
      'DUPLICATE_EXTENDED_MATCHING_STEM_ID',
      'DUPLICATE_EXTENDED_MATCHING_STEM_TEXT',
      'DUPLICATE_CORRECT_REGION_ID',
      'DUPLICATE_NORMALIZED_SHORT_ANSWER',
    ].forEach((code) => expect(codes.has(code), code).toBe(true));
  });

  it('rejects duplicate matching prompts even when an unexpected mapping key masks the count', () => {
    const bank = makeValidQuestionBank();
    const matching = bank.questions.find((question) => question.format === 'matching');
    if (!matching) throw new Error('Matching pilot missing');

    matching.prompts[1].id = matching.prompts[0].id;
    expect(diagnosticCodes(bank).has('INVALID_MATCHING_REFERENCE')).toBe(true);
  });

  it('rejects duplicate extended-matching stems even when an unexpected key masks the count', () => {
    const bank = makeValidQuestionBank();
    const extended = bank.questions.find((question) => question.format === 'extended_matching');
    if (!extended) throw new Error('Extended-matching pilot missing');

    extended.stems[1].id = extended.stems[0].id;
    expect(diagnosticCodes(bank).has('INVALID_EXTENDED_MATCHING_REFERENCE')).toBe(true);
  });

  it('rejects hotspot interaction text that exposes the anatomical answer label', () => {
    const bank = makeValidQuestionBank();
    const hotspot = bank.questions.find((question) => question.format === 'image_hotspot');
    if (!hotspot) throw new Error('Image hotspot pilot missing');
    hotspot.regions[0].interactionLabel = hotspot.regions[0].label;
    expect(diagnosticCodes(bank).has('HOTSPOT_INTERACTION_LABEL_REVEALS_ANSWER')).toBe(true);
  });
  it('requires registry source identity while permitting question-specific locators', () => {
    const validLocatorOverride = makeValidQuestionBank();
    validLocatorOverride.questions[0].sources[0].locator = 'Slide 12';
    expect(diagnosticCodes(validLocatorOverride).has('SOURCE_METADATA_MISMATCH')).toBe(false);

    const invalidIdentity = makeValidQuestionBank();
    invalidIdentity.questions[0].sources[0] = {
      ...invalidIdentity.questions[0].sources[0],
      title: 'Different source title',
    };
    expect(diagnosticCodes(invalidIdentity).has('SOURCE_METADATA_MISMATCH')).toBe(true);
  });
});
