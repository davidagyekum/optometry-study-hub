import { describe, expect, it } from 'vitest';
import { gradeAssessmentAttempt } from '@/lib/assessment/grading/gradeAssessment';
import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';
import {
  addCorrectResponses,
  correctResponseFor,
} from '@/tests/fixtures/grading';
import {
  makeAttempt,
  makeDraftRegistry,
  makePilotBank,
  makeResult,
  questionByFormat,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('stored assessment-result regrading', () => {
  it('reproduces attempt grading exactly without mutating the result', () => {
    const registry = makeDraftRegistry();
    const attempt = addCorrectResponses(makeAttempt(), registry, true);
    const result = makeResult(attempt);
    const before = structuredClone(result);
    const attemptReport = gradeAssessmentAttempt({ attempt, registry });
    const resultReport = gradeAssessmentResult({ result, registry });
    expect(resultReport).toEqual(attemptReport);
    expect(result).toEqual(before);
  });

  it('ignores stored selection order for set-based grading', () => {
    const registry = makeDraftRegistry();
    const question = questionByFormat('multiple_response');
    const attempt = makeAttempt([question.id], { mode: 'exam' });
    attempt.responses[question.id] = correctResponseFor(question);
    const result = makeResult(attempt);
    const report = gradeAssessmentResult({ result, registry });
    expect(report.ok && report.value.score).toBe(1);
  });

  it('requires explicit policy only for historical results without a lock', () => {
    const result = makeResult();
    delete result.gradingPolicy;
    expect(codes(gradeAssessmentResult({ result, registry: makeDraftRegistry() })))
      .toContain('GRADING_POLICY_REQUIRED');
    expect(gradeAssessmentResult({
      result,
      registry: makeDraftRegistry(),
      policy: { id: 'strict', version: 1 },
    }).ok).toBe(true);
  });

  it('rejects version mismatches, missing questions, and policy disagreement', () => {
    const registry = makeDraftRegistry();
    const result = makeResult();
    const questionId = result.orderedQuestionIds[0];
    result.questionVersions[questionId] += 1;
    expect(codes(gradeAssessmentResult({ result, registry })))
      .toContain('QUESTION_VERSION_MISMATCH');

    const cleanResult = makeResult();
    const bank = makePilotBank();
    bank.questions = bank.questions.filter(
      (question) => question.id !== cleanResult.orderedQuestionIds[0],
    );
    const reduced = buildQuestionRegistry({
      banks: [bank],
      allowedReviewStatuses: ['draft'],
    });
    if (!reduced.ok) throw new Error('Reduced registry should build');
    expect(codes(gradeAssessmentResult({ result: cleanResult, registry: reduced.value })))
      .toContain('MISSING_QUESTION');

    expect(codes(gradeAssessmentResult({
      result: cleanResult,
      registry,
      policy: { id: 'strict', version: 1 },
    }))).toContain('GRADING_POLICY_MISMATCH');
  });
});
