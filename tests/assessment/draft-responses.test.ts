import { describe, expect, it } from 'vitest';
import { gradeAssessmentAttempt } from '@/lib/assessment/grading/gradeAssessment';
import {
  clearAttemptDraftResponse,
  getAttemptQuestionState,
  updateAttemptDraftResponse,
  validateDraftResponseForQuestion,
} from '@/lib/assessment/session/draftResponses';
import { resolveAssessmentAttempt } from '@/lib/assessment/session/resolveAttempt';
import { assessmentAttemptSnapshotSchema } from '@/lib/storage/schemas';
import {
  makeAttempt,
  makeDraftRegistry,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }) {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
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
});
