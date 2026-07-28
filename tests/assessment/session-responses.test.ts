import { describe, expect, it } from 'vitest';
import { validateResponseForQuestion } from '@/lib/assessment/session/responseValidation';
import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import {
  makePilotBank,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: ReturnType<typeof validateResponseForQuestion>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('format-specific persisted response validation', () => {
  it('accepts valid responses for all nine formats', () => {
    const cases = [
      ['single_best_answer', { format: 'single_best_answer', optionId: 'trabecular-meshwork' }],
      ['multiple_response', {
        format: 'multiple_response',
        optionIds: ['nourish-avascular-tissues', 'remove-metabolic-waste', 'maintain-ocular-form'],
      }],
      ['ordering', {
        format: 'ordering',
        itemIds: [
          'posterior-chamber',
          'pupil',
          'anterior-chamber',
          'trabecular-meshwork',
          'schlemm-canal',
          'collector-channels',
          'episcleral-veins',
        ],
      }],
      ['matching', {
        format: 'matching',
        matches: {
          'non-pigmented-epithelium': 'active-secretion',
          pupil: 'chamber-connection',
          'trabecular-meshwork': 'outflow-resistance',
        },
      }],
      ['extended_matching', {
        format: 'extended_matching',
        answers: {
          'secretion-reduced': 'formation-rate',
          'meshwork-obstructed': 'trabecular-resistance',
          'venous-pressure-raised': 'episcleral-pressure',
        },
      }],
      ['image_hotspot', { format: 'image_hotspot', regionIds: ['iridocorneal-angle'] }],
      ['image_label', {
        format: 'image_label',
        matches: {
          'cornea-target': 'cornea',
          'iris-target': 'iris',
          'lens-target': 'lens',
        },
      }],
      ['short_answer', { format: 'short_answer', text: 'tonometer' }],
      ['open_response', {
        format: 'open_response',
        text: 'Vitreoretinal traction may create a retinal tear.',
      }],
    ] as const;

    cases.forEach(([format, response]) => {
      expect(validateResponseForQuestion(questionByFormat(format), response), format)
        .toEqual({ ok: true, value: { response } });
    });
  });

  it('requires exact format discrimination for every question format', () => {
    const bank = makePilotBank();
    expect(new Set(bank.questions.map((question) => question.format)))
      .toEqual(new Set(QUESTION_FORMATS.filter((format) => format !== 'true_false')));
    bank.questions.forEach((question) => {
      const result = validateResponseForQuestion(question, {
        format: question.format === 'short_answer' ? 'open_response' : 'short_answer',
        text: 'nonempty',
      });
      expect(codes(result), question.format).toContain('RESPONSE_FORMAT_MISMATCH');
    });
  });

  it('validates single-best-answer IDs', () => {
    const question = questionByFormat('single_best_answer');
    expect(codes(validateResponseForQuestion(question, {
      format: 'single_best_answer',
      optionId: 'missing-option',
    }))).toContain('RESPONSE_OPTION_NOT_FOUND');
  });

  it('validates multiple-response uniqueness, IDs, and selection limits', () => {
    const question = questionByFormat('multiple_response');
    expect(codes(validateResponseForQuestion(question, {
      format: 'multiple_response',
      optionIds: ['nourish-avascular-tissues', 'nourish-avascular-tissues'],
    }))).toContain('RESPONSE_DUPLICATE_ID');
    expect(codes(validateResponseForQuestion(question, {
      format: 'multiple_response',
      optionIds: ['nourish-avascular-tissues', 'remove-metabolic-waste', 'missing-option'],
    }))).toContain('RESPONSE_OPTION_NOT_FOUND');
    expect(codes(validateResponseForQuestion(question, {
      format: 'multiple_response',
      optionIds: ['nourish-avascular-tissues'],
    }))).toContain('RESPONSE_SELECTION_LIMIT');
  });

  it('does not infer grading policy when multiple-response limits are omitted', () => {
    const question = questionByFormat('multiple_response');
    delete question.minimumSelections;
    delete question.maximumSelections;
    expect(validateResponseForQuestion(question, {
      format: 'multiple_response',
      optionIds: [],
    })).toEqual({
      ok: true,
      value: { response: { format: 'multiple_response', optionIds: [] } },
    });
  });

  it('requires ordering responses to be exact item permutations', () => {
    const question = questionByFormat('ordering');
    expect(codes(validateResponseForQuestion(question, {
      format: 'ordering',
      itemIds: question.items.slice(0, -1).map((item) => item.id),
    }))).toContain('RESPONSE_NOT_EXACT_PERMUTATION');
    expect(codes(validateResponseForQuestion(question, {
      format: 'ordering',
      itemIds: question.items.map(() => question.items[0].id),
    }))).toContain('RESPONSE_DUPLICATE_ID');
  });

  it('requires exact matching keys, valid choices, and declared reuse', () => {
    const question = questionByFormat('matching');
    expect(codes(validateResponseForQuestion(question, {
      format: 'matching',
      matches: { pupil: 'chamber-connection' },
    }))).toContain('RESPONSE_MAPPING_KEYS_INVALID');
    expect(codes(validateResponseForQuestion(question, {
      format: 'matching',
      matches: {
        'non-pigmented-epithelium': 'active-secretion',
        pupil: 'missing-choice',
        'trabecular-meshwork': 'outflow-resistance',
      },
    }))).toContain('RESPONSE_OPTION_NOT_FOUND');
    expect(codes(validateResponseForQuestion(question, {
      format: 'matching',
      matches: {
        'non-pigmented-epithelium': 'active-secretion',
        pupil: 'active-secretion',
        'trabecular-meshwork': 'outflow-resistance',
      },
    }))).toContain('RESPONSE_REUSE_NOT_ALLOWED');

    question.reuseChoices = true;
    expect(validateResponseForQuestion(question, {
      format: 'matching',
      matches: {
        'non-pigmented-epithelium': 'active-secretion',
        pupil: 'active-secretion',
        'trabecular-meshwork': 'outflow-resistance',
      },
    }).ok).toBe(true);
  });

  it('requires exact extended-matching keys, valid options, and declared reuse', () => {
    const question = questionByFormat('extended_matching');
    expect(codes(validateResponseForQuestion(question, {
      format: 'extended_matching',
      answers: { 'secretion-reduced': 'formation-rate' },
    }))).toContain('RESPONSE_MAPPING_KEYS_INVALID');
    expect(codes(validateResponseForQuestion(question, {
      format: 'extended_matching',
      answers: {
        'secretion-reduced': 'formation-rate',
        'meshwork-obstructed': 'missing-option',
        'venous-pressure-raised': 'episcleral-pressure',
      },
    }))).toContain('RESPONSE_OPTION_NOT_FOUND');
    expect(codes(validateResponseForQuestion(question, {
      format: 'extended_matching',
      answers: {
        'secretion-reduced': 'formation-rate',
        'meshwork-obstructed': 'formation-rate',
        'venous-pressure-raised': 'episcleral-pressure',
      },
    }))).toContain('RESPONSE_REUSE_NOT_ALLOWED');

    question.reuseOptions = true;
    expect(validateResponseForQuestion(question, {
      format: 'extended_matching',
      answers: {
        'secretion-reduced': 'formation-rate',
        'meshwork-obstructed': 'formation-rate',
        'venous-pressure-raised': 'episcleral-pressure',
      },
    }).ok).toBe(true);
  });

  it('validates hotspot uniqueness, nonempty selection, and region references', () => {
    const question = questionByFormat('image_hotspot');
    expect(codes(validateResponseForQuestion(question, {
      format: 'image_hotspot',
      regionIds: [],
    }))).toContain('RESPONSE_SELECTION_LIMIT');
    expect(codes(validateResponseForQuestion(question, {
      format: 'image_hotspot',
      regionIds: ['iridocorneal-angle', 'iridocorneal-angle'],
    }))).toContain('RESPONSE_DUPLICATE_ID');
    expect(codes(validateResponseForQuestion(question, {
      format: 'image_hotspot',
      regionIds: ['missing-region'],
    }))).toContain('RESPONSE_OPTION_NOT_FOUND');
  });

  it('validates image-label keys, references, and one-use labels', () => {
    const question = questionByFormat('image_label');
    expect(codes(validateResponseForQuestion(question, {
      format: 'image_label',
      matches: { 'cornea-target': 'cornea' },
    }))).toContain('RESPONSE_MAPPING_KEYS_INVALID');
    expect(codes(validateResponseForQuestion(question, {
      format: 'image_label',
      matches: {
        'cornea-target': 'cornea',
        'iris-target': 'missing-label',
        'lens-target': 'lens',
      },
    }))).toContain('RESPONSE_OPTION_NOT_FOUND');
    expect(codes(validateResponseForQuestion(question, {
      format: 'image_label',
      matches: {
        'cornea-target': 'cornea',
        'iris-target': 'cornea',
        'lens-target': 'lens',
      },
    }))).toContain('RESPONSE_REUSE_NOT_ALLOWED');
  });

  it.each(['short_answer', 'open_response'] as const)(
    'rejects whitespace-only %s text without grading',
    (format) => {
      expect(codes(validateResponseForQuestion(questionByFormat(format), {
        format,
        text: '   \n ',
      }))).toContain('INVALID_PERSISTED_RESPONSE');
    },
  );
});
