import type { ReleaseBuildMetrics, ReleaseProfileId } from '@/lib/release/types';

export type ReleaseBudget = Omit<ReleaseBuildMetrics, 'buildDurationMs' | 'fileCount'>;

/**
 * Measured from the untouched PR #11 main tree (e8b9810f) on bundled Node 24.
 * Size ceilings use approximately 10% headroom. Build duration is recorded but
 * deliberately not a hard budget because local and hosted runner I/O varies.
 */
export const RELEASE_BASELINES: Record<ReleaseProfileId, ReleaseBuildMetrics> = {
  disabled: {
    totalOutputBytes: 6_482_130,
    clientJavaScriptBytes: 959_310,
    initialHomeJavaScriptBytes: 529_994,
    practiceHubJavaScriptBytes: 529_994,
    progressHubJavaScriptBytes: 529_994,
    lazyHvpJavaScriptBytes: 376_558,
    largestAssetBytes: 628_002,
    buildDurationMs: 6_822,
    fileCount: 111,
  },
  'hvp-public-beta': {
    totalOutputBytes: 6_482_128,
    clientJavaScriptBytes: 959_310,
    initialHomeJavaScriptBytes: 529_994,
    practiceHubJavaScriptBytes: 529_994,
    progressHubJavaScriptBytes: 529_994,
    lazyHvpJavaScriptBytes: 376_558,
    largestAssetBytes: 628_002,
    buildDurationMs: 5_940,
    fileCount: 111,
  },
};

const withHeadroom = (value: number) => Math.ceil(value * 1.1);

export const RELEASE_BUDGETS: Record<ReleaseProfileId, ReleaseBudget> = Object.fromEntries(
  Object.entries(RELEASE_BASELINES).map(([profile, baseline]) => [
    profile,
    {
      totalOutputBytes: withHeadroom(baseline.totalOutputBytes),
      clientJavaScriptBytes: withHeadroom(baseline.clientJavaScriptBytes),
      initialHomeJavaScriptBytes: withHeadroom(baseline.initialHomeJavaScriptBytes),
      practiceHubJavaScriptBytes: withHeadroom(baseline.practiceHubJavaScriptBytes),
      progressHubJavaScriptBytes: withHeadroom(baseline.progressHubJavaScriptBytes),
      lazyHvpJavaScriptBytes: withHeadroom(baseline.lazyHvpJavaScriptBytes),
      largestAssetBytes: withHeadroom(baseline.largestAssetBytes),
    },
  ]),
) as Record<ReleaseProfileId, ReleaseBudget>;
