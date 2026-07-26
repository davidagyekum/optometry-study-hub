import type { SessionIssue } from '@/lib/assessment/session/types';

export function PilotActionAlert({
  issues,
  title = 'The action could not be completed.',
}: {
  issues: SessionIssue[];
  title?: string;
}) {
  if (issues.length === 0) return null;
  return (
    <div className="pilot-action-alert" role="alert">
      <strong>{title}</strong>
      <p>Your saved pilot work has been preserved. You can correct the issue or try again.</p>
      <details>
        <summary>Technical details</summary>
        <ul>
          {issues.map((issue) => (
            <li key={`${issue.code}-${issue.path ?? issue.message}`}>
              <code>{issue.code}</code>: {issue.message}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
