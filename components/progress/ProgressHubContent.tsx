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
  const previousSavedResults = moduleAnalytics.reduce(
    (sum, item) => sum + item.savedResultCount,
    0,
  );
  const previousActiveSessions = moduleAnalytics.filter((item) => item.activeAttempt).length;
  const curatedBlueprintIds = new Set(
    curatedExperiences.flatMap((experience) => experience.blueprintIds),
  );
  const curatedSavedResults = Object.values(store.assessment.results).filter(
    (result) => curatedBlueprintIds.has(result.blueprintId ?? ''),
  ).length;
  const curatedActiveSessions = Object.values(store.assessment.activeAttempts).filter(
    (attempt) => curatedBlueprintIds.has(attempt.blueprintId ?? ''),
  ).length;
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
          <p>Current curated practice and reading progress, with previous quiz history kept separately.</p>
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
            label="Saved curated results"
            value={curatedSavedResults}
            detail="Current-version practice results on this device"
          />
          <Metric
            label="Active curated practice"
            value={curatedActiveSessions}
            detail="Autosaved curated sessions"
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
            <p>Reading and current curated-practice availability by course.</p>
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
                <p><strong>Curated modules available:</strong> {enabled.length} of {registered.length}</p>
                {registered.length ? (
                  <div className="separate-score-note">
                    <h4>Course-aligned practice</h4>
                    <p>Quick, Standard, Full and Custom practice stays separate by module.</p>
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
            <p>Open a module for current curated mastery and reading detail.</p>
          </div>
        </div>
        <div className="module-progress-list">
          {modules.map((module, index) => {
            const analytics = moduleAnalytics[index];
            const curated = curatedExperiences.find(
              (experience) => experience.moduleId === module.id,
            );
            return (
              <article key={module.id}>
                <div>
                  <span className="course-code">{module.number}</span>
                  <h3>{module.title}</h3>
                </div>
                <span>{analytics.readingPercentage}% read</span>
                <span>{curated ? 'Curated practice available' : 'Curated practice unavailable'}</span>
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
      <section className="hub-section previous-history-section">
        <details className="previous-history-details">
          <summary>Previous quiz history</summary>
          <p>Earlier quiz attempts and scores remain readable but are not combined with curated practice.</p>
          <div className="analytics-metrics">
            <Metric label="Saved previous results" value={previousSavedResults} detail="Retained compatibility records" />
            <Metric label="Active previous quizzes" value={previousActiveSessions} detail="May be resumed once and submitted" />
          </div>
          <div className="course-progress-grid">
            {courses.map((course, index) => {
              const analytics = courseAnalytics[index];
              return (
                <article key={course.id}>
                  <span className="course-code">{course.code}</span>
                  <h3>{course.title}</h3>
                  <dl className="compact-metrics">
                    <div><dt>Previous results</dt><dd>{analytics.savedResultCount}</dd></div>
                    <div><dt>Previous latest</dt><dd>{displayPercent(analytics.latestPercentage)}</dd></div>
                    <div><dt>Previous best</dt><dd>{displayPercent(analytics.bestPercentage)}</dd></div>
                    <div><dt>Previous average</dt><dd>{displayPercent(analytics.recentAveragePercentage)}</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
          <button className="secondary" onClick={() => go('legacy')} type="button">Open previous quiz history</button>
        </details>
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
            <p>Begin curated practice to build your browser-local activity.</p>
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
