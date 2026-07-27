import { useState } from 'react';
import { HvpPracticeWarning } from '@/components/assessment/hvp/HvpPracticeWarning';
import { PilotActionAlert } from '@/components/assessment/pilot/PilotActionAlert';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { HvpAttemptSelection } from '@/lib/assessment/hvp/selectors';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

export function HvpPracticeLanding({
  attemptSelection,
  latestResult,
  go,
  onStart,
  onRestart,
  onDiscardCandidates,
  onReplaceCandidates,
}: {
  attemptSelection: HvpAttemptSelection;
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
    setActionState({ selectionKey, issues: result.ok ? [] : result.issues });
  };

  return (
    <div className="pilot-page">
      <button
        className="back"
        onClick={() => go('study', 'human-visual-perception')}
        type="button"
      >
        ← Human Visual Perception notes
      </button>
      <HvpPracticeWarning />
      <section className="pilot-landing">
        <div>
          <h1>Curated slide-aligned practice</h1>
          <p>
            Build a 50-question mixed-format practice set from 120 questions
            aligned with the OPT 374 foundations, retina, LGN/V1 and extrastriate slides.
          </p>
          <p>
            This private browser-only result is separate from the legacy quiz and
            does not affect its Latest or Best score.
          </p>
        </div>
        <dl className="pilot-facts">
          <div><dt>Question pool</dt><dd>120</dd></div>
          <div><dt>Practice set</dt><dd>50</dd></div>
          <div><dt>Mode</dt><dd>Study</dd></div>
          <div><dt>Grading</dt><dd>diagnostic@1</dd></div>
        </dl>
        {needsRecovery ? (
          <div className="pilot-recovery">
            <h2>Saved curated attempt needs attention</h2>
            <p>
              The incompatible snapshot remains on this device until you
              explicitly discard it or replace it atomically.
            </p>
            <div className="pilot-landing-actions">
              <button
                className="text-button danger"
                onClick={() => {
                  if (window.confirm('Discard the incompatible curated-practice attempt?')) {
                    run(() => onDiscardCandidates(candidateIds));
                  }
                }}
                type="button"
              >
                Discard saved attempt
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (window.confirm('Replace it with a fresh 50-question set?')) {
                    run(() => onReplaceCandidates(candidateIds));
                  }
                }}
                type="button"
              >
                Start a fresh practice
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
                  Resume curated practice
                </button>
                <button className="secondary" onClick={() => run(onRestart)} type="button">
                  Restart with a new set
                </button>
              </>
            ) : (
              <button className="primary" onClick={() => run(onStart)} type="button">
                Start curated practice
              </button>
            )}
            {latestResult ? (
              <button
                className="secondary"
                onClick={() => go('assessment-result', latestResult.id)}
                type="button"
              >
                Review latest curated result
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
