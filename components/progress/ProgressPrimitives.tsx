import type { MasteryLevel } from '@/lib/progress/types';

export function displayPercent(value?: number): string {
  return value === undefined || !Number.isFinite(value)
    ? '—'
    : `${Math.round(value)}%`;
}

export function displayDate(value?: string): string {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return '—';
  }
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const finite = Number.isFinite(value) ? value : 0;
  const bounded = Math.max(0, Math.min(100, finite));
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(bounded)}
      className="analytics-progress"
      role="progressbar"
    >
      <i style={{ width: `${bounded}%` }} />
    </div>
  );
}

export function MasteryBadge({ level }: { level: MasteryLevel }) {
  return <span className={`mastery mastery-${level}`}>{level}</span>;
}

export function MasteryDistribution({
  values,
}: {
  values: Record<MasteryLevel, number>;
}) {
  const levels: MasteryLevel[] = [
    'unseen',
    'learning',
    'developing',
    'proficient',
    'mastered',
  ];
  return (
    <dl className="outcome-strip mastery-distribution" aria-label="Question mastery distribution">
      {levels.map((level) => (
        <div key={level}>
          <dt>{level[0].toUpperCase() + level.slice(1)}</dt>
          <dd>{values[level]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="analytics-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}
