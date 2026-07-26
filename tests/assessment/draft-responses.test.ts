import { describe, expect, it } from 'vitest';
import { gradeAssessmentAttempt } from '@/lib/assessment/grading/gradeAssessment';
import {
  clearAttemptDraftResponse,
  getAttemptQuestionState,
  updateAttemptDraftResponse,
  validateDraftResponseForQuestion,
} from '@/lib/assessment/session/draftResponses';
import { resolveAssessmentAttempt } from '@/lib/assessment/session/resolveAttempt';
import {
  assessmentAttemptSnapshotSchema,
  type AssessmentDraftResponse,
  type PersistedResponse,
} from '@/lib/storage/schemas';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import {
  makeAttempt,
  makeDraftRegistry,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }) {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

const formats: AssessmentQuestion['format'][] = [
  'single_best_answer',
  'multiple_response',
  'ordering',
  'matching',
  'extended_matching',
  'image_hotspot',
  'image_label',
  'short_answer',
  'open_response',
];

function completeDraft(question: AssessmentQuestion): AssessmentDraftResponse {
  switch (question.format) {
    case 'single_best_answer':
      return { format: question.format, optionId: question.correctOptionId };
    case 'multiple_response':
      return { format: question.format, optionIds: [...question.correctOptionIds] };
    case 'ordering':
      return { format: question.format, itemIds: [...question.correctOrder] };
    case 'matching':
      return { format: question.format, matches: { ...question.correctMatches } };
    case 'extended_matching':
      return { format: question.format, answers: { ...question.correctAnswers } };
    case 'image_hotspot':
      return { format: question.format, regionIds: [...question.correctRegionIds] };
    case 'image_label':
      return { format: question.format, matches: { ...question.correctLabels } };
    case 'short_answer':
      return { format: question.format, text: question.acceptedAnswers[0]! };
    case 'open_response':
      return { format: question.format, text: question.sampleAnswer ?? 'Sample response' };
  }
}

function differentResponse(
  question: AssessmentQuestion,
  response: PersistedResponse,
): PersistedResponse {
  switch (question.format) {
    case 'single_best_answer':
      return {
        format: question.format,
        optionId: question.options.find((option) => option.id !== question.correctOptionId)!.id,
      };
    case 'multiple_response':
      return {
        format: question.format,
        optionIds: question.options.slice(0, question.minimumSelections ?? 1).map((option) => option.id)
          .map((id, index) => index === 0 ? question.options.at(-1)!.id : id),
      };
    case 'ordering':
      return {
        format: question.format,
        itemIds: [...question.correctOrder].reverse(),
      };
    case 'matching': {
      const entries = Object.entries(question.correctMatches);
      return {
        format: question.format,
        matches: Object.fromEntries(entries.map(([key], index) => [
          key,
          entries[(index + 1) % entries.length][1],
        ])),
      };
    }
    case 'extended_matching': {
      const entries = Object.entries(question.correctAnswers);
      return {
        format: question.format,
        answers: Object.fromEntries(entries.map(([key], index) => [
          key,
          entries[(index + 1) % entries.length][1],
        ])),
      };
    }
    case 'image_hotspot':
      return {
        format: question.format,
        regionIds: [question.regions.find(
          (region) => !question.correctRegionIds.includes(region.id),
        )!.id],
      };
    case 'image_label': {
      const entries = Object.entries(question.correctLabels);
      return {
        format: question.format,
        matches: Object.fromEntries(entries.map(([key], index) => [
          key,
          entries[(index + 1) % entries.length][1],
        ])),
      };
    }
    case 'short_answer':
    case 'open_response':
      return { format: question.format, text: `${response.format === question.format ? response.text : ''} altered` };
  }
}
describe('assessment draft responses', () => {
  const registry = makeDraftRegistry();

  it('validates positive in-progress drafts for all nine formats', () => {
    const drafts = [
      [questionByFormat('single_best_answer'), {
        format: 'single_best_answer', optionId: 'trabecular-meshwork',
      }],
      [questionByFormat('multiple_response'), {
        format: 'multiple_response', optionIds: ['nourish-avascular-tissues'],
      }],
      [questionByFormat('ordering'), {
        format: 'ordering',
        itemIds: questionByFormat('ordering').items.map((item) => item.id),
      }],
      [questionByFormat('matching'), {
        format: 'matching', matches: { pupil: 'chamber-connection' },
      }],
      [questionByFormat('extended_matching'), {
        format: 'extended_matching', answers: { 'secretion-reduced': 'formation-rate' },
      }],
      [questionByFormat('image_hotspot'), {
        format: 'image_hotspot', regionIds: [],
      }],
      [questionByFormat('image_label'), {
        format: 'image_label', matches: { 'cornea-target': 'cornea' },
      }],
      [questionByFormat('short_answer'), { format: 'short_answer', text: '' }],
      [questionByFormat('open_response'), { format: 'open_response', text: '' }],
    ] as const;
    drafts.forEach(([question, draft]) => {
      expect(validateDraftResponseForQuestion(question, draft).ok).toBe(true);
    });
  });

  it('returns deterministic failures for invalid formats, IDs, limits, mappings and reuse', () => {
    expect(codes(validateDraftResponseForQuestion(
      questionByFormat('single_best_answer'),
      { format: 'short_answer', text: 'x' },
    ))).toContain('DRAFT_FORMAT_MISMATCH');
    expect(codes(validateDraftResponseForQuestion(
      questionByFormat('single_best_answer'),
      { format: 'single_best_answer', optionId: 'missing-option' },
    ))).toContain('DRAFT_OPTION_NOT_FOUND');
    expect(codes(validateDraftResponseForQuestion(
      questionByFormat('multiple_response'),
      {
        format: 'multiple_response',
        optionIds: [
          'nourish-avascular-tissues',
          'remove-metabolic-waste',
          'maintain-ocular-form',
          'supply-inner-retina',
        ],
      },
    ))).toContain('DRAFT_SELECTION_LIMIT');
    expect(codes(validateDraftResponseForQuestion(
      questionByFormat('matching'),
      { format: 'matching', matches: { 'unknown-key': 'active-secretion' } },
    ))).toContain('DRAFT_MAPPING_KEY_INVALID');
    expect(codes(validateDraftResponseForQuestion(
      questionByFormat('image_label'),
      {
        format: 'image_label',
        matches: { 'cornea-target': 'cornea', 'iris-target': 'cornea' },
      },
    ))).toContain('DRAFT_REUSE_NOT_ALLOWED');
  });

  it('persists incomplete work, promotes complete work, and removes stale responses', () => {
    const question = questionByFormat('multiple_response');
    const source = makeAttempt([question.id], { initializeDraftResponses: true });
    const sourceBefore = structuredClone(source);
    const partial = updateAttemptDraftResponse({
      attempt: source,
      registry,
      questionId: question.id,
      draft: {
        format: question.format,
        optionIds: [question.correctOptionIds[0]],
      },
    });
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(source).toEqual(sourceBefore);
    expect(getAttemptQuestionState(partial.value, question.id)).toBe('in_progress');
    expect(partial.value.responses[question.id]).toBeUndefined();

    const complete = updateAttemptDraftResponse({
      attempt: partial.value,
      registry,
      questionId: question.id,
      draft: {
        format: question.format,
        optionIds: [...question.correctOptionIds],
      },
    });
    expect(complete.ok).toBe(true);
    if (!complete.ok) return;
    expect(getAttemptQuestionState(complete.value, question.id)).toBe('answered');

    const incompleteAgain = updateAttemptDraftResponse({
      attempt: complete.value,
      registry,
      questionId: question.id,
      draft: {
        format: question.format,
        optionIds: [question.correctOptionIds[0]],
      },
    });
    expect(incompleteAgain.ok).toBe(true);
    if (!incompleteAgain.ok) return;
    expect(incompleteAgain.value.responses[question.id]).toBeUndefined();
    expect(getAttemptQuestionState(incompleteAgain.value, question.id)).toBe('in_progress');

    const cleared = clearAttemptDraftResponse(incompleteAgain.value, question.id);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.draftResponses?.[question.id]).toBeUndefined();
    expect(cleared.value.responses[question.id]).toBeUndefined();
    expect(getAttemptQuestionState(cleared.value, question.id)).toBe('unanswered');
  });

  it('rejects stale versions and wrong ownership without mutating the source', () => {
    const question = questionByFormat('short_answer');
    const source = makeAttempt([question.id], { initializeDraftResponses: true });
    const stale = {
      ...source,
      questionVersions: { ...source.questionVersions, [question.id]: 99 },
    };
    expect(codes(updateAttemptDraftResponse({
      attempt: stale,
      registry,
      questionId: question.id,
      draft: { format: question.format, text: 'tonometer' },
    }))).toContain('QUESTION_VERSION_MISMATCH');
    expect(codes(updateAttemptDraftResponse({
      attempt: { ...source, courseId: 'wrong-course' },
      registry,
      questionId: question.id,
      draft: { format: question.format, text: 'tonometer' },
    }))).toContain('QUESTION_COURSE_MISMATCH');
    expect(codes(updateAttemptDraftResponse({
      attempt: { ...source, moduleId: 'wrong-module' },
      registry,
      questionId: question.id,
      draft: { format: question.format, text: 'tonometer' },
    }))).toContain('QUESTION_MODULE_MISMATCH');
  });

  it('keeps historical attempts valid and diagnoses malformed persisted drafts', () => {
    const historical = makeAttempt();
    expect(historical.draftResponses).toBeUndefined();
    expect(assessmentAttemptSnapshotSchema.safeParse(historical).success).toBe(true);
    const questionId = historical.orderedQuestionIds[0];
    const malformed = {
      ...historical,
      draftResponses: {
        [questionId]: { format: 'single_best_answer' as const, optionId: 'missing-option' },
      },
    };
    expect(codes(resolveAssessmentAttempt(malformed, registry))).toContain('INVALID_DRAFT_RESPONSE');
    expect(assessmentAttemptSnapshotSchema.safeParse({
      ...historical,
      draftResponses: {
        'outside-question': { format: 'short_answer', text: '' },
      },
    }).success).toBe(false);
  });

  it('grades incomplete multiple, matching and text drafts as unanswered', () => {
    const questions = [
      questionByFormat('multiple_response'),
      questionByFormat('matching'),
      questionByFormat('short_answer'),
    ];
    const attempt = makeAttempt(questions.map((question) => question.id), {
      initializeDraftResponses: true,
    });
    const withDrafts = {
      ...attempt,
      draftResponses: {
        [questions[0].id]: {
          format: 'multiple_response' as const,
          optionIds: ['nourish-avascular-tissues'],
        },
        [questions[1].id]: {
          format: 'matching' as const,
          matches: { pupil: 'chamber-connection' },
        },
        [questions[2].id]: {
          format: 'short_answer' as const,
          text: '   ',
        },
      },
    };
    const graded = gradeAssessmentAttempt({ attempt: withDrafts, registry });
    expect(graded.ok).toBe(true);
    if (!graded.ok) return;
    expect(graded.value.unansweredCount).toBe(3);
    expect(graded.value.score).toBe(0);
  });
  it.each(formats)('enforces complete draft/response coherence for %s', (format) => {
    const question = questionByFormat(format);
    const source = makeAttempt([question.id], { initializeDraftResponses: true });
    const updated = updateAttemptDraftResponse({
      attempt: source,
      registry,
      questionId: question.id,
      draft: completeDraft(question),
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(resolveAssessmentAttempt(updated.value, registry).ok).toBe(true);

    const response = updated.value.responses[question.id];
    expect(response).toBeDefined();
    if (!response) return;
    const mismatched = {
      ...updated.value,
      responses: {
        ...updated.value.responses,
        [question.id]: differentResponse(question, response),
      },
    };
    expect(codes(resolveAssessmentAttempt(mismatched, registry)))
      .toContain('DRAFT_RESPONSE_MISMATCH');
    expect(codes(gradeAssessmentAttempt({ attempt: mismatched, registry })))
      .toContain('DRAFT_RESPONSE_MISMATCH');

    const missingResponse = {
      ...updated.value,
      responses: {},
    };
    expect(codes(resolveAssessmentAttempt(missingResponse, registry)))
      .toContain('DRAFT_RESPONSE_MISMATCH');
  });

  it('rejects a response paired with an incomplete draft but accepts response-only history', () => {
    const question = questionByFormat('short_answer');
    const source = makeAttempt([question.id]);
    const historical = {
      ...source,
      responses: {
        [question.id]: { format: question.format, text: question.acceptedAnswers[0]! },
      },
    };
    expect(resolveAssessmentAttempt(historical, registry).ok).toBe(true);
    const incoherent = {
      ...historical,
      draftResponses: {
        [question.id]: { format: question.format, text: '   ' },
      },
    };
    expect(codes(resolveAssessmentAttempt(incoherent, registry)))
      .toContain('DRAFT_RESPONSE_MISMATCH');
  });
});
