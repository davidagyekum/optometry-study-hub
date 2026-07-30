'use client';

import type { ReactNode } from 'react';
import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import {
  curatedExperienceRegistry,
} from '@/lib/assessment/curated/experienceRegistry';
import { hiddenCuratedData } from '@/lib/assessment/curated/storedData';
import type {
  CuratedExperienceAdapter,
  CuratedExperienceSummary,
} from '@/lib/assessment/curated/types';
import {
  displayDate,
  displayPercent,
  Metric,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { useCuratedProgressContributions } from '@/hooks/useCuratedProgressContributions';
import {
  legacyRecentActivity,
  mergeProgressActivity,
} from '@/lib/progress/activity';
import {
  allLegacyCourseAnalytics,
  allLegacyModuleAnalytics,
} from '@/lib/progress/legacyAnalytics';
import {
  legacyRecommendations,
  selectRecommendation,
} from '@/lib/progress/recommendations';
import type {
  ProgressActivity,
  ProgressRecommendation,
} from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

function RecommendationCard({
  item,
  go,
}: {
  item: ProgressRecommendation;
  go: GoToRoute;
}) {
  return (
    <article className="recommendation">
      <div>
        <span>Recommended next step</span>
        <h2>{item.title}</h2>
        <p>{item.reason}</p>
      </div>
      <button
        className="primary"
        onClick={() => go(item.destination.view, item.destination.moduleId)}
        type="button"
      >
        Continue
      </button>
    </article>
  );
}

function ActivityList({
  items,
  go,
}: {
  items: ProgressActivity[];
  go: GoToRoute;
}) {
  return (
    <div className="activity-list">
      {items.map((item) => {
        const written = item.kind === 'written-started'
          || item.kind === 'written-completed';
        return (
          <article key={item.id}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.detail ?? moduleMap.get(item.moduleId)?.title ?? item.moduleId}</span>
            </div>
            <span>{displayDate(item.timestamp)}</span>
            <b>{written ? 'Not scored' : displayPercent(item.scorePercentage)}</b>
            <button
              className="text-button"
              onClick={() => go(item.destination.view, item.destination.moduleId)}
              type="button"
            >
              {item.actionLabel}
            </button>
          </article>
        );
      })}
    </div>
  );
}

