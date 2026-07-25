'use client';

import type { GoToRoute } from '@/hooks/useClientRoute';
import { countIncorrect, countResultUnanswered } from '@/lib/legacy/attempts';
import { scorePercentage } from '@/lib/legacy/progress';
import { questionsFor } from '@/lib/legacy/questionGenerator';
import type { Module, Result } from '@/lib/legacy/types';

export function LegacyResultsView({
  module,
  result,
  go,
  startQuiz,
}: {
  module: Module;
  result?: Result;
  go: GoToRoute;
  startQuiz: (module: Module, force?: boolean) => void;
}) {
  const questions = questionsFor(module);
  const byId = new Map(questions.map((question) => [question.id, question]));

  if (!result) {
    return (
      <section className="empty">
        <h1>No submitted result yet</h1>
        <button className="primary" onClick={() => startQuiz(module)}>Take the quiz</button>
      </section>
    );
  }

  const unanswered = countResultUnanswered(result);
  const incorrect = countIncorrect(result);
  const percent = scorePercentage(result);

  return (
    <section className="results">
      <button className="back" onClick={() => go('course', module.courseId)}>← Course dashboard</button>
      <div className="result-hero">
        <div>
          <span>QUIZ COMPLETE</span>
          <h1>{module.shortTitle}</h1>
          <p>
            {percent >= 80
              ? 'Excellent work — your core understanding is strong.'
              : percent >= 60
                ? 'A solid attempt. Review the missed sections and try again.'
                : 'Use the review below to target the topics that need another pass.'}
          </p>
        </div>
        <div className="score-circle"><strong>{percent}%</strong><span>{result.score}/50 correct</span></div>
      </div>
      <div className="result-stats">
        <span><b>{result.score}</b>Correct</span>
        <span><b>{incorrect}</b>Incorrect</span>
        <span><b>{unanswered}</b>Unanswered</span>
        <span><b>{new Date(result.submittedAt).toLocaleDateString()}</b>Submitted</span>
      </div>
      <div className="result-actions">
        <button className="primary" onClick={() => startQuiz(module, true)}>Retake shuffled quiz</button>
        <button className="secondary" onClick={() => go('study', module.id)}>Review study notes</button>
      </div>
      <h2 className="review-title">Answer review</h2>
      <div className="review-list">
        {result.order.map((id, index) => {
          const question = byId.get(id)!;
          const selected = result.answers[id];
          const correct = selected === question.correct;
          return (
            <details key={id} className={correct ? 'review correct' : 'review incorrect'}>
              <summary>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <b>{question.prompt}</b>
                  <small>{correct ? 'Correct' : selected ? 'Incorrect' : 'Unanswered'}</small>
                </div>
                <i>{correct ? '✓' : '!'}</i>
              </summary>
              <div className="review-body">
                <p><span>Your answer</span><b>{selected ?? 'No answer selected'}</b></p>
                {!correct ? <p><span>Correct answer</span><b>{question.correct}</b></p> : null}
                <p className="explanation">{question.explanation}</p>
                <button
                  className="text-button"
                  onClick={() => {
                    go('study', module.id);
                    setTimeout(() => document.getElementById(question.sectionId)?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                >
                  Open related notes →
                </button>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
