import { describe, expect, it } from 'vitest';
import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import { gradeResponseForQuestion } from '@/lib/assessment/grading/gradeQuestion';
import {
  correctResponseFor,
  incorrectResponseFor,
} from '@/tests/fixtures/grading';
import {
  makePilotBank,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

const strict = { id: 'strict', version: 1 };

describe('strict per-question grading', () => {
  it('covers correct, incorrect, and unanswered outcomes for all nine formats', () => {
    const questions = makePilotBank().questions;
    expect(new Set(questions.map((question) => question.format)))
      .toEqual(new Set(QUESTION_FORMATS.filter((format) => format !== 'true_false')));

    questions.forEach((question) => {
      const correct = gradeResponseForQuestion({
        question,
        response: correctResponseFor(question),
        policy: strict,
      });
      const incorrect = gradeResponseForQuestion({
        question,
        response: incorrectResponseFor(question),
        policy: strict,
      });
      const unanswered = gradeResponseForQuestion({ question, policy: strict });
      expect(unanswered).toEqual({
        ok: true,
        value: expect.objectContaining({
          questionId: question.id,
          status: 'unanswered',
          score: 0,
          maxScore: 1,
        }),
      });
      if (question.format === 'open_response') {
        expect(correct.ok && correct.value.status).toBe('manual_required');
        expect(incorrect.ok && incorrect.value.status).toBe('manual_required');
        expect(correct.ok && correct.value.score).toBeNull();
      } else {
        expect(correct.ok && correct.value.status, question.format).toBe('correct');
        expect(correct.ok && correct.value.score, question.format).toBe(1);
        expect(incorrect.ok && incorrect.value.status, question.format).toBe('incorrect');
        expect(incorrect.ok && incorrect.value.score, question.format).toBe(0);
      }
    });
  });

  it('compares multiple-response and hotspot selections as sets without partial credit', () => {
    const multiple = questionByFormat('multiple_response');
    const unrestricted = structuredClone(multiple);
    delete unrestricted.minimumSelections;
    delete unrestricted.maximumSelections;
    const reordered = gradeResponseForQuestion({
      question: unrestricted,
      response: {
        format: 'multiple_response',
        optionIds: [...unrestricted.correctOptionIds].reverse(),
      },
      policy: strict,
    });
    const extra = gradeResponseForQuestion({
      question: unrestricted,
      response: {
        format: 'multiple_response',
        optionIds: unrestricted.options.map((option) => option.id),
      },
      policy: strict,
    });
    const missing = gradeResponseForQuestion({
      question: unrestricted,
      response: {
        format: 'multiple_response',
        optionIds: unrestricted.correctOptionIds.slice(0, -1),
      },
      policy: strict,
    });
    expect(reordered.ok && reordered.value.score).toBe(1);
    expect(extra.ok && extra.value.score).toBe(0);
    expect(missing.ok && missing.value.score).toBe(0);

    const hotspot = questionByFormat('image_hotspot');
    const everyRegion = gradeResponseForQuestion({
      question: hotspot,
      response: {
        format: 'image_hotspot',
        regionIds: hotspot.regions.map((region) => region.id).reverse(),
      },
      policy: strict,
    });
    expect(everyRegion.ok && everyRegion.value.score).toBe(0);
  });

  it('requires exact sequences and complete mappings under strict policy', () => {
    for (const format of [
      'ordering',
      'matching',
      'extended_matching',
      'image_label',
    ] as const) {
      const question = questionByFormat(format);
      const grade = gradeResponseForQuestion({
        question,
        response: incorrectResponseFor(question),
        policy: strict,
      });
      expect(grade.ok && grade.value.status, format).toBe('incorrect');
      expect(grade.ok && grade.value.score, format).toBe(0);
    }
  });

  it('uses exact normalized short answers and keeps open responses manual', () => {
    const shortAnswer = gradeResponseForQuestion({
      question: questionByFormat('short_answer'),
      response: { format: 'short_answer', text: '  A   TONOMETER？！ ' },
      policy: strict,
    });
    expect(shortAnswer.ok && shortAnswer.value.status).toBe('correct');

    const open = gradeResponseForQuestion({
      question: questionByFormat('open_response'),
      response: { format: 'open_response', text: 'Reasoned answer' },
      policy: strict,
    });
    expect(open).toEqual({
      ok: true,
      value: expect.objectContaining({
        status: 'manual_required',
        score: null,
        maxScore: 1,
      }),
    });
  });

  it('returns structured failures for malformed responses and unavailable policies', () => {
    const question = questionByFormat('short_answer');
    const malformed = gradeResponseForQuestion({
      question,
      response: { format: 'short_answer', text: '   ' },
      policy: strict,
    });
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.issues[0].code).toBe('GRADING_RESPONSE_INVALID');

    const unknown = gradeResponseForQuestion({
      question,
      policy: { id: 'unknown', version: 1 },
    });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.issues[0].code).toBe('GRADING_POLICY_NOT_FOUND');
  });
});
