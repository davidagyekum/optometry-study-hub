export function HvpReleaseStatus({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <aside
      className={`pilot-warning hvp-release-status${compact ? ' compact' : ''}`}
      aria-label="Curated practice release status"
    >
      <strong>Curated study practice</strong>
      <span>Internally verified and slide-aligned.</span>
      <span>Not lecturer-approved examination items.</span>
      <span>Stored only on this device.</span>
    </aside>
  );
}
