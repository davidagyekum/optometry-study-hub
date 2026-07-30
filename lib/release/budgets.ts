import type { ReleaseBuildMetrics, ReleaseProfileId } from '@/lib/release/types';

export type ReleaseBudget = Omit<ReleaseBuildMetrics, 'buildDurationMs' | 'fileCount'>;

/**
 * Measured from the untouched PR #11 main tree (e8b9810f) on bundled Node 24,
 * with the three curated-practice boundary metrics remeasured on the clean
 * PR #13 implementation commit (6b0f085) after introducing the generic lazy
 * adapters. Size ceilings use approximately 10% headroom. Build duration
 * remains observational because local and hosted runner I/O varies.
 */
export const RELEASE_BASELINES: Record<ReleaseProfileId, ReleaseBuildMetrics> = {
  disabled: {
    totalOutputBytes: 6_490_558,
    clientJavaScriptBytes: 959_311,
    initialHomeJavaScriptBytes: 529_995,
    disabledPracticeHubJavaScriptBytes: 529_995,
    disabledProgressHubJavaScriptBytes: 529_995,
    hvpEnabledPracticeHubJavaScriptBytes: 816_876,
    hvpEnabledProgressHubJavaScriptBytes: 816_876,
    incrementalControlledHvpJavaScriptBytes: 422_877,
    incrementalHvpAnalyticsJavaScriptBytes: 332_888,
    combinedIncrementalHvpJavaScriptBytes: 445_310,
    largestAssetBytes: 632_350,
    buildDurationMs: 6_822,
    fileCount: 111,
  },
  'hvp-public-beta': {
    totalOutputBytes: 6_490_556,
    clientJavaScriptBytes: 959_310,
    initialHomeJavaScriptBytes: 529_994,
    disabledPracticeHubJavaScriptBytes: 529_994,
    disabledProgressHubJavaScriptBytes: 529_994,
    hvpEnabledPracticeHubJavaScriptBytes: 816_875,
    hvpEnabledProgressHubJavaScriptBytes: 816_875,
    incrementalControlledHvpJavaScriptBytes: 422_877,
    incrementalHvpAnalyticsJavaScriptBytes: 332_888,
    combinedIncrementalHvpJavaScriptBytes: 445_310,
    largestAssetBytes: 632_350,
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
      disabledPracticeHubJavaScriptBytes: withHeadroom(
        baseline.disabledPracticeHubJavaScriptBytes,
      ),
      disabledProgressHubJavaScriptBytes: withHeadroom(
        baseline.disabledProgressHubJavaScriptBytes,
      ),
      hvpEnabledPracticeHubJavaScriptBytes: withHeadroom(
        baseline.hvpEnabledPracticeHubJavaScriptBytes,
      ),
      hvpEnabledProgressHubJavaScriptBytes: withHeadroom(
        baseline.hvpEnabledProgressHubJavaScriptBytes,
      ),
      incrementalControlledHvpJavaScriptBytes: withHeadroom(
        baseline.incrementalControlledHvpJavaScriptBytes,
      ),
      incrementalHvpAnalyticsJavaScriptBytes: withHeadroom(
        baseline.incrementalHvpAnalyticsJavaScriptBytes,
      ),
      combinedIncrementalHvpJavaScriptBytes: withHeadroom(
        baseline.combinedIncrementalHvpJavaScriptBytes,
      ),
      largestAssetBytes: withHeadroom(baseline.largestAssetBytes),
    },
  ]),
) as Record<ReleaseProfileId, ReleaseBudget>;
