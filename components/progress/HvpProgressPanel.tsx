import type { GoToRoute } from '@/hooks/useClientRoute';
import { HVP_CURATED_PRACTICE_ID } from '@/lib/assessment/hvp/config';
import { hvpRecommendation } from '@/lib/progress/curatedRecommendations';
import { calculateHvpProgress } from '@/lib/progress/hvpAnalytics';
import {
  displayDate,
  displayPercent,
  MasteryBadge,
  Metric,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import type { MasteryGroup } from '@/lib/progress/types';
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

export function HvpProgressPanel({
  store,
  go,
  variant,
}: {
  store: StoreV2;
  go: GoToRoute;
  variant: 'resume' | 'summary' | 'detail';
}) {
  const summary = calculateHvpProgress(store);
  if (variant === 'resume') {
    return summary.activePractice ? (
      <article>
        <div><strong>HVP curated practice</strong><span>{summary.activePractice.orderedQuestionIds.length} questions · saved automatically</span></div>
        <button className="primary small" onClick={() => go('assessment', summary.activePractice!.id)}>Resume practice</button>
      </article>
    ) : null;
  }
  if (variant === 'summary') {
    return (
      <article className="curated-summary">
        <div className="section-heading"><div><span className="course-code">OPT 374</span><h2>Curated practice</h2><p>Verified current-version assessment evidence. Kept separate from the legacy quiz.</p></div></div>
        <div className="analytics-metrics">
          <Metric label="Latest" value={displayPercent(summary.latestPercentage)} />
          <Metric label="Best" value={displayPercent(summary.bestPercentage)} />
          <Metric label="Average" value={displayPercent(summary.averageSessionPercentage)} />
          <Metric label="Coverage" value={displayPercent(summary.coveragePercentage)} detail={`${summary.distinctCurrentQuestionsEncountered}/${summary.eligibleAutomaticQuestionTotal} questions`} />
          <Metric label="Written submissions" value={summary.writtenSubmissions} detail="Not scored" />
        </div>
        <div className="card-actions wrap">
          <button className="primary small" onClick={() => go('practice', HVP_CURATED_PRACTICE_ID)}>Open curated practice</button>
          <button className="text-button" onClick={() => go('progress', 'human-visual-perception')}>View detailed progress</button>
        </div>
      </article>
    );
  }
  const nextAction = hvpRecommendation({
    activeAttemptId: summary.activePractice?.id,
    retryMissedAvailable: summary.retryMissedAvailable,
    weakTopicAvailable: summary.weakTopicAvailable,
    unseenAvailable: summary.unseenAvailable,
    compatibleScoredResultCount: summary.compatibleScoredResultCount,
  });
  return (
    <section className="hub-section curated-detail">
      <div className="section-heading"><div><span className="course-code">CURATED PRACTICE</span><h2>Current-version mastery</h2><p>Legacy quiz scores are not included in these metrics.</p></div></div>
      {summary.omittedResultCount ? (
        <p className="integrity-note">Some saved curated results were omitted because their integrity could not be verified. Omitted: {summary.omittedResultCount}.</p>
      ) : null}
      <div className="analytics-metrics">
        <Metric label="Latest" value={displayPercent(summary.latestPercentage)} />
        <Metric label="Best" value={displayPercent(summary.bestPercentage)} />
        <Metric label="Average" value={displayPercent(summary.averageSessionPercentage)} detail="Arithmetic mean of compatible sessions" />
        <Metric label="Answered accuracy" value={displayPercent(summary.weightedAnsweredAccuracy)} detail="Exact earned points / possible points for answered items" />
        <Metric label="Coverage" value={displayPercent(summary.coveragePercentage)} detail={`${summary.distinctCurrentQuestionsEncountered}/${summary.eligibleAutomaticQuestionTotal} questions`} />
      </div>
      <ProgressBar value={summary.coveragePercentage} label="Current-version HVP question coverage" />
      <dl className="outcome-strip">
        <div><dt>Correct</dt><dd>{summary.correctCount}</dd></div>
        <div><dt>Partial</dt><dd>{summary.partialCount}</dd></div>
        <div><dt>Incorrect</dt><dd>{summary.incorrectCount}</dd></div>
        <div><dt>Unanswered</dt><dd>{summary.unansweredCount}</dd></div>
      </dl>
      <article className="recommendation compact">
        <div><span>Deterministic next step</span><h2>{nextAction.title}</h2><p>{nextAction.reason}</p></div>
        <button className="primary small" onClick={() => go(nextAction.destination.view as never, nextAction.destination.moduleId)}>Open</button>
      </article>
      <article className="mastery-explanation">
        <h3>How mastery is calculated</h3>
        <p>Labels use current-version accuracy, coverage, answered attempts, questions encountered and recent misses. Mastered questions require at least three gradable attempts, at least 90% accuracy and a latest correct outcome. Group mastery also requires at least 60% coverage, three distinct gradable questions, five gradable encounters and no recent miss.</p>
      </article>
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
            <button className="text-button" onClick={() => go('assessment-result', session.resultId)}>Review</button>
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
      </section>
    </section>
  );
}
