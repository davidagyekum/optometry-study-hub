'use client';

import { useMemo } from 'react';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import { calculateScore, countUnanswered } from '@/lib/legacy/attempts';
import { questionsFor } from '@/lib/legacy/questionGenerator';
import type { Attempt, Module, Result } from '@/lib/legacy/types';

export function LegacyQuizView({
  module,
  attempt,
  onAttempt,
  onSubmit,
  go,
  curatedExperience,
  hasLegacyResults,
}: {
  module: Module;
  attempt?: Attempt;
  onAttempt: (attempt: Attempt) => void;
  onSubmit: (result: Result) => void;
  go: GoToRoute;
  curatedExperience?: CuratedExperienceSummary;
  hasLegacyResults: boolean;
}) {
  const questions = useMemo(() => questionsFor(module), [module]);
  const byId = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);

  if (!attempt) {
    return (
      <section className="empty retired-legacy-path">
        <h1>Previous quiz path retired</h1>
        <p>New sessions now start from course-aligned curated practice. No saved quiz was created or changed.</p>
        <div className="result-actions">
          {curatedExperience ? (
            <button className="primary" onClick={() => go('practice', curatedExperience.routeSegment)} type="button">
              Open curated practice
            </button>
          ) : null}
          <button className="secondary" onClick={() => go('course', module.courseId)} type="button">
            Return to course
          </button>
          {hasLegacyResults ? (
            <button className="text-button" onClick={() => go('legacy', module.id)} type="button">
              Previous quiz history
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const questionId = attempt.order[attempt.current];
  const question = byId.get(questionId)!;
  const answered = Object.keys(attempt.answers).length;
  const flagged = attempt.flags.includes(questionId);
  const patch = (changes: Partial<Attempt>) => onAttempt({ ...attempt, ...changes });
  const submit = () => {
    const unanswered = countUnanswered(attempt);
    if (
      unanswered
      && !window.confirm(`You still have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`)
    ) return;
    const result: Result = {
      ...attempt,
      score: calculateScore(attempt, byId),
      total: 50,
      submittedAt: new Date().toISOString(),
    };
    onSubmit(result);
    go('results', module.id);
  };

  return (
    <section className="quiz-shell" aria-label="Previous 50-question quiz">
      <div className="quiz-top">
        <button className="back" onClick={() => go('course', module.courseId)}>← Save & exit</button>
        <div><span>{module.shortTitle}</span><b>{answered}/50 answered</b></div>
        <span className="previous-quiz-label">Previous 50-question quiz</span>
      </div>
      <div className="quiz-progress"><i style={{ width: `${((attempt.current + 1) / 50) * 100}%` }} /></div>
      <div className="quiz-grid">
        <aside className="navigator">
          <h2>Question navigator</h2>
          <div>
            {attempt.order.map((id, index) => (
              <button
                key={id}
                aria-label={`Question ${index + 1}`}
                onClick={() => patch({ current: index })}
                className={`${index === attempt.current ? 'current' : ''} ${attempt.answers[id] ? 'answered' : ''} ${attempt.flags.includes(id) ? 'flagged' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="legend">
            <span><i className="answered" />Answered</span>
            <span><i className="flagged" />Flagged</span>
          </div>
        </aside>
        <article className="question-card">
          <div className="question-meta">
            <span>QUESTION {attempt.current + 1} OF 50</span>
            <button
              className={flagged ? 'flag active' : 'flag'}
              onClick={() => patch({
                flags: flagged
                  ? attempt.flags.filter((id) => id !== questionId)
                  : [...attempt.flags, questionId],
              })}
            >
              {flagged ? '★ Flagged' : '☆ Flag for review'}
            </button>
          </div>
          <h1>{question.prompt}</h1>
          <fieldset>
            <legend className="sr-only">Answer choices</legend>
            {attempt.optionOrder[questionId].map((option, index) => (
              <label key={option} className={attempt.answers[questionId] === option ? 'option selected' : 'option'}>
                <input
                  type="radio"
                  name={questionId}
                  checked={attempt.answers[questionId] === option}
                  onChange={() => patch({ answers: { ...attempt.answers, [questionId]: option } })}
                />
                <span>{String.fromCharCode(65 + index)}</span>
                <b>{option}</b>
              </label>
            ))}
          </fieldset>
          <div className="quiz-actions">
            <button className="secondary" disabled={attempt.current === 0} onClick={() => patch({ current: Math.max(0, attempt.current - 1) })}>Previous</button>
            {attempt.current < 49
              ? <button className="primary" onClick={() => patch({ current: attempt.current + 1 })}>Next question</button>
              : <button className="primary coral" onClick={submit}>Submit quiz</button>}
          </div>
          <button className="submit-link" onClick={submit}>Submit quiz now</button>
        </article>
      </div>
    </section>
  );
}
