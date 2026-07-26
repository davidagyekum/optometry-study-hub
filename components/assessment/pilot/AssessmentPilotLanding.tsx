import { useState } from 'react';
import { PilotActionAlert } from '@/components/assessment/pilot/PilotActionAlert';
import { PilotWarning } from '@/components/assessment/pilot/PilotWarning';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { AqueousPilotAttemptSelection } from '@/lib/assessment/pilot/selectors';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

export function AssessmentPilotLanding({
  attemptSelection,
  latestResult,
  go,
  onStart,
  onRestart,
  onDiscardCandidates,
  onReplaceCandidates,
}: {
  attemptSelection: AqueousPilotAttemptSelection;
  latestResult?: AssessmentResultSnapshot;
  go: GoToRoute;
  onStart: () => SessionResult<AssessmentAttemptSnapshot>;
  onRestart: () => SessionResult<AssessmentAttemptSnapshot>;
  onDiscardCandidates: (candidateIds: string[]) => SessionResult<unknown>;
  onReplaceCandidates: (
    candidateIds: string[],
  ) => SessionResult<AssessmentAttemptSnapshot>;
}) {
  const selectionKey = JSON.stringify({
    candidateIds: attemptSelection.candidates.map((candidate) => candidate.id),
    issues: attemptSelection.issues,
  });
  const [actionState, setActionState] = useState({
    selectionKey,
    issues: attemptSelection.issues,
  });
  const actionIssues = actionState.selectionKey === selectionKey
    ? actionState.issues
    : attemptSelection.issues;

  const activeAttempt = attemptSelection.compatibleAttempt;
  const candidateIds = attemptSelection.candidates.map((candidate) => candidate.id);
  const needsRecovery = candidateIds.length > 0 && attemptSelection.issues.length > 0;
  const run = <T,>(action: () => SessionResult<T>) => {
    const result = action();
    setActionState({
      selectionKey,
      issues: result.ok ? [] : result.issues,
    });
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
        {needsRecovery ? (
          <div className="pilot-recovery">
            <h2>Saved pilot attempt needs attention</h2>
            <p>
              The incompatible pilot snapshot is still saved. Discard it or
              replace all saved pilot candidates atomically with a fresh pilot.
            </p>
            <div className="pilot-landing-actions">
              <button
                className="text-button danger"
                onClick={() => {
                  if (window.confirm('Discard the incompatible saved pilot attempt?')) {
                    run(() => onDiscardCandidates(candidateIds));
                  }
                }}
                type="button"
              >
                Discard saved pilot
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (window.confirm('Replace the incompatible pilot with a fresh attempt?')) {
                    run(() => onReplaceCandidates(candidateIds));
                  }
                }}
                type="button"
              >
                Start a fresh pilot
              </button>
            </div>
          </div>
        ) : (
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
        )}
        {needsRecovery || actionIssues.length > 0 ? (
          <PilotActionAlert issues={actionIssues} />
        ) : null}
      </section>
    </div>
  );
}
