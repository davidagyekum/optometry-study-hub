import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';

export function CuratedReleaseStatus({
  summary,
  compact = false,
}: {
  summary: CuratedExperienceSummary;
  compact?: boolean;
}) {
  return (
    <aside
      className={`pilot-warning hvp-release-status${compact ? ' compact' : ''}`}
      aria-label={summary.releaseStatus.ariaLabel}
    >
      <strong>{summary.releaseStatus.title}</strong>
      {summary.releaseStatus.lines.map((line) => <span key={line}>{line}</span>)}
    </aside>
  );
}