export function ProgressHub({
  store,
  go,
  curatedPanel,
  curatedExperiences,
  allCuratedExperiences = curatedExperiences,
  curatedRegistry = curatedExperienceRegistry,
  curatedRecommendationPanel,
  curatedActivityPanel,
}: {
  store: StoreV2;
  curatedExperiences: readonly CuratedExperienceSummary[];
  allCuratedExperiences?: readonly CuratedExperienceSummary[];
  curatedRegistry?: readonly CuratedExperienceAdapter[];
  go: GoToRoute;
  curatedPanel?: ReactNode;
  /** @deprecated Global decisions are coordinated by ProgressHub. */
  curatedRecommendationPanel?: ReactNode;
  /** @deprecated Global activity is coordinated by ProgressHub. */
  curatedActivityPanel?: ReactNode;
}) {
  const courseAnalytics = allLegacyCourseAnalytics(store);
  const moduleAnalytics = allLegacyModuleAnalytics(store);
  const totalCompleted = moduleAnalytics.reduce(
    (sum, item) => sum + item.readingCompleted,
    0,
  );
  const totalSections = moduleAnalytics.reduce(
    (sum, item) => sum + item.readingTotal,
    0,
  );
  const savedResults = moduleAnalytics.reduce(
    (sum, item) => sum + item.savedResultCount,
    0,
  );
  const activeSessions = moduleAnalytics.filter((item) => item.activeAttempt).length;
  const legacyCandidates = legacyRecommendations(store);
  const legacyActivity = legacyRecentActivity(store, Number.POSITIVE_INFINITY);
  const contributionState = useCuratedProgressContributions(curatedRegistry, store);
  const recommendation = contributionState.loading
    ? undefined
    : selectRecommendation([
      ...legacyCandidates,
      ...contributionState.contributions.flatMap(
        (contribution) => contribution.recommendationCandidates,
      ),
    ]);
  const activity = contributionState.loading
    ? []
    : mergeProgressActivity(
      legacyActivity,
      contributionState.contributions.flatMap(
        (contribution) => contribution.activity,
      ),
      8,
    );
  const hidden = hiddenCuratedData(store, allCuratedExperiences);
  const hasHidden = hidden.activeAttemptCount + hidden.resultCount > 0;

  return (
    <>
      <section className="hub-hero">
        <button className="back" onClick={() => go('home')}>← Home</button>
        <div>
          <h1>Progress Hub</h1>
          <p>Transparent browser-local progress, with legacy quiz and curated evidence kept separate.</p>
        </div>
      </section>
      <section className="hub-section">
        <div className="analytics-metrics">
          <Metric
            label="Reading progress"
            value={`${totalCompleted}/${totalSections}`}
            detail={`${Math.round((totalCompleted / totalSections) * 100) || 0}% complete`}
          />
          <Metric
            label="Saved legacy results"
            value={savedResults}
            detail="Recent saved attempts, not lifetime attempts"
          />
          <Metric
            label="Active legacy sessions"
            value={activeSessions}
            detail="Curated sessions are reported separately when available"
          />
        </div>
        {curatedRecommendationPanel ?? (contributionState.loading ? (
          <div className="analytics-loading" role="status">
            Loading curated progress…
          </div>
        ) : recommendation ? (
          <RecommendationCard item={recommendation} go={go} />
        ) : null)}
        {contributionState.failureCount ? (
          <p className="integrity-note" role="alert">
            Some curated progress is temporarily unavailable. Valid legacy and
            other module evidence remains visible; saved data was not changed.
          </p>
        ) : null}
        {curatedPanel}
      </section>
      {hasHidden ? (
        <p className="integrity-note">
          Saved controlled-practice data for a currently disabled curated
          module remains on this device. It was not deleted or migrated.
        </p>
      ) : null}
      <section className="hub-section">
        <div className="section-heading">
          <div>
            <h2>Course progress</h2>
            <p>Session averages are arithmetic means of safely readable saved percentages on this browser.</p>
          </div>
        </div>
        <div className="course-progress-grid">
          {courses.map((course, index) => {
            const analytics = courseAnalytics[index];
            const registered = allCuratedExperiences.filter(
              (experience) => experience.courseId === course.id,
            );
            const enabled = registered.filter((experience) => experience.enabled);
            return (
              <article key={course.id}>
                <span className="course-code">{course.code}</span>
                <h3>{course.title}</h3>
                <div className="reading-line">
                  <span>{analytics.readingCompleted}/{analytics.readingTotal} sections</span>
                  <b>{analytics.readingPercentage}%</b>
                </div>
                <ProgressBar
                  value={analytics.readingPercentage}
                  label={`${course.title} reading progress`}
                />
                <p><strong>Active modules:</strong> {analytics.activeModuleCount}</p>
                <h4>Legacy quiz</h4>
                <dl className="compact-metrics">
                  <div><dt>Saved attempts</dt><dd>{analytics.savedResultCount}</dd></div>
                  <div><dt>Latest</dt><dd>{displayPercent(analytics.latestPercentage)}</dd></div>
                  <div><dt>Best</dt><dd>{displayPercent(analytics.bestPercentage)}</dd></div>
                  <div><dt>Recent average</dt><dd>{displayPercent(analytics.recentAveragePercentage)}</dd></div>
                </dl>
                {registered.length ? (
                  <div className="separate-score-note">
                    <h4>Curated modules enabled: {enabled.length} of {registered.length}</h4>
                    <p>Module evidence remains separate and is shown only for enabled experiences.</p>
                  </div>
                ) : null}
                <button
                  className="secondary"
                  onClick={() => go('course', course.id)}
                  type="button"
                >
                  Open course
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="hub-section">
        <div className="section-heading">
          <div>
            <h2>All modules</h2>
            <p>Detailed question-level analytics begin with curated practice.</p>
          </div>
        </div>
        <div className="module-progress-list">
          {modules.map((module, index) => {
            const analytics = moduleAnalytics[index];
            return (
              <article key={module.id}>
                <div>
                  <span className="course-code">{module.number}</span>
                  <h3>{module.title}</h3>
                </div>
                <span>{analytics.readingPercentage}% read</span>
                <span>Latest {displayPercent(analytics.latestPercentage)}</span>
                <span>Best {displayPercent(analytics.bestPercentage)}</span>
                <span>{analytics.savedResultCount} saved</span>
                <span>{analytics.activeAttempt ? 'Active' : 'No active quiz'}</span>
                <button
                  className="text-button"
                  onClick={() => go('progress', module.id)}
                  type="button"
                >
                  View details
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="hub-section">
        <div className="section-heading">
          <div>
            <h2>Recent quiz and practice activity</h2>
            <p>Reading completion is excluded because reading records have no timestamps.</p>
          </div>
        </div>
        {curatedActivityPanel ?? (contributionState.loading ? (
          <div className="analytics-loading" role="status">
            Loading recent activity…
          </div>
        ) : activity.length ? (
          <ActivityList items={activity} go={go} />
        ) : (
          <div className="empty-state">
            <h3>No saved activity yet</h3>
            <p>Begin a quiz or practice session to build your browser-local activity.</p>
            <button
              className="primary"
              onClick={() => go('practice-hub')}
              type="button"
            >
              Choose practice
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
