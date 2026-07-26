import {
  gradingFailure,
  gradingIssue,
  gradingSuccess,
} from '@/lib/assessment/grading/errors';
import { gradeResponseForQuestion } from '@/lib/assessment/grading/gradeQuestion';
import { resolveSnapshotGradingPolicy } from '@/lib/assessment/grading/policyRegistry';
import {
  questionGradeContribution,
  roundGradingScore,
} from '@/lib/assessment/grading/scoreContribution';
import { assessmentGradingReportSchema } from '@/lib/assessment/grading/schemas';
import type {
  AssessmentGradingReport,
  GradeAssessmentAttemptInput,
  GradingPolicyReference,
  GradingResult,
  QuestionGradeOutcome,
} from '@/lib/assessment/grading/types';
import { resolveAssessmentAttempt } from '@/lib/assessment/session/resolveAttempt';
import { assessmentAttemptSnapshotSchema } from '@/lib/storage/schemas';

export function aggregateQuestionGrades(
  policy: GradingPolicyReference,
  orderedQuestionIds: string[],
  outcomes: QuestionGradeOutcome[],
): GradingResult<AssessmentGradingReport> {
  if (
    outcomes.length !== orderedQuestionIds.length
    || outcomes.some((outcome, index) => outcome.questionId !== orderedQuestionIds[index])
  ) {
    return gradingFailure(gradingIssue(
      'GRADING_REPORT_INVALID',
      'Question-grade outcomes must exactly follow the assessment question order.',
      { path: 'questionGrades' },
    ));
  }
  const questionGrades: Record<string, QuestionGradeOutcome> = {};
  outcomes.forEach((outcome) => {
    questionGrades[outcome.questionId] = structuredClone(outcome);
  });
  const numeric = outcomes
    .map((outcome) => ({
      outcome,
      contribution: questionGradeContribution(outcome),
    }))
    .filter((entry) => entry.contribution !== null);
  const autoScore = roundGradingScore(
    numeric.reduce((sum, entry) => sum + (entry.contribution ?? 0), 0),
  );
  const autoMaxScore = numeric.reduce(
    (sum, entry) => sum + entry.outcome.maxScore,
    0,
  );
  const manualRequiredCount = outcomes.filter(
    (outcome) => outcome.status === 'manual_required',
  ).length;
  const report: AssessmentGradingReport = {
    policy: { ...policy },
    status: manualRequiredCount > 0 ? 'manual_required' : 'complete',
    questionGrades,
    score: manualRequiredCount > 0 ? null : autoScore,
    maxScore: manualRequiredCount > 0 ? null : autoMaxScore,
    autoScore,
    autoMaxScore,
    correctCount: outcomes.filter((outcome) => outcome.status === 'correct').length,
    partialCount: outcomes.filter((outcome) => outcome.status === 'partial').length,
    incorrectCount: outcomes.filter((outcome) => outcome.status === 'incorrect').length,
    unansweredCount: outcomes.filter((outcome) => outcome.status === 'unanswered').length,
    manualRequiredCount,
  };
  const parsed = assessmentGradingReportSchema.safeParse(report);
  return parsed.success
    ? gradingSuccess(parsed.data)
    : gradingFailure(parsed.error.issues.map((issue) => gradingIssue(
      'GRADING_REPORT_INVALID',
      issue.message,
      { path: issue.path.join('.') },
    )));
}

export function gradeAssessmentAttempt({
  attempt,
  registry,
  policy: explicitPolicy,
}: GradeAssessmentAttemptInput): GradingResult<AssessmentGradingReport> {
  const parsedAttempt = assessmentAttemptSnapshotSchema.safeParse(attempt);
  if (!parsedAttempt.success) {
    return gradingFailure(parsedAttempt.error.issues.map((issue) => gradingIssue(
      'GRADING_ATTEMPT_INVALID',
      issue.message,
      { attemptId: attempt.id, path: issue.path.join('.') },
    )));
  }
  const validAttempt = parsedAttempt.data;
  const policy = resolveSnapshotGradingPolicy(
    validAttempt.gradingPolicy,
    explicitPolicy,
  );
  if (!policy.ok) {
    return gradingFailure(policy.issues.map((issue) => ({
      ...issue,
      attemptId: validAttempt.id,
    })));
  }
  const resolved = resolveAssessmentAttempt(validAttempt, registry);
  if (!resolved.ok) {
    return gradingFailure(resolved.issues.map((issue) => ({ ...issue })));
  }

  const outcomes: QuestionGradeOutcome[] = [];
  for (const question of resolved.value.questions) {
    const graded = gradeResponseForQuestion({
      question,
      response: validAttempt.responses[question.id],
      policy: policy.value,
    });
    if (!graded.ok) {
      return gradingFailure(graded.issues.map((issue) => ({
        ...issue,
        attemptId: validAttempt.id,
      })));
    }
    outcomes.push(graded.value);
  }
  return aggregateQuestionGrades(
    policy.value,
    validAttempt.orderedQuestionIds,
    outcomes,
  );
}
