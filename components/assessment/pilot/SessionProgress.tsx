export function SessionProgress({
  total,
  answered,
  inProgress,
  flagged,
}: {
  total: number;
  answered: number;
  inProgress: number;
  flagged: number;
}) {
  const percentage = total === 0 ? 0 : Math.round((answered / total) * 100);
  return (
    <section className="pilot-progress" aria-label="Assessment progress">
      <div className="pilot-progress-copy">
        <span>{answered} answered</span>
        <span>{inProgress} in progress</span>
        <span>{flagged} flagged</span>
      </div>
      <progress max={total} value={answered}>
        {percentage}%
      </progress>
    </section>
  );
}
