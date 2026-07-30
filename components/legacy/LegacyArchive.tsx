import { modules } from '@/content/legacy/moduleCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { displayDate, displayPercent } from '@/components/progress/ProgressPrimitives';
import { legacyModuleAnalytics } from '@/lib/progress/legacyAnalytics';
import type { Module } from '@/lib/legacy/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export function LegacyArchive({
  moduleId,
  store,
  go,
  startQuiz,
}: {
  moduleId?: string;
  store: StoreV2;
  go: GoToRoute;
  startQuiz: (module: Module) => void;
}) {
  const visibleModules = moduleId
    ? modules.filter((module) => module.id === moduleId)
    : modules;

  return (
    <>
      <section className="hub-hero">
        <button className="back" onClick={() => go('practice-hub')} type="button">
          ← Practice Hub
        </button>
        <div>
          <span className="course-code">COMPATIBILITY ARCHIVE</span>
          <h1>Legacy quiz archive</h1>
          <p>
            The original 50-question quizzes remain available for saved-attempt
            recovery and historical comparison. Curated practice is the
            recommended assessment path.
          </p>
        </div>
      </section>
      <section className="hub-section">
        <div className="practice-module-grid">
          {visibleModules.map((module) => {
            const analytics = legacyModuleAnalytics(module, store);
            const latest = analytics.latestResult;
            return (
              <article className="practice-module-card" key={module.id}>
                <span className="course-code">{module.number}</span>
                <h2>{module.title}</h2>
                <p>Frozen legacy generator · 50 shuffled single-best-answer questions</p>
                <dl className="compact-metrics">
                  <div><dt>Latest</dt><dd>{displayPercent(analytics.latestPercentage)}</dd></div>
                  <div><dt>Best</dt><dd>{displayPercent(analytics.bestPercentage)}</dd></div>
                  <div><dt>Saved results</dt><dd>{analytics.savedResultCount}</dd></div>
                  <div><dt>Latest activity</dt><dd>{latest ? displayDate(latest.submittedAt) : '—'}</dd></div>
                </dl>
                <div className="card-actions wrap">
                  <button
                    className={analytics.activeAttempt ? 'primary small' : 'secondary'}
                    onClick={() => startQuiz(module)}
                    type="button"
                  >
                    {analytics.activeAttempt ? 'Resume legacy quiz' : 'Start legacy quiz'}
                  </button>
                  {latest ? (
                    <button className="text-button" onClick={() => go('results', module.id)} type="button">
                      Legacy results/history
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
