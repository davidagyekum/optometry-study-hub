import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import { legacyRecentActivity } from '@/lib/progress/activity';
import {
  allLegacyCourseAnalytics,
  allLegacyModuleAnalytics,
} from '@/lib/progress/legacyAnalytics';
import { legacyRecommendations } from '@/lib/progress/recommendations';
import {
  displayDate,
  displayPercent,
  Metric,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import type { StoreV2 } from '@/lib/storage/schemas';
import type { ReactNode } from 'react';

export function ProgressHub({
  store,
  go,
  curatedPanel,
  curatedRecommendationPanel,
  curatedActivityPanel,
  curatedExperiences,
}: {
  store: StoreV2;
  curatedExperiences: readonly CuratedExperienceSummary[];
  go: GoToRoute;
  curatedPanel?: ReactNode;
  curatedRecommendationPanel?: ReactNode;
  curatedActivityPanel?: ReactNode;
}) {
  const courseAnalytics = allLegacyCourseAnalytics(store);
  const moduleAnalytics = allLegacyModuleAnalytics(store);
  const totalCompleted = moduleAnalytics.reduce((sum, item) => sum + item.readingCompleted, 0);
  const totalSections = moduleAnalytics.reduce((sum, item) => sum + item.readingTotal, 0);
  const savedResults = moduleAnalytics.reduce((sum, item) => sum + item.savedResultCount, 0);
  const activeSessions = moduleAnalytics.filter((item) => item.activeAttempt).length;
  const legacyActivity = legacyRecentActivity(store);
  const recommendation = legacyRecommendations(store)[0];
  const curatedEnabled = curatedExperiences.length > 0;
  return (
    <>
      <section className="hub-hero">
        <button className="back" onClick={() => go('home')}>← Home</button>
        <div><h1>Progress Hub</h1><p>Transparent browser-local progress, with legacy quiz and curated evidence kept separate.</p></div>
      </section>
      <section className="hub-section">
        <div className="analytics-metrics">
          <Metric label="Reading progress" value={`${totalCompleted}/${totalSections}`} detail={`${Math.round((totalCompleted / totalSections) * 100) || 0}% complete`} />
          <Metric label="Saved legacy results" value={savedResults} detail="Recent saved attempts, not lifetime attempts" />
          <Metric label="Active legacy sessions" value={activeSessions} detail="Curated sessions are reported separately when available" />
        </div>
        {curatedEnabled ? curatedRecommendationPanel : recommendation ? (
          <article className="recommendation">
            <div><span>Recommended next step</span><h2>{recommendation.title}</h2><p>{recommendation.reason}</p></div>
            <button className="primary" onClick={() => go(recommendation.destination.view, recommendation.destination.moduleId)}>Continue</button>
          </article>
        ) : null}
        {curatedPanel}
      </section>
      {!curatedEnabled && (Object.keys(store.assessment.activeAttempts).length || Object.keys(store.assessment.results).length) ? (
        <p className="integrity-note">Additional controlled-practice data is stored on this device, but that feature is currently disabled.</p>
      ) : null}
      <section className="hub-section">
        <div className="section-heading"><div><h2>Course progress</h2><p>Session averages are arithmetic means of safely readable saved percentages on this browser.</p></div></div>
        <div className="course-progress-grid">
          {courses.map((course, index) => {
            const analytics = courseAnalytics[index];
            const curatedExperience = curatedExperiences.find(
              (experience) => experience.courseId === course.id,
            );
            return (
              <article key={course.id}>
                <span className="course-code">{course.code}</span>
                <h3>{course.title}</h3>
                <div className="reading-line"><span>{analytics.readingCompleted}/{analytics.readingTotal} sections</span><b>{analytics.readingPercentage}%</b></div>
                <ProgressBar value={analytics.readingPercentage} label={`${course.title} reading progress`} />
                <p><strong>Active modules:</strong> {analytics.activeModuleCount}</p>
                <h4>Legacy quiz</h4>
                <dl className="compact-metrics">
                  <div><dt>Saved attempts</dt><dd>{analytics.savedResultCount}</dd></div>
                  <div><dt>Latest</dt><dd>{displayPercent(analytics.latestPercentage)}</dd></div>
                  <div><dt>Best</dt><dd>{displayPercent(analytics.bestPercentage)}</dd></div>
                  <div><dt>Recent average</dt><dd>{displayPercent(analytics.recentAveragePercentage)}</dd></div>
                </dl>
                {curatedExperience ? (
                  <div className="separate-score-note">
                    <h4>{curatedExperience.statusLabel}</h4>
                    <p>Verified evidence is shown in the separately labelled summary above.</p>
                  </div>
                ) : null}
                <button className="secondary" onClick={() => go('course', course.id)}>Open course</button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="hub-section">
        <div className="section-heading"><div><h2>All modules</h2><p>Detailed question-level analytics begin with curated practice.</p></div></div>
        <div className="module-progress-list">
          {modules.map((module, index) => {
            const analytics = moduleAnalytics[index];
            return (
              <article key={module.id}>
                <div><span className="course-code">{module.number}</span><h3>{module.title}</h3></div>
                <span>{analytics.readingPercentage}% read</span>
                <span>Latest {displayPercent(analytics.latestPercentage)}</span>
                <span>Best {displayPercent(analytics.bestPercentage)}</span>
                <span>{analytics.savedResultCount} saved</span>
                <span>{analytics.activeAttempt ? 'Active' : 'No active quiz'}</span>
                <button className="text-button" onClick={() => go('progress', module.id)}>View details</button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="hub-section">
        <div className="section-heading"><div><h2>Recent quiz and practice activity</h2><p>Reading completion is excluded because reading records have no timestamps.</p></div></div>
        {curatedEnabled ? curatedActivityPanel : legacyActivity.length ? (
          <div className="activity-list">{legacyActivity.map((item) => (
            <article key={item.id}>
              <div><strong>{item.label}</strong><span>{item.detail ?? moduleMap.get(item.moduleId)?.title}</span></div>
              <span>{displayDate(item.timestamp)}</span>
              <b>{displayPercent(item.scorePercentage)}</b>
              <button className="text-button" onClick={() => go(item.destination.view, item.destination.moduleId)}>{item.actionLabel}</button>
            </article>
          ))}</div>
        ) : <div className="empty-state"><h3>No saved activity yet</h3><p>Begin a quiz or practice session to build your browser-local activity.</p><button className="primary" onClick={() => go('practice-hub')}>Choose practice</button></div>}
      </section>
    </>
  );
}
