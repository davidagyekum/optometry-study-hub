import { courses } from '@/content/legacy/courseCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { legacyModuleAnalytics } from '@/lib/progress/legacyAnalytics';
import { legacyRecommendations } from '@/lib/progress/recommendations';
import {
  displayDate,
  displayPercent,
  Metric,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import type { Module } from '@/lib/legacy/types';
import type { StoreV2 } from '@/lib/storage/schemas';
import type { ReactNode } from 'react';

export function ModuleProgressView({
  module,
  store,
  go,
  startQuiz,
  curatedPanel,
}: {
  module: Module;
  store: StoreV2;
  go: GoToRoute;
  startQuiz: (module: Module) => void;
  curatedPanel?: ReactNode;
}) {
  const course = courses.find((item) => item.id === module.courseId)!;
  const analytics = legacyModuleAnalytics(module, store);
  const recommendation = legacyRecommendations(store).find((item) => item.moduleId === module.id);
  const recent = [...(store.results[module.id] ?? [])]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 8);
  return (
    <>
      <section className={`hub-hero ${module.tone}`}>
        <button className="back" onClick={() => go('progress')}>← Progress Hub</button>
        <div><span>{course.code}</span><h1>{module.title}</h1><p>Reading and legacy quiz progress for this module.</p></div>
      </section>
      <section className="hub-section">
        <div className="analytics-metrics">
          <Metric label="Reading" value={`${analytics.readingCompleted}/${analytics.readingTotal}`} detail={`${analytics.readingPercentage}% complete`} />
          <Metric label="Saved attempts" value={analytics.savedResultCount} detail="Up to 20 recent results" />
          <Metric label="Latest" value={displayPercent(analytics.latestPercentage)} />
          <Metric label="Best" value={displayPercent(analytics.bestPercentage)} />
          <Metric label="Recent average" value={displayPercent(analytics.recentAveragePercentage)} detail="Mean of saved session percentages" />
        </div>
        <ProgressBar value={analytics.readingPercentage} label={`${module.title} reading progress`} />
        {analytics.activeAttempt ? (
          <p className="active-note">Active legacy quiz: {analytics.activeAttempt.answeredCount}/50 answered, {analytics.activeAttempt.flaggedCount} flagged.</p>
        ) : null}
        {recommendation ? <article className="recommendation compact"><div><span>Recommended next action</span><h2>{recommendation.title}</h2><p>{recommendation.reason}</p></div></article> : null}
        <div className="card-actions wrap">
          <button className="secondary" onClick={() => go('study', module.id)}>Continue notes</button>
          <button className="primary small" onClick={() => startQuiz(module)}>{analytics.activeAttempt ? 'Resume legacy quiz' : 'Take legacy quiz'}</button>
          {analytics.latestResult ? <button className="text-button" onClick={() => go('results', module.id)}>Review latest legacy result</button> : null}
          <button className="text-button" onClick={() => go('course', course.id)}>Return to course</button>
        </div>
      </section>
      {curatedPanel}
      <section className="hub-section">
        <div className="section-heading"><div><h2>Recent legacy sessions</h2><p>Detailed question-level analytics begin with curated practice.</p></div></div>
        {recent.length ? <div className="activity-list">{recent.map((result) => (
          <article key={result.id}>
            <div><strong>Legacy quiz completed</strong><span>{result.score}/{result.total}</span></div>
            <span>{displayDate(result.submittedAt)}</span>
            <b>{displayPercent((result.score / result.total) * 100)}</b>
            <button className="text-button" onClick={() => go('results', module.id)}>Review latest</button>
          </article>
        ))}</div> : <div className="empty-state"><h3>No saved legacy results</h3><p>Take the 50-question quiz when you are ready.</p></div>}
      </section>
    </>
  );
}
