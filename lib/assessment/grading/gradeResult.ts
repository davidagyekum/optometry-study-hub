import {
  gradingFailure,
  gradingIssue,
} from '@/lib/assessment/grading/errors';
import { aggregateQuestionGrades } from '@/lib/assessment/grading/gradeAssessment';
import { gradeResponseForQuestion } from '@/lib/assessment/grading/gradeQuestion';
import { resolveSnapshotGradingPolicy } from '@/lib/assessment/grading/policyRegistry';
import type {
  AssessmentGradingReport,
  GradeAssessmentResultInput,
  GradingIssue,
  GradingResult,
  QuestionGradeOutcome,
} from '@/lib/assessment/grading/types';
import { assessmentResultSnapshotSchema } from '@/lib/storage/schemas';

export function gradeAssessmentResult({
  result,
  registry,
  policy: explicitPolicy,
}: GradeAssessmentResultInput): GradingResult<AssessmentGradingReport> {
  const parsedResult = assessmentResultSnapshotSchema.safeParse(result);
  if (!parsedResult.success) {
    return gradingFailure(parsedResult.error.issues.map((issue) => gradingIssue(
      'GRADING_RESULT_INVALID',
      issue.message,
      { attemptId: result.attemptId, path: issue.path.join('.') },
    )));
  }
  const validResult = parsedResult.data;
  const policy = resolveSnapshotGradingPolicy(
    validResult.gradingPolicy,
    explicitPolicy,
  );
  if (!policy.ok) {
    return gradingFailure(policy.issues.map((issue) => ({
      ...issue,
      attemptId: validResult.attemptId,
    })));
  }

  const issues: GradingIssue[] = [];
  const outcomes: QuestionGradeOutcome[] = [];
  for (const questionId of validResult.orderedQuestionIds) {
    const question = registry.get(questionId);
    if (!question) {
      issues.push(gradingIssue(
        'MISSING_QUESTION',
        `Persisted question "${questionId}" is missing from the registry.`,
        { attemptId: validResult.attemptId, questionId },
      ));
      continue;
    }
    if (validResult.questionVersions[questionId] !== question.version) {
      issues.push(gradingIssue(
        'QUESTION_VERSION_MISMATCH',
        `Persisted version for "${questionId}" does not match the registry.`,
        {
          attemptId: validResult.attemptId,
          questionId,
          path: `questionVersions.${questionId}`,
        },
      ));
    }
    if (question.courseId !== validResult.courseId) {
      issues.push(gradingIssue(
        'QUESTION_COURSE_MISMATCH',
        `Question "${questionId}" does not match the result course.`,
        { attemptId: validResult.attemptId, questionId, path: 'courseId' },
      ));
    }
    if (question.moduleId !== validResult.moduleId) {
      issues.push(gradingIssue(
        'QUESTION_MODULE_MISMATCH',
        `Question "${questionId}" does not match the result module.`,
        { attemptId: validResult.attemptId, questionId, path: 'moduleId' },
      ));
    }
    if (issues.some((issue) => issue.questionId === questionId)) continue;
    const graded = gradeResponseForQuestion({
      question,
      response: validResult.responses[questionId],
      policy: policy.value,
    });
    if (!graded.ok) {
      issues.push(...graded.issues.map((issue) => ({
        ...issue,
        attemptId: validResult.attemptId,
      })));
      continue;
    }
    outcomes.push(graded.value);
  }
  if (issues.length > 0) return gradingFailure(issues);
  return aggregateQuestionGrades(
    policy.value,
    validResult.orderedQuestionIds,
    outcomes,
  );
}
