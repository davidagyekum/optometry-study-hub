export function HvpReleaseStatus({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <aside
      className={`curated-status${compact ? ' compact' : ''}`}
      aria-label="Curated practice release status"
    >
      <strong>Course-aligned practice</strong>
      <span>Built from the supplied course materials.</span>
      <span>Progress is stored on this device.</span>
    </aside>
  );
}
