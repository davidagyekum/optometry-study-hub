import type { StoreV2 } from '@/lib/storage/schemas';

export type CuratedProgressResult<TSummary, TIssue> =
  | { ok: true; summary: TSummary }
  | { ok: false; issues: TIssue[] };

export type CuratedProgressDataAdapter<TSummary, TIssue> = {
  experienceId: string;
  courseId: string;
  moduleId: string;
  calculate: (store: StoreV2) => CuratedProgressResult<TSummary, TIssue>;
};

export function calculateCuratedProgress<TSummary, TIssue>(
  adapter: CuratedProgressDataAdapter<TSummary, TIssue>,
  store: StoreV2,
): CuratedProgressResult<TSummary, TIssue> {
  return adapter.calculate(store);
}
