import { describe, expect, it } from 'vitest';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { finalizeAssessmentAttempt } from '@/lib/assessment/session/finalizeAttempt';
import * as registryModule from '@/lib/assessment/session/registry';
import { setAttemptResponse } from '@/lib/assessment/session/attemptActions';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateResponseForQuestion } from '@/lib/assessment/session/responseValidation';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
import {
  FIXED_NOW,
  PILOT_COURSE_ID,
  PILOT_MODULE_ID,
  fixedRandom,
  makeApprovedPilotBank,
  makeAttempt,
  makeDraftRegistry,
  makePilotBank,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('validated question-registry boundary', () => {
  it('has no public runtime constructor and returns deterministic defensive copies', () => {
    expect('QuestionRegistry' in registryModule).toBe(false);
    const bank = makeApprovedPilotBank();
    const built = registryModule.buildQuestionRegistry({ banks: [bank] });
    if (!built.ok) throw new Error('Approved registry should build');

    const questionId = 'aqueous-flow-sba-001';
    const first = built.value.lookup(questionId);
    const second = built.value.lookup(questionId);
    if (!first.ok || !second.ok) throw new Error('Question should resolve');
    expect(second.value).toEqual(first.value);
    expect(second.value).not.toBe(first.value);
    expect(second.value.question).not.toBe(first.value.question);

    bank.questions[0].reviewStatus = 'draft';
    (first.value as { courseId: string }).courseId = 'mutated-course';
    (first.value as { moduleId: string }).moduleId = 'mutated-module';
    (first.value as { version: number }).version = 99;
    first.value.question.reviewStatus = 'draft';
    const singleBest = first.value.question.format === 'single_best_answer'
      ? first.value.question
      : undefined;
    if (!singleBest) throw new Error('Expected single-best-answer fixture');
    singleBest.options[0].id = 'mutated-option';
    (built.value.bankIds as string[]).push('mutated-bank');

    const afterMutation = built.value.getEntry(questionId);
    const directQuestion = built.value.get(questionId);
    if (!directQuestion || directQuestion.format !== 'single_best_answer') {
      throw new Error('Expected direct single-best-answer lookup');
    }
    directQuestion.options[0].id = 'directly-mutated-option';

    expect(afterMutation).toMatchObject({
      courseId: PILOT_COURSE_ID,
      moduleId: PILOT_MODULE_ID,
      version: 1,
      reviewStatus: 'approved',
    });
    expect(afterMutation?.question.reviewStatus).toBe('approved');
    expect(
      afterMutation?.question.format === 'single_best_answer'
        ? afterMutation.question.options[0].id
        : undefined,
    ).not.toBe('mutated-option');
    const freshDirectQuestion = built.value.get(questionId);
    expect(
      freshDirectQuestion?.format === 'single_best_answer'
        ? freshDirectQuestion.options[0].id
        : undefined,
    ).not.toBe('directly-mutated-option');
    expect(built.value.bankIds).toEqual(['aqueous-vitreous-approved']);
  });

  it('does not let returned status or option mutations bypass later session creation', () => {
    const built = registryModule.buildQuestionRegistry({
      banks: [makePilotBank()],
      allowedReviewStatuses: ['draft'],
    });
    if (!built.ok) throw new Error('Draft registry should build');
    const questionId = 'aqueous-flow-sba-001';
    const returned = built.value.getEntry(questionId);
    if (!returned || returned.question.format !== 'single_best_answer') {
      throw new Error('Expected single-best-answer fixture');
    }
    (returned as { reviewStatus: string }).reviewStatus = 'approved';
    returned.question.reviewStatus = 'approved';
    returned.question.options[0].id = 'mutated-option';

    const rejected = createAssessmentAttempt({
      registry: built.value,
      questionIds: [questionId],
      mode: 'study',
      courseId: PILOT_COURSE_ID,
      moduleId: PILOT_MODULE_ID,
      random: fixedRandom(),
      now: () => FIXED_NOW,
      idFactory: () => 'attempt-registry-boundary',
    });
    expect(codes(rejected)).toContain('QUESTION_NOT_ELIGIBLE');

    const accepted = createAssessmentAttempt({
      registry: built.value,
      questionIds: [questionId],
      mode: 'study',
      courseId: PILOT_COURSE_ID,
      moduleId: PILOT_MODULE_ID,
      allowedReviewStatuses: ['draft'],
      random: fixedRandom(),
      now: () => FIXED_NOW,
      idFactory: () => 'attempt-registry-boundary',
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.value.optionOrder[questionId]).not.toContain('mutated-option');
  });
});

describe('defensive attempt mutation and finalization boundaries', () => {
  it.each([
    ['QUESTION_VERSION_MISMATCH', (attempt: ReturnType<typeof makeAttempt>, questionId: string) => {
      attempt.questionVersions[questionId] += 1;
    }],
    ['QUESTION_COURSE_MISMATCH', (attempt: ReturnType<typeof makeAttempt>) => {
      attempt.courseId = 'different-course';
    }],
    ['QUESTION_MODULE_MISMATCH', (attempt: ReturnType<typeof makeAttempt>) => {
      attempt.moduleId = 'different-module';
    }],
  ])('rejects stale response writes with %s and preserves the source', (expected, mutate) => {
    const registry = makeDraftRegistry();
    const question = questionByFormat('single_best_answer');
    const attempt = makeAttempt([question.id]);
    mutate(attempt, question.id);
    const before = structuredClone(attempt);

    const result = setAttemptResponse(attempt, registry, question.id, {
      format: 'single_best_answer',
      optionId: 'trabecular-meshwork',
    });
    expect(codes(result)).toContain(expected);
    expect(attempt).toEqual(before);
  });

  it('validates the attempt before finalization and rejects non-string factory values', () => {
    const malformed = makeAttempt();
    malformed.currentIndex = malformed.orderedQuestionIds.length;
    expect(codes(finalizeAssessmentAttempt({
      attempt: malformed,
      evaluation: { score: null, maxScore: null },
      idFactory: () => 'result-never-created',
    }))).toContain('INVALID_ATTEMPT_SNAPSHOT');

    expect(codes(finalizeAssessmentAttempt({
      attempt: makeAttempt(),
      evaluation: { score: null, maxScore: null },
      idFactory: (() => 42) as unknown as () => string,
    }))).toContain('INVALID_RESULT_ID');
  });

  it('rejects a non-string attempt ID factory value', () => {
    const questionId = makeDraftRegistry().questionIds()[0];
    const result = createAssessmentAttempt({
      registry: makeDraftRegistry(),
      questionIds: [questionId],
      mode: 'study',
      courseId: PILOT_COURSE_ID,
      moduleId: PILOT_MODULE_ID,
      allowedReviewStatuses: ['draft'],
      random: fixedRandom(),
      now: () => FIXED_NOW,
      idFactory: (() => 42) as unknown as () => string,
    });
    expect(codes(result)).toContain('INVALID_ATTEMPT_ID');
  });
});

describe('image-label answerability contract', () => {
  it('rejects duplicate authored correct-label values', () => {
    const bank = makePilotBank();
    const question = bank.questions.find((item) => item.format === 'image_label');
    if (!question) throw new Error('Expected image-label fixture');
    question.correctLabels['iris-target'] = question.correctLabels['cornea-target'];
    expect(validateQuestionBank(bank).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'DUPLICATE_CORRECT_LABEL_ID' }),
    );
  });

  it('keeps every valid image-label answer representable and the pilot warning-free', () => {
    const bank = makePilotBank();
    const validated = validateQuestionBank(bank);
    expect(validated.diagnostics).toEqual([]);
    expect(lintQuestionBank(bank)).toEqual([]);
    bank.questions
      .filter((question) => question.format === 'image_label')
      .forEach((question) => {
        expect(validateResponseForQuestion(question, {
          format: 'image_label',
          matches: question.correctLabels,
        })).toEqual({
          ok: true,
          value: {
            response: {
              format: 'image_label',
              matches: question.correctLabels,
            },
          },
        });
      });
  });
});
