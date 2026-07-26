import type {
  SessionIssue,
  SessionIssueCode,
  SessionResult,
} from '@/lib/assessment/session/types';

export type SessionIssueContext = Omit<SessionIssue, 'code' | 'message'>;

export function sessionIssue(
  code: SessionIssueCode,
  message: string,
  context: SessionIssueContext = {},
): SessionIssue {
  return { code, message, ...context };
}

export function sessionSuccess<T>(value: T): SessionResult<T> {
  return { ok: true, value };
}

export function sessionFailure<T = never>(
  issueOrIssues: SessionIssue | SessionIssue[],
): SessionResult<T> {
  return {
    ok: false,
    issues: Array.isArray(issueOrIssues) ? issueOrIssues : [issueOrIssues],
  };
}
