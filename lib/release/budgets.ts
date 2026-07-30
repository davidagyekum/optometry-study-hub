import type { ReleaseBuildMetrics, ReleaseProfileId } from '@/lib/release/types';

export type ReleaseBudget = Omit<ReleaseBuildMetrics, 'buildDurationMs' | 'fileCount'>;

/**
 * Measured from the untouched PR #11 main tree (e8b9810f) on bundled Node 24,
 * with the three curated-practice boundary metrics remeasured on the clean
 * PR #13 implementation commit (6b0f085) after introducing the generic lazy
 * adapters. The four profiles were remeasured on the clean Ocular Adnexa
 * checkpoint commit (c842b19) because the new answer-isolated dynamic chunks
 * increase total emitted JavaScript without entering an initial route closure.
 * Size ceilings use approximately 10% headroom. Build duration remains
 * observational because local and hosted runner I/O varies.
 */
export const RELEASE_BASELINES: Record<ReleaseProfileId, ReleaseBuildMetrics> = {
  disabled: {
    totalOutputBytes: 7_343_926,
    clientJavaScriptBytes: 1_319_742,
    initialHomeJavaScriptBytes: 500_681,
    disabledPracticeHubJavaScriptBytes: 500_681,
    disabledProgressHubJavaScriptBytes: 500_681,
    hvpEnabledPracticeHubJavaScriptBytes: 848_396,
    hvpEnabledProgressHubJavaScriptBytes: 848_396,
    incrementalControlledHvpJavaScriptBytes: 427_832,
    incrementalHvpAnalyticsJavaScriptBytes: 347_715,
    combinedIncrementalHvpJavaScriptBytes: 450_022,
    largestAssetBytes: 630_171,
    buildDurationMs: 8_102,
    fileCount: 146,
  },
  'hvp-public-beta': {
    totalOutputBytes: 7_343_924,
    clientJavaScriptBytes: 1_319_741,
    initialHomeJavaScriptBytes: 500_680,
    disabledPracticeHubJavaScriptBytes: 500_680,
    disabledProgressHubJavaScriptBytes: 500_680,
    hvpEnabledPracticeHubJavaScriptBytes: 848_395,
    hvpEnabledProgressHubJavaScriptBytes: 848_395,
    incrementalControlledHvpJavaScriptBytes: 427_832,
    incrementalHvpAnalyticsJavaScriptBytes: 347_715,
    combinedIncrementalHvpJavaScriptBytes: 450_022,
    largestAssetBytes: 630_171,
    buildDurationMs: 8_515,
    fileCount: 146,
  },
  'tissue-foundations-preview': {
    totalOutputBytes: 7_343_924,
    clientJavaScriptBytes: 1_319_741,
    initialHomeJavaScriptBytes: 500_680,
    disabledPracticeHubJavaScriptBytes: 500_680,
    disabledProgressHubJavaScriptBytes: 500_680,
    hvpEnabledPracticeHubJavaScriptBytes: 848_395,
    hvpEnabledProgressHubJavaScriptBytes: 848_395,
    incrementalControlledHvpJavaScriptBytes: 427_832,
    incrementalHvpAnalyticsJavaScriptBytes: 347_715,
    combinedIncrementalHvpJavaScriptBytes: 450_022,
    largestAssetBytes: 630_171,
    buildDurationMs: 8_233,
    fileCount: 146,
  },
  'hvp-tissue-preview': {
    totalOutputBytes: 7_343_922,
    clientJavaScriptBytes: 1_319_740,
    initialHomeJavaScriptBytes: 500_679,
    disabledPracticeHubJavaScriptBytes: 500_679,
    disabledProgressHubJavaScriptBytes: 500_679,
    hvpEnabledPracticeHubJavaScriptBytes: 848_394,
    hvpEnabledProgressHubJavaScriptBytes: 848_394,
    incrementalControlledHvpJavaScriptBytes: 427_832,
    incrementalHvpAnalyticsJavaScriptBytes: 347_715,
    combinedIncrementalHvpJavaScriptBytes: 450_022,
    largestAssetBytes: 630_171,
    buildDurationMs: 8_325,
    fileCount: 146,
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
