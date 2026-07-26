import { describe, expect, it } from 'vitest';
import { gradeResponseForQuestion } from '@/lib/assessment/grading/gradeQuestion';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import type { PersistedResponse } from '@/lib/storage/schemas';
import {
  correctResponseFor,
  incorrectResponseFor,
} from '@/tests/fixtures/grading';
import { questionByFormat } from '@/tests/fixtures/session-engine';

const diagnostic = { id: 'diagnostic', version: 1 };

function rotateMapping(mapping: Record<string, string>): Record<string, string> {
  const keys = Object.keys(mapping);
  const values = Object.values(mapping);
  return Object.fromEntries(keys.map((key, index) => [
    key,
    values[(index + 1) % values.length],
  ]));
}

function answerMapping(
  question: Extract<AssessmentQuestion, {
    format: 'matching' | 'extended_matching' | 'image_label';
  }>,
): Record<string, string> {
  switch (question.format) {
    case 'matching': return question.correctMatches;
    case 'extended_matching': return question.correctAnswers;
    case 'image_label': return question.correctLabels;
  }
}

function responseWithMapping(
  question: Extract<AssessmentQuestion, {
    format: 'matching' | 'extended_matching' | 'image_label';
  }>,
  mapping: Record<string, string>,
): PersistedResponse {
  return question.format === 'extended_matching'
    ? { format: question.format, answers: mapping }
    : { format: question.format, matches: mapping };
}

describe('diagnostic per-question grading', () => {
  it.each([
    'matching',
    'extended_matching',
    'image_label',
  ] as const)('grades %s at zero, partial, and full component coverage', (format) => {
    const question = questionByFormat(format);
    const answer = answerMapping(question);
    const zero = gradeResponseForQuestion({
      question,
      response: responseWithMapping(question, rotateMapping(answer)),
      policy: diagnostic,
    });
    const partial = gradeResponseForQuestion({
      question,
      response: incorrectResponseFor(question),
      policy: diagnostic,
    });
    const full = gradeResponseForQuestion({
      question,
      response: correctResponseFor(question),
      policy: diagnostic,
    });

    expect(zero.ok && zero.value.status).toBe('incorrect');
    expect(zero.ok && zero.value.score).toBe(0);
    expect(partial.ok && partial.value.status).toBe('partial');
    expect(partial.ok && partial.value.score).toBe(0.333333);
    expect(full.ok && full.value.status).toBe('correct');
    expect(full.ok && full.value.score).toBe(1);
  });

  it('rounds a two-of-three extended-matching outcome deterministically', () => {
    const question = questionByFormat('extended_matching');
    const answers = { ...question.correctAnswers, 'venous-pressure-raised': 'retinal-perfusion' };
    const grade = gradeResponseForQuestion({
      question,
      response: { format: 'extended_matching', answers },
      policy: diagnostic,
    });
    expect(grade.ok && grade.value).toEqual(expect.objectContaining({
      status: 'partial',
      score: 0.666667,
      correctParts: 2,
      totalParts: 3,
    }));
  });

  it.each([
    'single_best_answer',
    'multiple_response',
    'ordering',
    'image_hotspot',
    'short_answer',
  ] as const)('keeps %s all-or-nothing with no negative scores', (format) => {
    const question = questionByFormat(format);
    const grade = gradeResponseForQuestion({
      question,
      response: incorrectResponseFor(question),
      policy: diagnostic,
    });
    expect(grade.ok && grade.value.status).toBe('incorrect');
    expect(grade.ok && grade.value.score).toBe(0);
    expect(grade.ok && (grade.value.score ?? 0)).toBeGreaterThanOrEqual(0);
  });
});
