import type { AssessmentGradingReport } from '@/lib/assessment/grading/types';

export function GradeSummary({ report }: { report: AssessmentGradingReport }) {
  const percentage = report.status === 'complete' && report.maxScore
    ? Math.round(((report.score ?? 0) / report.maxScore) * 100)
    : undefined;
  return (
    <section className="pilot-grade-summary">
      <div>
        <h1>{report.status === 'complete' ? 'Pilot result' : 'Manual review required'}</h1>
        {report.status === 'complete' ? (
          <p>{report.score} / {report.maxScore} · {percentage}%</p>
        ) : (
          <p>Automatic subtotal: {report.autoScore} / {report.autoMaxScore}</p>
        )}
        <small>This result does not affect your existing course score.</small>
      </div>
      <dl>
        <div><dt>Correct</dt><dd>{report.correctCount}</dd></div>
        <div><dt>Partial</dt><dd>{report.partialCount}</dd></div>
        <div><dt>Incorrect</dt><dd>{report.incorrectCount}</dd></div>
        <div><dt>Unanswered</dt><dd>{report.unansweredCount}</dd></div>
        <div><dt>Manual review</dt><dd>{report.manualRequiredCount}</dd></div>
      </dl>
    </section>
  );
}
