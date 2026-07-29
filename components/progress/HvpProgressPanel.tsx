import { HvpReleaseStatus } from '@/components/assessment/hvp/HvpReleaseStatus';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { HVP_CURATED_PRACTICE_ID } from '@/lib/assessment/hvp/config';
import {
  hvpRecommendation,
  unifiedRecommendation,
} from '@/lib/progress/curatedRecommendations';
import { mergeProgressActivity } from '@/lib/progress/activity';
import { calculateCuratedProgress } from '@/lib/progress/curatedAnalytics';
import { hvpProgressAdapter } from '@/lib/progress/hvpAnalytics';
import {
  displayDate,
  displayPercent,
  MasteryBadge,
  MasteryDistribution,
  Metric,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import { selectRecommendation } from '@/lib/progress/recommendations';
import type {
  HvpCuratedSummary,
  MasteryGroup,
  ProgressActivity,
  ProgressRecommendation,
} from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

function EvidenceList({ title, groups }: { title: string; groups: MasteryGroup[] }) {
  return (
    <section className="mastery-section">
      <h3>{title}</h3>
      <div className="mastery-list">
        {groups.map((group) => (
          <article key={group.id}>
            <div><strong>{group.label}</strong><MasteryBadge level={group.mastery} /></div>
            <dl className="compact-metrics">
              <div><dt>Accuracy</dt><dd>{displayPercent(group.answeredAccuracy)}</dd></div>
              <div><dt>Coverage</dt><dd>{displayPercent(group.coveragePercentage)}</dd></div>
              <div><dt>Answered attempts</dt><dd>{group.gradableEncounterCount}</dd></div>
              <div><dt>Questions encountered</dt><dd>{group.distinctQuestionsEncountered}/{group.eligibleQuestionCount}</dd></div>
              <div><dt>Recent misses</dt><dd>{group.recentMissCount}</dd></div>
              <div><dt>Last activity</dt><dd>{displayDate(group.lastActivity)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActiveState({ summary }: { summary: HvpCuratedSummary }) {
  const label = {
    none: 'None',
    'scored-practice': 'Scored practice',
    'written-practice': 'Written practice',
    'recovery-required': 'Recovery required',
  }[summary.activeSession.state];
  return <Metric label="Active practice" value={label} />;
}

function IntegrityNotice({ summary }: { summary: HvpCuratedSummary }) {
  return summary.omittedResultCount ? (
    <p className="integrity-note">
      Some saved curated results were omitted because their integrity could not
      be verified. Omitted: {summary.omittedResultCount}.
    </p>
  ) : null;
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
        const written = item.kind === 'written-started' || item.kind === 'written-completed';
        return (
          <article key={item.id}>
            <div><strong>{item.label}</strong><span>{item.detail ?? 'Human Visual Perception'}</span></div>
            <span>{displayDate(item.timestamp)}</span>
            <b>{written ? 'Not scored' : displayPercent(item.scorePercentage)}</b>
            <button
              className="text-button"
              onClick={() => go(item.destination.view, item.destination.moduleId)}
            >
              {item.actionLabel}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function signals(summary: HvpCuratedSummary) {
  return {
    activeSession: summary.activeSession,
    retryMissedAvailable: summary.retryMissedAvailable,
    weakTopicAvailable: summary.weakTopicAvailable,
    unseenAvailable: summary.unseenAvailable,
    compatibleScoredResultCount: summary.compatibleScoredResultCount,
  };
}

export function HvpProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
  legacyActivity = [],
}: {
  store: StoreV2;
  go: GoToRoute;
  variant: 'resume' | 'summary' | 'detail' | 'recommendation' | 'activity';
  legacyCandidates?: ProgressRecommendation[];
  legacyActivity?: ProgressActivity[];
}) {
  const result = calculateCuratedProgress(hvpProgressAdapter, store);
  if (!result.ok) {
    if (variant === 'recommendation') {
      const recommendation = selectRecommendation(legacyCandidates);
      return recommendation ? (
        <article className="recommendation">
          <div><span>Recommended next step</span><h2>{recommendation.title}</h2><p>{recommendation.reason}</p></div>
          <button className="primary" onClick={() => go(recommendation.destination.view, recommendation.destination.moduleId)}>Continue</button>
        </article>
      ) : null;
    }
    if (variant === 'activity') {
      const activity = mergeProgressActivity(legacyActivity, [], 8);
      return activity.length ? <ActivityList items={activity} go={go} /> : null;
    }
    return (
      <div className="empty-state analytics-unavailable" role="status">
        <h3>Curated analytics unavailable</h3>
        <p>Your saved data was not changed. Legacy progress remains available.</p>
      </div>
    );
  }
  const { summary } = result;
  if (variant === 'resume') {
    const active = summary.activeSession;
    if (active.state === 'none') return null;
    if (active.state === 'recovery-required') {
      return (
        <article>
          <div><strong>HVP practice recovery required</strong><span>Review the saved candidate before continuing.</span></div>
          <button className="primary small" onClick={() => go('practice', HVP_CURATED_PRACTICE_ID)}>Open recovery</button>
        </article>
      );
    }
    const written = active.state === 'written-practice';
    return (
      <article>
        <div>
          <strong>{written ? 'HVP Written Practice' : 'HVP curated practice'}</strong>
          <span>{written ? 'Not scored' : `${active.attempt.orderedQuestionIds.length} questions`} · saved automatically</span>
        </div>
        <button className="primary small" onClick={() => go('assessment', active.attemptId)}>Resume practice</button>
      </article>
    );
  }
  if (variant === 'recommendation') {
    const recommendation = unifiedRecommendation(legacyCandidates, signals(summary));
    return recommendation ? (
      <article className="recommendation">
        <div><span>Recommended next step</span><h2>{recommendation.title}</h2><p>{recommendation.reason}</p></div>
        <button className="primary" onClick={() => go(recommendation.destination.view, recommendation.destination.moduleId)}>Continue</button>
      </article>
    ) : null;
  }
  if (variant === 'activity') {
    const activity = mergeProgressActivity(legacyActivity, summary.recentActivity, 8);
    return activity.length ? (
      <ActivityList items={activity} go={go} />
    ) : (
      <div className="empty-state">
        <h3>No saved activity yet</h3>
        <p>Begin a quiz or practice session to build your browser-local activity.</p>
        <button className="primary" onClick={() => go('practice-hub')}>Choose practice</button>
      </div>
    );
  }
  if (variant === 'summary') {
    return (
      <article className="curated-summary">
        <div className="section-heading"><div><span className="course-code">OPT 374</span><h2>Curated practice</h2><p>Verified current-version assessment evidence. Kept separate from the legacy quiz.</p></div></div>
        <HvpReleaseStatus compact />
        <IntegrityNotice summary={summary} />
        <div className="analytics-metrics">
          <Metric label="Latest" value={displayPercent(summary.latestPercentage)} />
          <Metric label="Best" value={displayPercent(summary.bestPercentage)} />
          <Metric label="Average" value={displayPercent(summary.averageSessionPercentage)} />
          <Metric label="Coverage" value={displayPercent(summary.coveragePercentage)} detail={`${summary.distinctCurrentQuestionsEncountered}/${summary.eligibleAutomaticQuestionTotal} questions`} />
          <ActiveState summary={summary} />
          <Metric label="Written submissions" value={summary.writtenSubmissions} detail="Not scored" />
        </div>
        <h3>Current question mastery</h3>
        <MasteryDistribution values={summary.masteryDistribution} />
        <div className="card-actions wrap">
          <button className="primary small" onClick={() => go('practice', HVP_CURATED_PRACTICE_ID)}>Open curated practice</button>
          <button className="text-button" onClick={() => go('progress', 'human-visual-perception')}>View detailed progress</button>
        </div>
      </article>
    );
  }
  const moduleLegacy = legacyCandidates.filter(
    (candidate) => candidate.moduleId === 'human-visual-perception',
  );
  const nextAction = unifiedRecommendation(moduleLegacy, signals(summary))
    ?? hvpRecommendation(signals(summary));
  return (
    <section className="hub-section curated-detail">
      <div className="section-heading"><div><span className="course-code">CURATED PRACTICE</span><h2>Current-version mastery</h2><p>Legacy quiz scores are not included in these metrics.</p></div></div>
      <HvpReleaseStatus compact />
      <IntegrityNotice summary={summary} />
      <div className="analytics-metrics">
        <Metric label="Compatible scored sessions" value={summary.compatibleScoredResultCount} />
        <Metric label="Latest" value={displayPercent(summary.latestPercentage)} />
        <Metric label="Best" value={displayPercent(summary.bestPercentage)} />
        <Metric label="Average" value={displayPercent(summary.averageSessionPercentage)} detail="Arithmetic mean of compatible sessions" />
        <Metric label="Answered accuracy" value={displayPercent(summary.weightedAnsweredAccuracy)} detail="Exact earned points / possible points for answered items" />
        <Metric label="Gradable answered encounters" value={summary.gradableAnsweredEncounters} />
        <Metric label="Coverage" value={displayPercent(summary.coveragePercentage)} detail={`${summary.distinctCurrentQuestionsEncountered}/${summary.eligibleAutomaticQuestionTotal} questions`} />
        <ActiveState summary={summary} />
      </div>
      <ProgressBar value={summary.coveragePercentage} label="Current-version HVP question coverage" />
      <dl className="outcome-strip">
        <div><dt>Correct</dt><dd>{summary.correctCount}</dd></div>
        <div><dt>Partial</dt><dd>{summary.partialCount}</dd></div>
        <div><dt>Incorrect</dt><dd>{summary.incorrectCount}</dd></div>
        <div><dt>Unanswered</dt><dd>{summary.unansweredCount}</dd></div>
      </dl>
      {nextAction ? (
        <article className="recommendation compact">
          <div><span>Deterministic next step</span><h2>{nextAction.title}</h2><p>{nextAction.reason}</p></div>
          <button className="primary small" onClick={() => go(nextAction.destination.view, nextAction.destination.moduleId)}>Open recommended practice</button>
        </article>
      ) : null}
      <article className="mastery-explanation">
        <h3>How mastery is calculated</h3>
        <p>Labels use current-version accuracy, coverage, answered attempts, questions encountered and recent misses. Mastered questions require at least three gradable attempts, at least 90% accuracy and a latest correct outcome. Group mastery also requires at least 60% coverage, three distinct gradable questions, five gradable encounters and no recent miss.</p>
      </article>
      <section className="mastery-section">
        <h3>Overview</h3>
        <MasteryDistribution values={summary.masteryDistribution} />
        <div className="analytics-metrics">
          <Metric label="Profiles" value={Object.entries(summary.profileDistribution).map(([id, count]) => `${id}: ${count}`).join(' · ') || '—'} />
          <Metric label="Strategies" value={Object.entries(summary.strategyDistribution).map(([id, count]) => `${id}: ${count}`).join(' · ') || '—'} />
        </div>
      </section>
      <EvidenceList title="Sections" groups={summary.sections} />
      <EvidenceList title="Objectives" groups={summary.objectives} />
      <EvidenceList title="Formats encountered" groups={summary.formats} />
      <EvidenceList title="Difficulty" groups={summary.difficulties} />
      <EvidenceList title="Bloom level" groups={summary.bloomLevels} />
      <section className="mastery-section">
        <h3>Recent curated sessions</h3>
        {summary.recentSessions.length ? <div className="activity-list">{summary.recentSessions.map((session) => (
          <article key={session.resultId}>
            <div><strong>{session.profile} · {session.strategy}</strong><span>{session.questionCount} questions</span></div>
            <span>{displayDate(session.submittedAt)}</span>
            <b>{displayPercent(session.percentage)}</b>
            <button className="text-button" onClick={() => go('assessment-result', session.resultId)}>Review exact result</button>
          </article>
        ))}</div> : <div className="empty-state"><h4>No compatible scored sessions</h4><p>Complete curated practice to begin current-version mastery tracking.</p></div>}
      </section>
      <section className="mastery-section">
        <h3>Written practice</h3>
        <div className="analytics-metrics">
          <Metric label="Written submissions" value={summary.writtenSubmissions} detail="Not scored" />
          <Metric label="Responses supplied" value={summary.writtenResponsesSupplied} detail="For manual self-review" />
          <Metric label="Unanswered prompts" value={summary.writtenUnansweredPrompts} />
          <Metric label="Latest submission" value={displayDate(summary.latestWrittenSubmissionAt)} />
        </div>
        {summary.writtenSessions.length ? (
          <div className="activity-list">
            {summary.writtenSessions.map((session) => (
              <article key={session.resultId}>
                <div><strong>Written practice</strong><span>{session.responsesSupplied} responses supplied · {session.unansweredPrompts} unanswered</span></div>
                <span>{displayDate(session.submittedAt)}</span>
                <b>Not scored</b>
                <button className="text-button" onClick={() => go('assessment-result', session.resultId)}>Review exact result</button>
              </article>
            ))}
          </div>
        ) : <p>No written submissions are saved on this browser.</p>}
      </section>
    </section>
  );
}
