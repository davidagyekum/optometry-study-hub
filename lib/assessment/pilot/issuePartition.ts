import type { SessionIssue } from '@/lib/assessment/session/types';

export type PartitionedPilotIssues = {
  rendererIssues: SessionIssue[];
  sessionIssues: SessionIssue[];
};

export function isRendererValidationIssue(issue: SessionIssue): boolean {
  return issue.code.startsWith('DRAFT_')
    || issue.code.startsWith('RESPONSE_')
    || issue.code === 'INVALID_DRAFT_RESPONSE'
    || issue.code === 'INVALID_PERSISTED_RESPONSE';
}

export function partitionPilotActionIssues(
  issues: SessionIssue[],
  originQuestionId?: string,
): PartitionedPilotIssues {
  return issues.reduce<PartitionedPilotIssues>(
    (partitioned, issue) => {
      if (
        isRendererValidationIssue(issue)
        && (issue.questionId === undefined || issue.questionId === originQuestionId)
      ) {
        partitioned.rendererIssues.push(issue);
      } else {
        partitioned.sessionIssues.push(issue);
      }
      return partitioned;
    },
    { rendererIssues: [], sessionIssues: [] },
  );
}