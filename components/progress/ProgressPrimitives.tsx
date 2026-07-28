import type { MasteryLevel } from '@/lib/progress/types';

export function displayPercent(value?: number): string {
  return value === undefined ? '—' : `${Math.round(value)}%`;
}

export function displayDate(value?: string): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const bounded = Math.max(0, Math.min(100, value));
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
