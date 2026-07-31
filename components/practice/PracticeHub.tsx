import { modules } from '@/content/legacy/moduleCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { hiddenCuratedData } from '@/lib/assessment/curated/storedData';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import type { StoreV2 } from '@/lib/storage/schemas';
import type { ReactNode } from 'react';

export function PracticeHub({
  store,
  go,
  curatedPanel,
  curatedResumePanel,
  curatedExperiences,
  allCuratedExperiences = curatedExperiences,
}: {
  store: StoreV2;
  go: GoToRoute;
  curatedPanel?: ReactNode;
  curatedResumePanel?: ReactNode;
  curatedExperiences: readonly CuratedExperienceSummary[];
  allCuratedExperiences?: readonly CuratedExperienceSummary[];
}) {
  const activeLegacy = modules.filter((module) => store.active[module.id]);
  const curatedBlueprintIds = new Set(
    curatedExperiences.flatMap((experience) => experience.blueprintIds),
  );
  const controlledCount = Object.values(store.assessment.activeAttempts).filter(
    (attempt) => curatedBlueprintIds.has(attempt.blueprintId ?? ''),
  ).length;
  const curatedEnabled = curatedExperiences.length > 0;
  const legacyHistoryModuleCount = modules.filter((module) => (
    Boolean(store.active[module.id]) || (store.results[module.id] ?? []).length > 0
  )).length;
  const hidden = hiddenCuratedData(store, allCuratedExperiences);
  const hasHidden = hidden.activeAttemptCount + hidden.resultCount > 0;
  return (
    <>
      <section className="hub-hero">
        <button className="back" onClick={() => go('home')}>← Home</button>
        <div>
          <h1>Practice Hub</h1>
          <p>Choose course-aligned curated practice or resume saved work. Progress stays on this device.</p>
        </div>
      </section>
      {(activeLegacy.length || (curatedEnabled && controlledCount)) ? (
        <section className="hub-section">
          <div className="section-heading">
            <div><h2>Resume active sessions</h2><p>Your position and answers are saved on this browser.</p></div>
          </div>
          <div className="resume-list">
            {activeLegacy.map((module) => {
              const active = store.active[module.id]!;
              return (
                <article key={active.id}>
                  <div><strong>{module.title}</strong><span>Previous quiz / {Object.keys(active.answers).length}/50 answered / {active.flags.length} flagged</span></div>
                  <button className="primary small" onClick={() => go('quiz', module.id)}>Resume previous quiz</button>
                </article>
              );
            })}
            {curatedResumePanel}
          </div>
        </section>
      ) : null}
      {curatedEnabled && curatedPanel ? (
        <section className="hub-section">
          <div className="section-heading">
            <div><h2>Curated practice</h2><p>Course-aligned practice, current-version progress and saved sessions.</p></div>
          </div>
          {curatedPanel}
        </section>
      ) : null}
      <section className="hub-section previous-history-entry">
        <div className="section-heading">
          <div>
            <h2>Previous quiz history</h2>
            <p>Earlier attempts and results remain readable for compatibility. No new previous quiz can be started.</p>
          </div>
          <button className="secondary" onClick={() => go('legacy')} type="button">
            Open previous quiz history
          </button>
        </div>
        <p className="history-count">
          {legacyHistoryModuleCount
            ? legacyHistoryModuleCount + ' module' + (legacyHistoryModuleCount === 1 ? '' : 's') + ' with previous activity.'
            : 'No previous quiz activity on this device.'}
        </p>
      </section>
      {hasHidden ? (
        <p className="integrity-note">
          Saved controlled-practice data for a currently disabled curated
          module remains on this device. It was not deleted or migrated.
        </p>
      ) : null}
      <section className="privacy-panel">
        <div><h2>Private by design</h2><p>Practice records remain in this browser. No account, leaderboard, telemetry or cross-device synchronization is used.</p></div>
      </section>
    </>
  );
}
