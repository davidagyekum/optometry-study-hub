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
    totalOutputBytes: 6_985_404,
    clientJavaScriptBytes: 1_168_274,
    initialHomeJavaScriptBytes: 498_756,
    disabledPracticeHubJavaScriptBytes: 498_756,
    disabledProgressHubJavaScriptBytes: 498_756,
    hvpEnabledPracticeHubJavaScriptBytes: 844_170,
    hvpEnabledProgressHubJavaScriptBytes: 844_170,
    incrementalControlledHvpJavaScriptBytes: 425_531,
    incrementalHvpAnalyticsJavaScriptBytes: 345_414,
    combinedIncrementalHvpJavaScriptBytes: 447_721,
    largestAssetBytes: 629_617,
    buildDurationMs: 8_482,
    fileCount: 133,
  },
  'hvp-public-beta': {
    totalOutputBytes: 6_985_402,
    clientJavaScriptBytes: 1_168_273,
    initialHomeJavaScriptBytes: 498_755,
    disabledPracticeHubJavaScriptBytes: 498_755,
    disabledProgressHubJavaScriptBytes: 498_755,
    hvpEnabledPracticeHubJavaScriptBytes: 844_169,
    hvpEnabledProgressHubJavaScriptBytes: 844_169,
    incrementalControlledHvpJavaScriptBytes: 425_531,
    incrementalHvpAnalyticsJavaScriptBytes: 345_414,
    combinedIncrementalHvpJavaScriptBytes: 447_721,
    largestAssetBytes: 629_617,
    buildDurationMs: 8_997,
    fileCount: 133,
  },
  'tissue-foundations-preview': {
    totalOutputBytes: 6_985_402,
    clientJavaScriptBytes: 1_168_273,
    initialHomeJavaScriptBytes: 498_755,
    disabledPracticeHubJavaScriptBytes: 498_755,
    disabledProgressHubJavaScriptBytes: 498_755,
    hvpEnabledPracticeHubJavaScriptBytes: 844_169,
    hvpEnabledProgressHubJavaScriptBytes: 844_169,
    incrementalControlledHvpJavaScriptBytes: 425_531,
    incrementalHvpAnalyticsJavaScriptBytes: 345_414,
    combinedIncrementalHvpJavaScriptBytes: 447_721,
    largestAssetBytes: 629_617,
    buildDurationMs: 8_622,
    fileCount: 133,
  },
  'hvp-tissue-preview': {
    totalOutputBytes: 6_985_400,
    clientJavaScriptBytes: 1_168_272,
    initialHomeJavaScriptBytes: 498_754,
    disabledPracticeHubJavaScriptBytes: 498_754,
    disabledProgressHubJavaScriptBytes: 498_754,
    hvpEnabledPracticeHubJavaScriptBytes: 844_168,
    hvpEnabledProgressHubJavaScriptBytes: 844_168,
    incrementalControlledHvpJavaScriptBytes: 425_531,
    incrementalHvpAnalyticsJavaScriptBytes: 345_414,
    combinedIncrementalHvpJavaScriptBytes: 447_721,
    largestAssetBytes: 629_617,
    buildDurationMs: 8_641,
    fileCount: 133,
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
