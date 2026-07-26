import type {
  GradingIssue,
  GradingIssueCode,
  GradingResult,
} from '@/lib/assessment/grading/types';

export type GradingIssueContext = Omit<GradingIssue, 'code' | 'message'>;

export function gradingIssue(
  code: GradingIssueCode,
  message: string,
  context: GradingIssueContext = {},
): GradingIssue {
  return { code, message, ...context };
}

export function gradingSuccess<T>(value: T): GradingResult<T> {
  return { ok: true, value };
}

export function gradingFailure<T = never>(
  issueOrIssues: GradingIssue | GradingIssue[],
): GradingResult<T> {
  return {
    ok: false,
    issues: Array.isArray(issueOrIssues) ? issueOrIssues : [issueOrIssues],
  };
}
