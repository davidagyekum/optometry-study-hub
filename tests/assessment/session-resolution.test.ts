import { describe, expect, it } from 'vitest';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';
import { resolveAssessmentAttempt } from '@/lib/assessment/session/resolveAttempt';
import type { AssessmentAttemptSnapshot } from '@/lib/storage/schemas';
import {
  makeAttempt,
  makeDraftRegistry,
  makePilotBank,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: ReturnType<typeof resolveAssessmentAttempt>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function changedAttempt(
  change: (attempt: AssessmentAttemptSnapshot) => void,
): AssessmentAttemptSnapshot {
  const attempt = makeAttempt();
  change(attempt);
  return attempt;
}

describe('persisted assessment-attempt resolution', () => {
  it('resolves a valid snapshot in persisted order without mutation', () => {
    const registry = makeDraftRegistry();
    const attempt = makeAttempt(undefined, { registry });
    const before = structuredClone(attempt);
    const result = resolveAssessmentAttempt(attempt, registry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.attempt).toBe(attempt);
    expect(result.value.questions.map((question) => question.id))
      .toEqual(attempt.orderedQuestionIds);
    expect(attempt).toEqual(before);
  });

  it('reports a missing registry question without silently repairing the snapshot', () => {
    const attempt = makeAttempt();
    const missingId = attempt.orderedQuestionIds[0];
    const bank = makePilotBank();
    bank.questions = bank.questions.filter((question) => question.id !== missingId);
    const built = buildQuestionRegistry({
      banks: [bank],
      allowedReviewStatuses: ['draft'],
    });
    if (!built.ok) throw new Error('Reduced registry should remain valid');
    const before = structuredClone(attempt);

    expect(codes(resolveAssessmentAttempt(attempt, built.value))).toContain('MISSING_QUESTION');
    expect(attempt).toEqual(before);
  });

  it('reports question version, course, and module mismatches', () => {
    const registry = makeDraftRegistry();
    const firstId = registry.questionIds()[0];
    expect(codes(resolveAssessmentAttempt(changedAttempt((attempt) => {
      attempt.questionVersions[firstId] += 1;
    }), registry))).toContain('QUESTION_VERSION_MISMATCH');
    expect(codes(resolveAssessmentAttempt(changedAttempt((attempt) => {
      attempt.courseId = 'wrong-course';
    }), registry))).toContain('QUESTION_COURSE_MISMATCH');
    expect(codes(resolveAssessmentAttempt(changedAttempt((attempt) => {
      attempt.moduleId = 'wrong-module';
    }), registry))).toContain('QUESTION_MODULE_MISMATCH');
  });

  it('rejects missing, duplicated, extra, and unexpected presentation order', () => {
    const registry = makeDraftRegistry();
    const shuffleableId = questionByFormat('single_best_answer').id;
    const noOrderId = questionByFormat('short_answer').id;

    for (const order of [undefined, ['trabecular-meshwork'], [
      'trabecular-meshwork',
      'trabecular-meshwork',
      'uveoscleral-route',
      'schlemm-canal',
    ]]) {
      const attempt = changedAttempt((candidate) => {
        if (order === undefined) delete candidate.optionOrder[shuffleableId];
        else candidate.optionOrder[shuffleableId] = order;
      });
      expect(codes(resolveAssessmentAttempt(attempt, registry)))
        .toContain('INVALID_OPTION_ORDER');
    }

    expect(codes(resolveAssessmentAttempt(changedAttempt((attempt) => {
      attempt.optionOrder[noOrderId] = ['unexpected'];
    }), registry))).toContain('INVALID_OPTION_ORDER');
  });

  it('reports invalid persisted responses, extra references, and invalid current index', () => {
    const registry = makeDraftRegistry();
    const questionId = questionByFormat('single_best_answer').id;
    const responseAttempt = changedAttempt((attempt) => {
      attempt.responses[questionId] = {
        format: 'single_best_answer',
        optionId: 'missing-option',
      };
    });
    expect(codes(resolveAssessmentAttempt(responseAttempt, registry)))
      .toContain('INVALID_PERSISTED_RESPONSE');

    const extraResponse = changedAttempt((attempt) => {
      attempt.responses['outside-question'] = {
        format: 'short_answer',
        text: 'answer',
      };
    });
    expect(codes(resolveAssessmentAttempt(extraResponse, registry)))
      .toContain('INVALID_PERSISTED_RESPONSE');

    const extraOrder = changedAttempt((attempt) => {
      attempt.optionOrder['outside-question'] = ['unexpected'];
    });
    expect(codes(resolveAssessmentAttempt(extraOrder, registry)))
      .toContain('INVALID_OPTION_ORDER');

    expect(codes(resolveAssessmentAttempt(changedAttempt((attempt) => {
      attempt.currentIndex = attempt.orderedQuestionIds.length;
    }), registry))).toContain('INVALID_CURRENT_INDEX');
  });
});
