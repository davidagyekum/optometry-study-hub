import { courses } from '@/content/legacy/courseCatalog';
import {
  displayDate,
  displayPercent,
  Metric,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import type { GoToRoute } from '@/hooks/useClientRoute';
import {
  legacyModuleAnalytics,
  safeLegacyPercentage,
} from '@/lib/progress/legacyAnalytics';
import type { Module } from '@/lib/legacy/types';
import type { StoreV2 } from '@/lib/storage/schemas';
import type { ReactNode } from 'react';

export function ModuleProgressView({
  module,
  store,
  go,
  curatedPanel,
}: {
  module: Module;
  store: StoreV2;
  go: GoToRoute;
  curatedPanel?: ReactNode;
}) {
  const course = courses.find((item) => item.id === module.courseId)!;
  const analytics = legacyModuleAnalytics(module, store);
  const recent = (store.results[module.id] ?? []).slice(0, 8);
  const latestId = store.results[module.id]?.[0]?.id;
  const hasPreviousHistory = Boolean(analytics.activeAttempt || recent.length);

  return (
    <>
      <section className={`hub-hero ${module.tone}`}>
        <button className="back" onClick={() => go('progress')}>Back to Progress Hub</button>
        <div>
          <span>{course.code}</span>
          <h1>{module.title}</h1>
          <p>Current curated progress and separately retained previous quiz history.</p>
        </div>
      </section>
      {curatedPanel}
      {hasPreviousHistory ? (
        <section className="hub-section previous-history-section">
          <details open>
            <summary>Previous quiz history</summary>
            <p>These earlier scores are compatibility records and are not combined with curated practice.</p>
            <div className="analytics-metrics">
              <Metric label="Reading" value={`${analytics.readingCompleted}/${analytics.readingTotal}`} detail={`${analytics.readingPercentage}% complete`} />
              <Metric label="Saved previous results" value={analytics.savedResultCount} detail="Up to 20 retained results" />
              <Metric label="Previous latest" value={displayPercent(analytics.latestPercentage)} />
              <Metric label="Previous best" value={displayPercent(analytics.bestPercentage)} />
              <Metric label="Previous recent average" value={displayPercent(analytics.recentAveragePercentage)} detail="Mean of valid retained percentages" />
            </div>
            <ProgressBar value={analytics.readingPercentage} label={`${module.title} reading progress`} />
            {analytics.activeAttempt ? (
              <p className="active-note">Previous active quiz: {analytics.activeAttempt.answeredCount}/50 answered, {analytics.activeAttempt.flaggedCount} flagged.</p>
            ) : null}
            <div className="card-actions wrap">
              <button className="secondary" onClick={() => go('study', module.id)}>Continue notes</button>
              {analytics.activeAttempt ? (
                <button className="primary small" onClick={() => go('quiz', module.id)}>Resume previous quiz</button>
              ) : null}
              {analytics.latestResult ? (
                <button className="text-button" onClick={() => go('results', module.id)}>Review previous result</button>
              ) : null}
              <button className="text-button" onClick={() => go('legacy', module.id)}>Open previous quiz history</button>
              <button className="text-button" onClick={() => go('course', course.id)}>Return to course</button>
            </div>
          </details>
        </section>
      ) : null}
      {recent.length ? (
        <section className="hub-section previous-history-section">
          <div className="section-heading">
            <div>
              <h2>Recent previous quiz results</h2>
              <p>Older retained items remain stored; the latest result opens exact answer review.</p>
            </div>
          </div>
          <div className="activity-list">{recent.map((result) => {
            const isLatest = result.id === latestId;
            return (
              <article key={result.id}>
                <div><strong>Previous quiz completed</strong><span>{Number.isFinite(result.score) && Number.isFinite(result.total) && result.total > 0 ? `${result.score}/${result.total}` : 'Score unavailable'}</span></div>
                <span>{displayDate(result.submittedAt)}</span>
                <b>{displayPercent(safeLegacyPercentage(result))}</b>
                <button
                  className="text-button"
                  onClick={() => go(isLatest ? 'results' : 'legacy', module.id)}
                >
                  {isLatest ? 'Review previous result' : 'View previous history'}
                </button>
              </article>
            );
          })}</div>
        </section>
      ) : null}
    </>
  );
}
