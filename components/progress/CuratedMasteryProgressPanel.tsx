import type { ComponentType } from 'react';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import type { GoToRoute } from '@/hooks/useClientRoute';
import {
  displayDate,
  displayPercent,
  MasteryBadge,
  MasteryDistribution,
  Metric,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import type {
  CuratedMasterySummary,
  MasteryGroup,
  ProgressRecommendation,
} from '@/lib/progress/types';


export function emptyCuratedMasterySummary(): CuratedMasterySummary {
  return {
    compatibleScoredResultCount: 0,
    omittedResultCount: 0,
    integrityIssueCategories: {},
    activeSession: { state: 'none' },
    distinctCurrentQuestionsEncountered: 0,
    eligibleAutomaticQuestionTotal: 0,
    coveragePercentage: 0,
    gradableAnsweredEncounters: 0,
    correctCount: 0,
    partialCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    profileDistribution: {},
    strategyDistribution: {},
    retryMissedAvailable: 0,
    weakTopicAvailable: 0,
    unseenAvailable: 0,
    writtenSubmissions: 0,
    writtenResponsesSupplied: 0,
    writtenUnansweredPrompts: 0,
    writtenSessions: [],
    questions: [],
    sections: [],
    objectives: [],
    formats: [],
    difficulties: [],
    bloomLevels: [],
    masteryDistribution: {
      unseen: 0,
      learning: 0,
      developing: 0,
      proficient: 0,
      mastered: 0,
    },
    recentSessions: [],
    recentActivity: [],
  };
}

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

function ActiveState({ summary }: { summary: CuratedMasterySummary }) {
  const label = {
    none: 'None',
    'scored-practice': 'Scored practice',
    'written-practice': 'Written practice',
    'recovery-required': 'Recovery required',
  }[summary.activeSession.state];
  return <Metric label="Active practice" value={label} />;
}

function IntegrityNotice({ summary }: { summary: CuratedMasterySummary }) {
  return summary.omittedResultCount ? (
    <p className="integrity-note">
      Some saved curated results were omitted because their integrity could not
      be verified. Omitted: {summary.omittedResultCount}.
    </p>
  ) : null;
}

export function CuratedMasteryProgressPanel({
  summaryResult,
  experience,
  Status,
  go,
  variant,
  nextAction,
}: {
  summaryResult:
    | { ok: true; summary: CuratedMasterySummary }
    | { ok: false; issues: unknown[] };
  experience: CuratedExperienceSummary;
  Status: ComponentType<{ compact?: boolean }>;
  go: GoToRoute;
  variant: 'resume' | 'summary' | 'detail';
  nextAction?: ProgressRecommendation;
}) {
  if (!summaryResult.ok) {
    return (
      <div className="empty-state analytics-unavailable" role="status">
        <h3>Curated analytics unavailable</h3>
        <p>Your saved data was not changed. Legacy progress remains available.</p>
      </div>
    );
  }
  const { summary } = summaryResult;
  if (variant === 'resume') {
    const active = summary.activeSession;
    if (active.state === 'none') return null;
    if (active.state === 'recovery-required') {
      return (
        <article>
          <div>
            <strong>{experience.shortTitle} recovery required</strong>
            <span>Review the saved candidate before continuing.</span>
          </div>
          <button className="primary small" onClick={() => go('practice', experience.routeSegment)} type="button">
            Open recovery
          </button>
        </article>
      );
    }
    const written = active.state === 'written-practice';
    return (
      <article>
        <div>
          <strong>{written ? `${experience.shortTitle} written practice` : experience.shortTitle}</strong>
          <span>{written ? 'Not scored' : `${active.attempt.orderedQuestionIds.length} questions`} · saved automatically</span>
        </div>
        <button className="primary small" onClick={() => go('assessment', active.attemptId)} type="button">
          Resume practice
        </button>
      </article>
    );
  }
  if (variant === 'summary') {
    return (
      <article className="curated-summary">
        <div className="section-heading">
          <div>
            <span className="course-code">{experience.courseCode}</span>
            <h2>Curated practice</h2>
            <p>Verified current-version assessment evidence. Kept separate from the legacy quiz.</p>
          </div>
        </div>
        <Status compact />
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
          <button className="primary small" onClick={() => go('practice', experience.routeSegment)} type="button">
            Open curated practice
          </button>
          <button className="text-button" onClick={() => go('progress', experience.moduleId)} type="button">
            View detailed progress
          </button>
        </div>
      </article>
    );
  }
  return (
    <section className="hub-section curated-detail">
      <div className="section-heading">
        <div>
          <span className="course-code">CURATED PRACTICE</span>
          <h2>Current-version mastery</h2>
          <p>Legacy quiz scores are not included in these metrics.</p>
        </div>
      </div>
      <Status compact />
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
      <ProgressBar value={summary.coveragePercentage} label={`Current-version ${experience.shortTitle} question coverage`} />
      <dl className="outcome-strip">
        <div><dt>Correct</dt><dd>{summary.correctCount}</dd></div>
        <div><dt>Partial</dt><dd>{summary.partialCount}</dd></div>
        <div><dt>Incorrect</dt><dd>{summary.incorrectCount}</dd></div>
        <div><dt>Unanswered</dt><dd>{summary.unansweredCount}</dd></div>
      </dl>
      {nextAction ? (
        <article className="recommendation compact">
          <div>
            <span>Deterministic next step</span>
            <h2>{nextAction.title}</h2>
            <p>{nextAction.reason}</p>
          </div>
          <button className="primary small" onClick={() => go(nextAction.destination.view, nextAction.destination.moduleId)} type="button">
            Open recommended practice
          </button>
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
        {summary.recentSessions.length ? (
          <div className="activity-list">{summary.recentSessions.map((session) => (
            <article key={session.resultId}>
              <div><strong>{session.profile} · {session.strategy}</strong><span>{session.questionCount} questions</span></div>
              <span>{displayDate(session.submittedAt)}</span>
              <b>{displayPercent(session.percentage)}</b>
              <button className="text-button" onClick={() => go('assessment-result', session.resultId)} type="button">
                Review exact result
              </button>
            </article>
          ))}</div>
        ) : (
          <div className="empty-state">
            <h4>No compatible scored sessions</h4>
            <p>Complete curated practice to begin current-version mastery tracking.</p>
          </div>
        )}
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
                <button className="text-button" onClick={() => go('assessment-result', session.resultId)} type="button">
                  Review exact result
                </button>
              </article>
            ))}
          </div>
        ) : <p>No written submissions are saved on this browser.</p>}
      </section>
    </section>
  );
}
