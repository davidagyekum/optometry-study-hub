import {
  gradingFailure,
  gradingIssue,
  gradingSuccess,
} from '@/lib/assessment/grading/errors';
import { gradeAssessmentAttempt } from '@/lib/assessment/grading/gradeAssessment';
import { assessmentGradingReportSchema } from '@/lib/assessment/grading/schemas';
import type {
  AssessmentGradingReport,
  FinalizeGradedAssessmentAttemptInput,
  FinalizeGradedAssessmentAttemptOutput,
  GradingResult,
} from '@/lib/assessment/grading/types';
import { finalizeAssessmentAttempt } from '@/lib/assessment/session/finalizeAttempt';
import {
  assessmentResultSnapshotSchema,
  type AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

export function attachGradingSnapshot(
  result: AssessmentResultSnapshot,
  report: unknown,
): GradingResult<AssessmentResultSnapshot> {
  const parsedReport = assessmentGradingReportSchema.safeParse(report);
  if (!parsedReport.success) {
    return gradingFailure(parsedReport.error.issues.map((issue) => gradingIssue(
      'GRADING_REPORT_INVALID',
      issue.message,
      { attemptId: result.attemptId, path: issue.path.join('.') },
    )));
  }
  const candidate: AssessmentResultSnapshot = {
    ...structuredClone(result),
    grading: {
      schemaVersion: 1,
      ...structuredClone(parsedReport.data),
    },
  };
  const parsedResult = assessmentResultSnapshotSchema.safeParse(candidate);
  return parsedResult.success
    ? gradingSuccess(parsedResult.data)
    : gradingFailure(parsedResult.error.issues.map((issue) => gradingIssue(
      'GRADING_RESULT_INVALID',
      issue.message,
      { attemptId: result.attemptId, path: issue.path.join('.') },
    )));
}

export function finalizeGradedAssessmentAttempt({
  attempt,
  registry,
  now,
  idFactory,
}: FinalizeGradedAssessmentAttemptInput): GradingResult<FinalizeGradedAssessmentAttemptOutput> {
  const graded = gradeAssessmentAttempt({ attempt, registry });
  if (!graded.ok) return graded;
  const report: AssessmentGradingReport = graded.value;
  const finalized = finalizeAssessmentAttempt({
    attempt,
    evaluation: report.status === 'complete'
      ? { score: report.score, maxScore: report.maxScore }
      : { score: null, maxScore: null },
    ...(now ? { now } : {}),
    ...(idFactory ? { idFactory } : {}),
  });
  if (!finalized.ok) return gradingFailure(finalized.issues);
  const attached = attachGradingSnapshot(finalized.value, report);
  return attached.ok
    ? gradingSuccess({ result: attached.value, report })
    : attached;
}
