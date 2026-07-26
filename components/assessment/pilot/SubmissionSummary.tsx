import { useEffect, useRef } from 'react';

export function SubmissionSummary({
  answered,
  inProgress,
  unanswered,
  flagged,
  hasOpenResponse,
  onCancel,
  onConfirm,
}: {
  answered: number;
  inProgress: number;
  unanswered: number;
  flagged: number;
  hasOpenResponse: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="submission-summary"
      aria-labelledby="submission-summary-title"
      aria-live="polite"
      role="region"
    >
      <h2 id="submission-summary-title" ref={headingRef} tabIndex={-1}>
        Review before submission
      </h2>
      <dl>
        <div><dt>Answered</dt><dd>{answered}</dd></div>
        <div><dt>In progress</dt><dd>{inProgress}</dd></div>
        <div><dt>Unanswered</dt><dd>{unanswered}</dd></div>
        <div><dt>Flagged</dt><dd>{flagged}</dd></div>
      </dl>
      <p>Incomplete drafts will be treated as unanswered.</p>
      {hasOpenResponse ? (
        <p>An answered open response will require manual review.</p>
      ) : null}
      <div>
        <button className="secondary" onClick={onCancel} type="button">Continue working</button>
        <button className="primary" onClick={onConfirm} type="button">Submit pilot</button>
      </div>
    </section>
  );
}