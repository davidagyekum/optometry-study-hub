import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { gradeAssessmentAttempt } from '@/lib/assessment/grading/gradeAssessment';
import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';
import {
  addCorrectResponses,
  correctResponseFor,
  incorrectResponseFor,
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

function finalize(
  attempt: ReturnType<typeof makeAttempt>,
  id = 'result-regrade',
) {
  return finalizeGradedAssessmentAttempt({
    attempt,
    registry: makeDraftRegistry(),
    now: () => new Date('2026-07-26T14:00:00.000Z'),
    idFactory: () => id,
  });
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

  it('regrades a real persisted grading snapshot to the exact canonical report', () => {
    const question = questionByFormat('matching');
    const attempt = makeAttempt([question.id]);
    attempt.responses[question.id] = incorrectResponseFor(question);
    const finalized = finalize(attempt);
    if (!finalized.ok) throw new Error('Graded result should finalize');
    const before = structuredClone(finalized.value.result);
    const regraded = gradeAssessmentResult({
      result: finalized.value.result,
      registry: makeDraftRegistry(),
    });
    expect(regraded).toEqual({ ok: true, value: finalized.value.report });
    expect(finalized.value.result).toEqual(before);
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

  it('rejects a coherent false correct snapshot after its response changes', () => {
    const question = questionByFormat('single_best_answer');
    const attempt = makeAttempt([question.id]);
    attempt.responses[question.id] = correctResponseFor(question);
    const finalized = finalize(attempt, 'result-false-correct');
    if (!finalized.ok) throw new Error('Correct result should finalize');
    const tampered = structuredClone(finalized.value.result);
    tampered.responses[question.id] = incorrectResponseFor(question);
    expect(codes(gradeAssessmentResult({
      result: tampered,
      registry: makeDraftRegistry(),
    }))).toContain('GRADING_SNAPSHOT_MISMATCH');
  });

  it('rejects a coherent but tampered partial grading snapshot', () => {
    const question = questionByFormat('matching');
    const attempt = makeAttempt([question.id]);
    attempt.responses[question.id] = incorrectResponseFor(question);
    const finalized = finalize(attempt, 'result-partial-tamper');
    if (!finalized.ok || !finalized.value.result.grading) {
      throw new Error('Partial result should finalize with grading');
    }
    const tampered = structuredClone(finalized.value.result);
    if (!tampered.grading) throw new Error('Expected grading snapshot');
    const grade = tampered.grading.questionGrades[question.id];
    grade.correctParts = 2;
    grade.totalParts = 3;
    grade.score = 0.666667;
    tampered.grading.autoScore = 0.666667;
    tampered.grading.score = 0.666667;
    tampered.score = 0.666667;
    expect(codes(gradeAssessmentResult({
      result: tampered,
      registry: makeDraftRegistry(),
    }))).toContain('GRADING_SNAPSHOT_MISMATCH');
  });

  it('rejects a canonical report copied from another response set', () => {
    const question = questionByFormat('single_best_answer');
    const correctAttempt = makeAttempt([question.id]);
    correctAttempt.responses[question.id] = correctResponseFor(question);
    const incorrectAttempt = makeAttempt([question.id]);
    incorrectAttempt.responses[question.id] = incorrectResponseFor(question);
    const correct = finalize(correctAttempt, 'result-correct-source');
    const incorrect = finalize(incorrectAttempt, 'result-incorrect-target');
    if (!correct.ok || !incorrect.ok || !correct.value.result.grading) {
      throw new Error('Both source results should finalize');
    }
    const tampered = structuredClone(incorrect.value.result);
    tampered.grading = structuredClone(correct.value.result.grading);
    tampered.score = correct.value.result.score;
    tampered.maxScore = correct.value.result.maxScore;
    expect(codes(gradeAssessmentResult({
      result: tampered,
      registry: makeDraftRegistry(),
    }))).toContain('GRADING_SNAPSHOT_MISMATCH');
  });

  it('surfaces persisted policy and question-version drift', () => {
    const question = questionByFormat('matching');
    const attempt = makeAttempt([question.id]);
    attempt.responses[question.id] = incorrectResponseFor(question);
    const finalized = finalize(attempt, 'result-drift');
    if (!finalized.ok || !finalized.value.result.grading) {
      throw new Error('Graded result should finalize');
    }

    const policyDrift = structuredClone(finalized.value.result);
    if (!policyDrift.grading) throw new Error('Expected grading');
    policyDrift.grading.policy = { id: 'strict', version: 1 };
    expect(codes(gradeAssessmentResult({
      result: policyDrift,
      registry: makeDraftRegistry(),
    }))).toContain('GRADING_RESULT_INVALID');

    const versionDrift = structuredClone(finalized.value.result);
    versionDrift.questionVersions[question.id] += 1;
    if (!versionDrift.grading) throw new Error('Expected grading');
    versionDrift.grading.questionGrades[question.id].questionVersion += 1;
    expect(codes(gradeAssessmentResult({
      result: versionDrift,
      registry: makeDraftRegistry(),
    }))).toContain('QUESTION_VERSION_MISMATCH');
  });
});
