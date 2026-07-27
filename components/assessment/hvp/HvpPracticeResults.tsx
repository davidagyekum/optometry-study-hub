import { GradeSummary } from '@/components/assessment/review/GradeSummary';
import { QuestionReviewCard } from '@/components/assessment/review/QuestionReviewCard';
import { HvpPracticeWarning } from '@/components/assessment/hvp/HvpPracticeWarning';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { HVP_CURATED_PRACTICE_ID } from '@/lib/assessment/hvp/config';
import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import type { GradingIssue } from '@/lib/assessment/grading/types';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionIssue, SessionResult } from '@/lib/assessment/session/types';
import type { AssessmentResultSnapshot } from '@/lib/storage/schemas';

function IntegrityError({
  issues,
  go,
}: {
  issues: Array<SessionIssue | GradingIssue>;
  go: GoToRoute;
}) {
  return (
    <div className="pilot-page">
      <HvpPracticeWarning />
      <section className="pilot-recovery">
        <h1>Practice result integrity check failed</h1>
        <p>This result cannot be displayed as trusted feedback.</p>
        <details>
          <summary>Technical details</summary>
          <ul>{issues.map((issue) => (
            <li key={`${issue.code}-${issue.path ?? issue.message}`}>
              <code>{issue.code}</code>: {issue.message}
            </li>
          ))}</ul>
        </details>
        <button className="secondary" onClick={() => go('practice', HVP_CURATED_PRACTICE_ID)} type="button">
          Return to curated practice
        </button>
      </section>
    </div>
  );
}

export function HvpPracticeResults({
  resultResult,
  registry,
  go,
}: {
  resultResult: SessionResult<AssessmentResultSnapshot>;
  registry: QuestionRegistry;
  go: GoToRoute;
}) {
  if (!resultResult.ok) return <IntegrityError go={go} issues={resultResult.issues} />;
  const result = resultResult.value;
  const graded = gradeAssessmentResult({ result, registry });
  if (!graded.ok) return <IntegrityError go={go} issues={graded.issues} />;

  const questions = result.orderedQuestionIds.flatMap((id) => {
    const question = registry.get(id);
    return question ? [question] : [];
  });
  const summarize = (key: (question: (typeof questions)[number]) => string) => (
    questions.reduce<Record<string, { score: number; maxScore: number }>>(
      (summaries, question) => {
        const grade = graded.value.questionGrades[question.id];
        if (!grade || grade.score === null || grade.maxScore === null) return summaries;
        const id = key(question);
        const current = summaries[id] ?? { score: 0, maxScore: 0 };
        return {
          ...summaries,
          [id]: {
            score: current.score + grade.score,
            maxScore: current.maxScore + grade.maxScore,
          },
        };
      },
      {},
    )
  );
  const sections = summarize((question) => question.sectionId);
  const formats = summarize((question) => question.format);
  const selection = result.practiceSelection;
  const written = graded.value.status === 'manual_required';

  return (
    <div className="pilot-results-page">
      <button className="back" onClick={() => go('practice', HVP_CURATED_PRACTICE_ID)} type="button">
        ← Back to curated practice
      </button>
      <HvpPracticeWarning />
      <GradeSummary
        report={graded.value}
        title={written ? 'Written practice review' : 'Curated practice result'}
      />
      <section className="pilot-review-section" aria-labelledby="practice-context">
        <h2 id="practice-context">Practice context</h2>
        <dl className="pilot-facts">
          <div><dt>Profile</dt><dd>{selection?.profileId ?? 'full'}</dd></div>
          <div><dt>Strategy</dt><dd>{selection?.strategy ?? 'mixed'}</dd></div>
          <div><dt>Questions</dt><dd>{result.orderedQuestionIds.length}</dd></div>
          <div><dt>Storage</dt><dd>Device only</dd></div>
        </dl>
        {selection?.profileId === 'custom' ? (
          <p>
            Sections: {selection.sectionIds.join(', ')}. Formats: {selection.formats.join(', ')}.
            Difficulties: {selection.difficulties.join(', ')}.
          </p>
        ) : null}
        {written ? (
          <p>
            These responses are self-study work. No percentage or objective
            correctness claim has been fabricated; use the rubric below.
          </p>
        ) : null}
      </section>
      {!written ? (
        <section className="pilot-review-section" aria-labelledby="practice-breakdown">
          <h2 id="practice-breakdown">Practice-set breakdown</h2>
          <div className="pilot-facts">
            {Object.entries(sections).map(([section, summary]) => (
              <div key={section}><strong>{section}</strong><span>{summary.score} / {summary.maxScore}</span></div>
            ))}
            {Object.entries(formats).map(([format, summary]) => (
              <div key={format}><strong>{format.replaceAll('_', ' ')}</strong><span>{summary.score} / {summary.maxScore}</span></div>
            ))}
          </div>
          <p>This result does not affect legacy Latest or Best scores.</p>
        </section>
      ) : null}
      <section className="pilot-review-section">
        <h2>Instructional review</h2>
        <p>Questions are shown in their exact stored order.</p>
        <div className="pilot-review-list">
          {questions.map((question, index) => {
            const grade = graded.value.questionGrades[question.id];
            return grade ? (
              <QuestionReviewCard
                grade={grade}
                index={index}
                key={question.id}
                question={question}
                response={result.responses[question.id]}
              />
            ) : null;
          })}
        </div>
      </section>
    </div>
  );
}
