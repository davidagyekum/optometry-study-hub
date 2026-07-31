'use client';

import { modules } from '@/content/legacy/moduleCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import { displayDate, displayPercent } from '@/components/progress/ProgressPrimitives';
import { legacyModuleAnalytics } from '@/lib/progress/legacyAnalytics';
import type { StoreV2 } from '@/lib/storage/schemas';

export function LegacyArchive({
  moduleId,
  store,
  go,
  curatedExperiences,
}: {
  moduleId?: string;
  store: StoreV2;
  go: GoToRoute;
  curatedExperiences: readonly CuratedExperienceSummary[];
}) {
  const visibleModules = moduleId
    ? modules.filter((module) => module.id === moduleId)
    : modules;

  return (
    <>
      <section className="hub-hero">
        <button className="back" onClick={() => go('practice-hub')} type="button">
          Back to Practice Hub
        </button>
        <div>
          <span className="course-code">READ-ONLY COMPATIBILITY</span>
          <h1>Previous quiz history</h1>
          <p>
            Earlier active attempts and submitted results remain available on
            this device. New sessions start only from course-aligned curated practice.
          </p>
        </div>
      </section>
      <section className="hub-section">
        <div className="practice-module-grid">
          {visibleModules.map((module) => {
            const analytics = legacyModuleAnalytics(module, store);
            const latest = analytics.latestResult;
            const curated = curatedExperiences.find(
              (experience) => experience.moduleId === module.id,
            );
            const hasHistory = Boolean(analytics.activeAttempt || latest);
            return (
              <article className="practice-module-card" key={module.id}>
                <span className="course-code">{module.number}</span>
                <h2>{module.title}</h2>
                {hasHistory ? (
                  <>
                    <p>Previous 50-question quiz activity retained on this device.</p>
                    <dl className="compact-metrics">
                      <div><dt>Previous latest</dt><dd>{displayPercent(analytics.latestPercentage)}</dd></div>
                      <div><dt>Previous best</dt><dd>{displayPercent(analytics.bestPercentage)}</dd></div>
                      <div><dt>Saved results</dt><dd>{analytics.savedResultCount}</dd></div>
                      <div><dt>Previous activity</dt><dd>{latest ? displayDate(latest.submittedAt) : 'None'}</dd></div>
                    </dl>
                  </>
                ) : (
                  <p className="history-count">No previous quiz activity on this device.</p>
                )}
                <div className="card-actions wrap">
                  {analytics.activeAttempt ? (
                    <button
                      className="primary small"
                      onClick={() => go('quiz', module.id)}
                      type="button"
                    >
                      Resume previous quiz
                    </button>
                  ) : null}
                  {latest ? (
                    <button className="text-button" onClick={() => go('results', module.id)} type="button">
                      Review previous results
                    </button>
                  ) : null}
                  {curated ? (
                    <button className="secondary" onClick={() => go('practice', curated.routeSegment)} type="button">
                      Practice this module
                    </button>
                  ) : null}
                  <button className="text-button" onClick={() => go('study', module.id)} type="button">
                    Read notes
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
