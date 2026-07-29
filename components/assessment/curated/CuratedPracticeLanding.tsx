import { useMemo, useState } from 'react';
import { PilotActionAlert } from '@/components/assessment/pilot/PilotActionAlert';
import type {
  CuratedAttemptSelection,
  CuratedAvailability,
  CuratedPracticeDefinition,
  CuratedPracticeRequest,
} from '@/lib/assessment/curated/definition';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

function toggle(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export function CuratedPracticeLanding({
  definition,
  attemptSelection,
  latestResult,
  latestWrittenResult,
  availability,
  go,
  onStart,
  onDiscardCandidates,
  onReplaceCandidates,
}: {
  definition: CuratedPracticeDefinition;
  attemptSelection: CuratedAttemptSelection;
  latestResult?: AssessmentResultSnapshot;
  latestWrittenResult?: AssessmentResultSnapshot;
  availability: CuratedAvailability;
  go: GoToRoute;
  onStart: (request?: CuratedPracticeRequest) => SessionResult<AssessmentAttemptSnapshot>;
  onDiscardCandidates: (candidateIds: string[]) => SessionResult<unknown>;
  onReplaceCandidates: (
    candidateIds: string[],
    request?: CuratedPracticeRequest,
  ) => SessionResult<AssessmentAttemptSnapshot>;
}) {
  const { learner, summary } = definition;
  const Status = learner.statusComponent;
  const selectionKey = JSON.stringify({
    candidateIds: attemptSelection.candidates.map((candidate) => candidate.id),
    issues: attemptSelection.issues,
  });
  const [actionState, setActionState] = useState({
    selectionKey,
    issues: attemptSelection.issues,
  });
  const [customCount, setCustomCount] = useState(learner.quickQuestionCount);
  const [customSections, setCustomSections] = useState<string[]>([...learner.sectionIds]);
  const [customFormats, setCustomFormats] = useState<string[]>([...learner.automaticFormats]);
  const [customDifficulties, setCustomDifficulties] = useState<string[]>([...learner.difficulties]);
  const actionIssues = actionState.selectionKey === selectionKey
    ? actionState.issues
    : attemptSelection.issues;
  const activeAttempt = attemptSelection.compatibleAttempt;
  const candidateIds = attemptSelection.candidates.map((candidate) => candidate.id);
  const needsRecovery = candidateIds.length > 0 && attemptSelection.issues.length > 0;
  const customValid = customCount >= learner.customMinimumCount && customCount <= learner.customMaximumCount
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
  const launch = (request: CuratedPracticeRequest) => {
    if (candidateIds.length) {
      if (window.confirm(`Replace the active ${summary.shortTitle} with this new session?`)) {
        run(() => onReplaceCandidates(candidateIds, request));
      }
      return;
    }
    run(() => onStart(request));
  };
  const label = (value: string) => learner.labels[value] ?? value;

  return (
    <div className="pilot-page">
      <button className="back" onClick={() => go('study', summary.moduleId)} type="button">
        ← {learner.notesLabel}
      </button>
      <Status />
      <section className="pilot-landing">
        <div>
          <h1>{learner.landingHeading}</h1>
          <p>{learner.landingDescription}</p>
          <p>{learner.fullContractDescription}</p>
        </div>
        <dl className="pilot-facts">
          <div><dt>Question pool</dt><dd>{learner.questionPoolSize}</dd></div>
          <div><dt>Scored formats</dt><dd>{learner.scoredFormatCount}</dd></div>
          <div><dt>Mode</dt><dd>Study</dd></div>
          <div><dt>History</dt><dd>Device only</dd></div>
        </dl>

        {needsRecovery ? (
          <div className="pilot-recovery">
            <h2>Saved {summary.shortTitle} needs attention</h2>
            <p>The snapshot remains on this device until you explicitly discard or replace it.</p>
            <div className="pilot-landing-actions">
              <button
                className="text-button danger"
                onClick={() => {
                  if (window.confirm(`Discard the incompatible ${summary.shortTitle} attempt?`)) {
                    run(() => onDiscardCandidates(candidateIds));
                  }
                }}
                type="button"
              >
                Discard saved attempt
              </button>
              <button
                className="primary"
                onClick={() => launch(definition.defaultRequest())}
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
                ? `${label(activeAttempt.practiceSelection.profileId)} · ${activeAttempt.orderedQuestionIds.length} questions`
                : `Full practice · ${activeAttempt.orderedQuestionIds.length} questions`}
            </p>
            <button className="primary" onClick={() => go('assessment', activeAttempt.id)} type="button">
              Resume current practice
            </button>
          </div>
        ) : null}

        <section className="practice-choice-section" aria-labelledby="practice-length">
          <h2 id="practice-length">Practice length</h2>
          <div className="practice-choice-grid">
            <button className="secondary" onClick={() => launch({ profileId: 'quick', strategy: 'mixed', requestedCount: learner.quickQuestionCount })} type="button">
              <strong>Quick practice</strong><span>{learner.quickQuestionCount} questions</span>
            </button>
            <button className="secondary" onClick={() => launch({ profileId: 'standard', strategy: 'mixed', requestedCount: learner.standardQuestionCount })} type="button">
              <strong>Standard practice</strong><span>{learner.standardQuestionCount} questions</span>
            </button>
            <button className="primary" onClick={() => launch(definition.defaultRequest())} type="button">
              <strong>Start curated practice</strong>
              <span>Full · {learner.fullQuestionCount} questions · recommended</span>
            </button>
          </div>
        </section>

        <section className="practice-choice-section" aria-labelledby="targeted-practice">
          <h2 id="targeted-practice">Targeted practice</h2>
          <p>Targeted sessions contain {learner.targetedQuestionCount} questions and never fabricate availability.</p>
          <div className="practice-choice-grid">
            {([
              ['unseen', 'Unseen questions', availability.unseen],
              ['retry-missed', 'Retry missed questions', availability.missed],
              ['weak-topics', 'Practice weak topics', availability.weakTopics],
              ['challenge', 'Challenge practice', availability.challenge],
            ] as const).map(([strategy, text, available]) => (
              <button
                className="secondary"
                disabled={available < learner.targetedQuestionCount}
                key={strategy}
                onClick={() => launch({
                  profileId: 'targeted',
                  strategy,
                  requestedCount: learner.targetedQuestionCount,
                })}
                type="button"
              >
                <strong>{text}</strong>
                <span>
                  {available >= learner.targetedQuestionCount
                    ? `${available} compatible available`
                    : `Complete more practice · ${available}/${learner.targetedQuestionCount} available`}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="practice-choice-section" aria-labelledby="custom-practice">
          <h2 id="custom-practice">Custom practice</h2>
          <label className="practice-count">
            Question count ({learner.customMinimumCount}–{learner.customMaximumCount})
            <input
              max={learner.customMaximumCount}
              min={learner.customMinimumCount}
              onChange={(event) => setCustomCount(Number(event.target.value))}
              type="number"
              value={customCount}
            />
          </label>
          {([
            ['Sections', learner.sectionIds, customSections, setCustomSections],
            ['Formats', learner.automaticFormats, customFormats, setCustomFormats],
            ['Difficulties', learner.difficulties, customDifficulties, setCustomDifficulties],
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
                    <span>{label(choice)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <p aria-live="polite">
            {customValid
              ? customSummary
              : `${`Select at least one option in every group and a count from ${learner.customMinimumCount} to ${learner.customMaximumCount}.`}`}
          </p>
          <button
            className="secondary"
            disabled={!customValid}
            onClick={() => launch({
              profileId: 'custom',
              strategy: 'custom',
              requestedCount: customCount,
              sectionIds: customSections,
              formats: customFormats as CuratedPracticeRequest['formats'],
              difficulties: customDifficulties as CuratedPracticeRequest['difficulties'],
            })}
            type="button"
          >
            Build Custom practice
          </button>
        </section>

        {summary.supportsWrittenPractice && learner.writtenQuestionCount ? (
          <section className="practice-choice-section" aria-labelledby="written-practice">
            <h2 id="written-practice">Written practice</h2>
            <p>
              Work through {learner.writtenQuestionCount} open-response prompts.
              Responses are saved locally and shown with rubrics, but are not
              automatically marked.
            </p>
            <button className="secondary" onClick={() => launch({ profileId: 'written', requestedCount: learner.writtenQuestionCount })} type="button">
              Open Written practice
            </button>
            {latestWrittenResult ? (
              <button className="text-button" onClick={() => go('assessment-result', latestWrittenResult.id)} type="button">
                Review latest written result
              </button>
            ) : null}
          </section>
        ) : null}

        <div className="pilot-landing-actions">
          {latestResult ? (
            <button className="secondary" onClick={() => go('assessment-result', latestResult.id)} type="button">
              Review latest curated result
            </button>
          ) : null}
        </div>
        {needsRecovery || actionIssues.length ? <PilotActionAlert issues={actionIssues} /> : null}
      </section>
    </div>
  );
}
