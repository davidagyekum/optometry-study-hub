import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { hiddenCuratedData } from '@/lib/assessment/curated/storedData';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import { legacyModuleAnalytics } from '@/lib/progress/legacyAnalytics';
import { displayPercent, ProgressBar } from '@/components/progress/ProgressPrimitives';
import type { Module } from '@/lib/legacy/types';
import type { StoreV2 } from '@/lib/storage/schemas';
import type { ReactNode } from 'react';

export function PracticeHub({
  store,
  go,
  startQuiz,
  curatedPanel,
  curatedResumePanel,
  curatedExperiences,
  allCuratedExperiences = curatedExperiences,
}: {
  store: StoreV2;
  go: GoToRoute;
  startQuiz: (module: Module) => void;
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
  const hidden = hiddenCuratedData(store, allCuratedExperiences);
  const hasHidden = hidden.activeAttemptCount + hidden.resultCount > 0;
  return (
    <>
      <section className="hub-hero">
        <button className="back" onClick={() => go('home')}>← Home</button>
        <div>
          <h1>Practice Hub</h1>
          <p>Resume saved work or choose a module. Legacy quizzes and curated practice stay visibly separate.</p>
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
                  <div><strong>{module.title}</strong><span>{Object.keys(active.answers).length}/50 answered · {active.flags.length} flagged</span></div>
                  <button className="primary small" onClick={() => go('quiz', module.id)}>Resume quiz</button>
                </article>
              );
            })}
            {curatedResumePanel}
          </div>
        </section>
      ) : null}
      <section className="hub-section">
        <div className="section-heading">
          <div><h2>Module practice</h2><p>Legacy quizzes contain 50 shuffled questions and retain up to 20 recent saved results per module.</p></div>
        </div>
        <div className="practice-module-grid">
          {modules.map((module) => {
            const course = courses.find((item) => item.id === module.courseId)!;
            const analytics = legacyModuleAnalytics(module, store);
            return (
              <article className="practice-module-card" key={module.id}>
                <span className="course-code">{course.code}</span>
                <h3>{module.title}</h3>
                <div className="reading-line"><span>Reading</span><b>{analytics.readingPercentage}%</b></div>
                <ProgressBar value={analytics.readingPercentage} label={`${module.title} reading progress`} />
                <dl className="compact-metrics">
                  <div><dt>Latest</dt><dd>{displayPercent(analytics.latestPercentage)}</dd></div>
                  <div><dt>Best</dt><dd>{displayPercent(analytics.bestPercentage)}</dd></div>
                  <div><dt>Saved attempts</dt><dd>{analytics.savedResultCount}</dd></div>
                </dl>
                <div className="card-actions wrap">
                  <button className="secondary" onClick={() => go('study', module.id)}>Read notes</button>
                  <button className="primary small" onClick={() => startQuiz(module)}>
                    {analytics.activeAttempt ? 'Resume quiz' : 'Take quiz'}
                  </button>
                  {analytics.latestResult ? (
                    <button className="text-button" onClick={() => go('results', module.id)}>Review latest</button>
                  ) : null}
                  <button className="text-button" onClick={() => go('progress', module.id)}>View progress</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {curatedEnabled && curatedPanel ? (
        <section className="hub-section">
          <div className="section-heading">
            <div><h2>Curated practice</h2><p>Verified current-version evidence stays separate from legacy quiz scores.</p></div>
          </div>
          {curatedPanel}
        </section>
      ) : null}
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
