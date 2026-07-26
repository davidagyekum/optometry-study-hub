import { useState } from 'react';
import { PilotActionAlert } from '@/components/assessment/pilot/PilotActionAlert';
import { PilotWarning } from '@/components/assessment/pilot/PilotWarning';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { SessionIssue, SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

export function AssessmentPilotLanding({
  activeAttempt,
  latestResult,
  go,
  onStart,
  onRestart,
  initialIssues = [],
}: {
  activeAttempt?: AssessmentAttemptSnapshot;
  latestResult?: AssessmentResultSnapshot;
  go: GoToRoute;
  onStart: () => SessionResult<AssessmentAttemptSnapshot>;
  onRestart: () => SessionResult<AssessmentAttemptSnapshot>;
  initialIssues?: SessionIssue[];
}) {
  const [actionIssues, setActionIssues] = useState<SessionIssue[]>(initialIssues);
  const run = (action: () => SessionResult<AssessmentAttemptSnapshot>) => {
    const result = action();
    setActionIssues(result.ok ? [] : result.issues);
  };

  return (
    <div className="pilot-page">
      <button className="back" onClick={() => go('study', 'aqueous-vitreous')} type="button">
        ← Aqueous and Vitreous notes
      </button>
      <PilotWarning />
      <section className="pilot-landing">
        <div>
          <h1>Aqueous and Vitreous assessment pilot</h1>
          <p>
            Try nine draft questions using single and multiple selection,
            ordering, matching, diagrams, short answer, and an open response.
          </p>
        </div>
        <dl className="pilot-facts">
          <div><dt>Questions</dt><dd>9</dd></div>
          <div><dt>Mode</dt><dd>Study</dd></div>
          <div><dt>Grading</dt><dd>diagnostic@1</dd></div>
          <div><dt>Storage</dt><dd>This browser only</dd></div>
        </dl>
        <div className="pilot-landing-actions">
          {activeAttempt ? (
            <>
              <button
                className="primary"
                onClick={() => go('assessment', activeAttempt.id)}
                type="button"
              >
                Resume pilot
              </button>
              <button className="secondary" onClick={() => run(onRestart)} type="button">
                Restart pilot
              </button>
            </>
          ) : (
            <button className="primary" onClick={() => run(onStart)} type="button">
              Start pilot
            </button>
          )}
          {latestResult ? (
            <button
              className="secondary"
              onClick={() => go('assessment-result', latestResult.id)}
              type="button"
            >
              Review latest pilot result
            </button>
          ) : null}
        </div>
        <PilotActionAlert issues={actionIssues} />
      </section>
    </div>
  );
}