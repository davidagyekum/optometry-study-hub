import { useMemo, useState } from 'react';
import { HvpPracticeWarning } from '@/components/assessment/hvp/HvpPracticeWarning';
import { PilotActionAlert } from '@/components/assessment/pilot/PilotActionAlert';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type {
  HvpPracticeRequest,
} from '@/hooks/useHvpCuratedPractice';
import {
  HVP_AUTOMATIC_FORMATS,
  HVP_DIFFICULTIES,
  HVP_SECTIONS,
} from '@/lib/assessment/hvp/practiceBlueprint';
import type { HvpAttemptSelection } from '@/lib/assessment/hvp/selectors';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

const LABELS: Record<string, string> = {
  'hvp-foundations': 'Foundations',
  'hvp-retina': 'Retina',
  'hvp-lgn': 'LGN and V1',
  'hvp-extrastriate': 'Extrastriate',
  single_best_answer: 'Single best answer',
  multiple_response: 'Multiple response',
  matching: 'Matching',
  extended_matching: 'Extended matching',
  ordering: 'Ordering',
  image_hotspot: 'Image hotspot',
  image_label: 'Image label',
  short_answer: 'Short answer',
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function toggle(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export function HvpPracticeLanding({
  attemptSelection,
  latestResult,
  latestWrittenResult,
  availability,
  go,
  onStart,
  onDiscardCandidates,
  onReplaceCandidates,
}: {
  attemptSelection: HvpAttemptSelection;
  latestResult?: AssessmentResultSnapshot;
  latestWrittenResult?: AssessmentResultSnapshot;
  availability: { unseen: number; missed: number; weakTopics: number; challenge: number };
  go: GoToRoute;
  onStart: (request?: HvpPracticeRequest) => SessionResult<AssessmentAttemptSnapshot>;
  onDiscardCandidates: (candidateIds: string[]) => SessionResult<unknown>;
  onReplaceCandidates: (
    candidateIds: string[],
    request?: HvpPracticeRequest,
  ) => SessionResult<AssessmentAttemptSnapshot>;
}) {
  const selectionKey = JSON.stringify({
    candidateIds: attemptSelection.candidates.map((candidate) => candidate.id),
    issues: attemptSelection.issues,
  });
  const [actionState, setActionState] = useState({ selectionKey, issues: attemptSelection.issues });
  const [customCount, setCustomCount] = useState(10);
  const [customSections, setCustomSections] = useState<string[]>(HVP_SECTIONS);
  const [customFormats, setCustomFormats] = useState<string[]>(HVP_AUTOMATIC_FORMATS);
  const [customDifficulties, setCustomDifficulties] = useState<string[]>(HVP_DIFFICULTIES);
  const actionIssues = actionState.selectionKey === selectionKey
    ? actionState.issues
    : attemptSelection.issues;
  const activeAttempt = attemptSelection.compatibleAttempt;
  const candidateIds = attemptSelection.candidates.map((candidate) => candidate.id);
  const needsRecovery = candidateIds.length > 0 && attemptSelection.issues.length > 0;
  const customValid = customCount >= 5 && customCount <= 50
    && customSections.length > 0
    && customFormats.length > 0
    && customDifficulties.length > 0;
  const customSummary = useMemo(() => (
    `${customCount} questions · ${customSections.length} sections · ${customFormats.length} formats · ${customDifficulties.length} difficulties`
  ), [customCount, customSections, customFormats, customDifficulties]);

  const run = <T,>(action: () => SessionResult<T>) => {
    const result = action();
    setActionState({ selectionKey, issues: result.ok ? [] : result.issues });
  };
  const launch = (request: HvpPracticeRequest) => {
    if (candidateIds.length) {
      if (window.confirm('Replace the active HVP practice with this new session?')) {
        run(() => onReplaceCandidates(candidateIds, request));
      }
      return;
    }
    run(() => onStart(request));
  };

  return (
    <div className="pilot-page">
      <button className="back" onClick={() => go('study', 'human-visual-perception')} type="button">
        ← Human Visual Perception notes
      </button>
      <HvpPracticeWarning />
      <section className="pilot-landing">
        <div>
          <h1>Curated slide-aligned practice</h1>
          <p>
            Choose a deterministic session length or target revision using
            history stored only on this device.
          </p>
          <p>Full practice preserves the exact PR #9 50-question contract.</p>
        </div>
        <dl className="pilot-facts">
          <div><dt>Question pool</dt><dd>120</dd></div>
          <div><dt>Scored formats</dt><dd>8</dd></div>
          <div><dt>Mode</dt><dd>Study</dd></div>
          <div><dt>History</dt><dd>Device only</dd></div>
        </dl>

        {needsRecovery ? (
          <div className="pilot-recovery">
            <h2>Saved HVP practice needs attention</h2>
            <p>The snapshot remains on this device until you explicitly discard or replace it.</p>
            <div className="pilot-landing-actions">
              <button
                className="text-button danger"
                onClick={() => {
                  if (window.confirm('Discard the incompatible HVP practice attempt?')) {
                    run(() => onDiscardCandidates(candidateIds));
                  }
                }}
                type="button"
              >
                Discard saved attempt
              </button>
              <button
                className="primary"
                onClick={() => launch({ profileId: 'full', strategy: 'mixed', requestedCount: 50 })}
                type="button"
              >
                Replace with Full practice
              </button>
            </div>
          </div>
        ) : activeAttempt ? (
          <div className="pilot-recovery">
            <h2>Practice in progress</h2>
            <p>
              {activeAttempt.practiceSelection
                ? `${LABELS[activeAttempt.practiceSelection.profileId] ?? activeAttempt.practiceSelection.profileId} · ${activeAttempt.orderedQuestionIds.length} questions`
                : 'Legacy Full practice · 50 questions'}
            </p>
            <button className="primary" onClick={() => go('assessment', activeAttempt.id)} type="button">
              Resume current practice
            </button>
          </div>
        ) : null}

        <section className="practice-choice-section" aria-labelledby="practice-length">
          <h2 id="practice-length">Practice length</h2>
          <div className="practice-choice-grid">
            <button className="secondary" onClick={() => launch({ profileId: 'quick', strategy: 'mixed', requestedCount: 10 })} type="button">
              <strong>Quick practice</strong><span>10 questions</span>
            </button>
            <button className="secondary" onClick={() => launch({ profileId: 'standard', strategy: 'mixed', requestedCount: 25 })} type="button">
              <strong>Standard practice</strong><span>25 questions</span>
            </button>
            <button className="primary" onClick={() => launch({ profileId: 'full', strategy: 'mixed', requestedCount: 50 })} type="button">
              <strong>Start curated practice</strong><span>Full · 50 questions · recommended</span>
            </button>
          </div>
        </section>

        <section className="practice-choice-section" aria-labelledby="targeted-practice">
          <h2 id="targeted-practice">Targeted practice</h2>
          <p>Targeted sessions contain 10 questions and never fabricate availability.</p>
          <div className="practice-choice-grid">
            {([
              ['unseen', 'Unseen questions', availability.unseen],
              ['retry-missed', 'Retry missed questions', availability.missed],
              ['weak-topics', 'Practice weak topics', availability.weakTopics],
              ['challenge', 'Challenge practice', availability.challenge],
            ] as const).map(([strategy, label, available]) => (
              <button
                className="secondary"
                disabled={available < 10}
                key={strategy}
                onClick={() => launch({ profileId: 'targeted', strategy, requestedCount: 10 })}
                type="button"
              >
                <strong>{label}</strong>
                <span>{available >= 10 ? `${available} compatible available` : `Complete more practice · ${available}/10 available`}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="practice-choice-section" aria-labelledby="custom-practice">
          <h2 id="custom-practice">Custom practice</h2>
          <label className="practice-count">
            Question count (5–50)
            <input
              max={50}
              min={5}
              onChange={(event) => setCustomCount(Number(event.target.value))}
              type="number"
              value={customCount}
            />
          </label>
          {([
            ['Sections', HVP_SECTIONS, customSections, setCustomSections],
            ['Formats', HVP_AUTOMATIC_FORMATS, customFormats, setCustomFormats],
            ['Difficulties', HVP_DIFFICULTIES, customDifficulties, setCustomDifficulties],
          ] as const).map(([legend, choices, selected, setter]) => (
            <fieldset className="practice-filter-group" key={legend}>
              <legend>{legend}</legend>
              <div>
                {choices.map((choice) => (
                  <label key={choice}>
                    <input
                      checked={selected.includes(choice)}
                      onChange={() => setter(toggle([...selected], choice))}
                      type="checkbox"
                    />
                    <span>{LABELS[choice] ?? choice}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <p aria-live="polite">{customValid ? customSummary : 'Select at least one option in every group and a count from 5 to 50.'}</p>
          <button
            className="secondary"
            disabled={!customValid}
            onClick={() => launch({
              profileId: 'custom',
              strategy: 'custom',
              requestedCount: customCount,
              sectionIds: customSections,
              formats: customFormats as HvpPracticeRequest['formats'],
              difficulties: customDifficulties as HvpPracticeRequest['difficulties'],
            })}
            type="button"
          >
            Build Custom practice
          </button>
        </section>

        <section className="practice-choice-section" aria-labelledby="written-practice">
          <h2 id="written-practice">Written practice</h2>
          <p>
            Work through the two canonical open-response prompts. Responses are
            saved locally and shown with rubrics, but are not automatically marked.
          </p>
          <button className="secondary" onClick={() => launch({ profileId: 'written', requestedCount: 2 })} type="button">
            Open Written practice
          </button>
          {latestWrittenResult ? (
            <button className="text-button" onClick={() => go('assessment-result', latestWrittenResult.id)} type="button">
              Review latest written result
            </button>
          ) : null}
        </section>

        <div className="pilot-landing-actions">
          {latestResult ? (
            <button className="secondary" onClick={() => go('assessment-result', latestResult.id)} type="button">
              Review latest curated result
            </button>
          ) : null}
        </div>
        {needsRecovery || actionIssues.length > 0 ? <PilotActionAlert issues={actionIssues} /> : null}
      </section>
    </div>
  );
}
