import { describe, expect, it } from 'vitest';
import { gradeAssessmentAttempt } from '@/lib/assessment/grading/gradeAssessment';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';
import type { PersistedResponse } from '@/lib/storage/schemas';
import {
  addCorrectResponses,
  correctResponseFor,
  incorrectResponseFor,
} from '@/tests/fixtures/grading';
import {
  makeAttempt,
  makeDraftRegistry,
  makePilotBank,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('assessment-attempt grading', () => {
  it('grades one unanswered question as a complete zero-of-one report', () => {
    const question = questionByFormat('single_best_answer');
    const attempt = makeAttempt([question.id]);
    const report = gradeAssessmentAttempt({ attempt, registry: makeDraftRegistry() });
    expect(report).toEqual({
      ok: true,
      value: expect.objectContaining({
        policy: { id: 'diagnostic', version: 1 },
        status: 'complete',
        score: 0,
        maxScore: 1,
        autoScore: 0,
        autoMaxScore: 1,
        unansweredCount: 1,
      }),
    });
  });

  it('grades all nine unanswered questions, including open response, numerically', () => {
    const attempt = makeAttempt();
    const report = gradeAssessmentAttempt({ attempt, registry: makeDraftRegistry() });
    expect(report.ok).toBe(true);
    if (!report.ok) return;
    expect(report.value.status).toBe('complete');
    expect(report.value.score).toBe(0);
    expect(report.value.maxScore).toBe(9);
    expect(report.value.unansweredCount).toBe(9);
    expect(report.value.manualRequiredCount).toBe(0);
    expect(Object.keys(report.value.questionGrades)).toEqual(attempt.orderedQuestionIds);
  });

  it('grades all eight auto-gradable formats correctly', () => {
    const registry = makeDraftRegistry();
    const ids = registry.questionIds().filter(
      (id) => registry.get(id)?.format !== 'open_response',
    );
    const attempt = addCorrectResponses(makeAttempt(ids), registry);
    const report = gradeAssessmentAttempt({ attempt, registry });
    expect(report.ok).toBe(true);
    if (!report.ok) return;
    expect(report.value).toEqual(expect.objectContaining({
      status: 'complete',
      score: 8,
      maxScore: 8,
      correctCount: 8,
      manualRequiredCount: 0,
    }));
  });

  it('preserves auto subtotal when an answered open response requires review', () => {
    const registry = makeDraftRegistry();
    const attempt = addCorrectResponses(makeAttempt(), registry, true);
    const report = gradeAssessmentAttempt({ attempt, registry });
    expect(report.ok).toBe(true);
    if (!report.ok) return;
    expect(report.value).toEqual(expect.objectContaining({
      status: 'manual_required',
      score: null,
      maxScore: null,
      autoScore: 8,
      autoMaxScore: 8,
      correctCount: 8,
      manualRequiredCount: 1,
    }));
  });

  it('aggregates mixed correct, incorrect, partial, and unanswered outcomes exactly', () => {
    const registry = makeDraftRegistry();
    const single = questionByFormat('single_best_answer');
    const multiple = questionByFormat('multiple_response');
    const matching = questionByFormat('matching');
    const ordering = questionByFormat('ordering');
    const attempt = makeAttempt([single.id, multiple.id, matching.id, ordering.id]);
    attempt.responses[single.id] = correctResponseFor(single);
    attempt.responses[multiple.id] = incorrectResponseFor(multiple);
    attempt.responses[matching.id] = incorrectResponseFor(matching);

    const report = gradeAssessmentAttempt({ attempt, registry });
    expect(report.ok).toBe(true);
    if (!report.ok) return;
    expect(report.value).toEqual(expect.objectContaining({
      status: 'complete',
      score: 1.333333,
      maxScore: 4,
      autoScore: 1.333333,
      correctCount: 1,
      partialCount: 1,
      incorrectCount: 1,
      unansweredCount: 1,
      manualRequiredCount: 0,
    }));
  });

  it('requires explicit policy for historical attempts and rejects locked-policy changes', () => {
    const registry = makeDraftRegistry();
    const historical = structuredClone(makeAttempt());
    delete historical.gradingPolicy;
    expect(codes(gradeAssessmentAttempt({ attempt: historical, registry })))
      .toContain('GRADING_POLICY_REQUIRED');
    expect(gradeAssessmentAttempt({
      attempt: historical,
      registry,
      policy: { id: 'strict', version: 1 },
    }).ok).toBe(true);

    expect(codes(gradeAssessmentAttempt({
      attempt: makeAttempt(),
      registry,
      policy: { id: 'strict', version: 1 },
    }))).toContain('GRADING_POLICY_MISMATCH');
  });

  it('rejects stale, ownership-mismatched, malformed, and missing data', () => {
    const registry = makeDraftRegistry();
    const questionId = registry.questionIds()[0];

    const stale = makeAttempt([questionId]);
    stale.questionVersions[questionId] += 1;
    expect(codes(gradeAssessmentAttempt({ attempt: stale, registry })))
      .toContain('QUESTION_VERSION_MISMATCH');

    const wrongCourse = makeAttempt([questionId]);
    wrongCourse.courseId = 'wrong-course';
    expect(codes(gradeAssessmentAttempt({ attempt: wrongCourse, registry })))
      .toContain('QUESTION_COURSE_MISMATCH');

    const wrongModule = makeAttempt([questionId]);
    wrongModule.moduleId = 'wrong-module';
    expect(codes(gradeAssessmentAttempt({ attempt: wrongModule, registry })))
      .toContain('QUESTION_MODULE_MISMATCH');

    const malformed = makeAttempt([questionId]);
    malformed.responses[questionId] = {
      format: 'single_best_answer',
      optionId: 'missing-option',
    } as PersistedResponse;
    expect(codes(gradeAssessmentAttempt({ attempt: malformed, registry })))
      .toContain('INVALID_PERSISTED_RESPONSE');

    const bank = makePilotBank();
    bank.questions = bank.questions.filter((question) => question.id !== questionId);
    const reduced = buildQuestionRegistry({
      banks: [bank],
      allowedReviewStatuses: ['draft'],
    });
    if (!reduced.ok) throw new Error('Reduced registry should build');
    expect(codes(gradeAssessmentAttempt({
      attempt: makeAttempt([questionId]),
      registry: reduced.value,
    }))).toContain('MISSING_QUESTION');
  });

  it('never mutates the attempt, registry question, or response', () => {
    const registry = makeDraftRegistry();
    const question = questionByFormat('matching');
    const attempt = makeAttempt([question.id]);
    attempt.responses[question.id] = incorrectResponseFor(question);
    const attemptBefore = structuredClone(attempt);
    const questionBefore = registry.get(question.id);

    expect(gradeAssessmentAttempt({ attempt, registry }).ok).toBe(true);
    expect(attempt).toEqual(attemptBefore);
    expect(registry.get(question.id)).toEqual(questionBefore);
  });
});
