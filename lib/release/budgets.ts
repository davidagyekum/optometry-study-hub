import type { ReleaseBuildMetrics, ReleaseProfileId } from '@/lib/release/types';

export type ReleaseBudget = Omit<ReleaseBuildMetrics, 'buildDurationMs' | 'fileCount'>;

/**
 * Measured from the untouched PR #11 main tree (e8b9810f) on bundled Node 24,
 * with the three curated-practice boundary metrics remeasured on the clean
 * PR #13 implementation commit (6b0f085) after introducing the generic lazy
 * adapters. The inherited profiles were remeasured on the clean Blood Supply
 * checkpoint implementation commit (b79cb79) after the cumulative
 * answer-isolated Aqueous/Vitreous and Blood Supply dynamic chunks crossed
 * the preceding Ocular Adnexa ceiling without entering an initial route
 * closure. Size ceilings use approximately 10% headroom. Build duration
 * remains observational because local and hosted runner I/O varies.
 */
export const RELEASE_BASELINES: Record<ReleaseProfileId, ReleaseBuildMetrics> = {
  disabled: {
    totalOutputBytes: 8_600_000,
    clientJavaScriptBytes: 1_900_000,
    initialHomeJavaScriptBytes: 510_000,
    disabledPracticeHubJavaScriptBytes: 510_000,
    disabledProgressHubJavaScriptBytes: 510_000,
    hvpEnabledPracticeHubJavaScriptBytes: 860_000,
    hvpEnabledProgressHubJavaScriptBytes: 860_000,
    incrementalControlledHvpJavaScriptBytes: 430_000,
    incrementalHvpAnalyticsJavaScriptBytes: 350_000,
    combinedIncrementalHvpJavaScriptBytes: 455_000,
    largestAssetBytes: 650_000,
    buildDurationMs: 6_385,
    fileCount: 180,
  },
  'hvp-public-beta': {
    totalOutputBytes: 8_600_000,
    clientJavaScriptBytes: 1_900_000,
    initialHomeJavaScriptBytes: 510_000,
    disabledPracticeHubJavaScriptBytes: 510_000,
    disabledProgressHubJavaScriptBytes: 510_000,
    hvpEnabledPracticeHubJavaScriptBytes: 860_000,
    hvpEnabledProgressHubJavaScriptBytes: 860_000,
    incrementalControlledHvpJavaScriptBytes: 430_000,
    incrementalHvpAnalyticsJavaScriptBytes: 350_000,
    combinedIncrementalHvpJavaScriptBytes: 455_000,
    largestAssetBytes: 650_000,
    buildDurationMs: 6_981,
    fileCount: 180,
  },
  'tissue-foundations-preview': {
    totalOutputBytes: 8_600_000,
    clientJavaScriptBytes: 1_900_000,
    initialHomeJavaScriptBytes: 510_000,
    disabledPracticeHubJavaScriptBytes: 510_000,
    disabledProgressHubJavaScriptBytes: 510_000,
    hvpEnabledPracticeHubJavaScriptBytes: 860_000,
    hvpEnabledProgressHubJavaScriptBytes: 860_000,
    incrementalControlledHvpJavaScriptBytes: 430_000,
    incrementalHvpAnalyticsJavaScriptBytes: 350_000,
    combinedIncrementalHvpJavaScriptBytes: 455_000,
    largestAssetBytes: 650_000,
    buildDurationMs: 6_523,
    fileCount: 180,
  },
  'hvp-tissue-preview': {
    totalOutputBytes: 8_600_000,
    clientJavaScriptBytes: 1_900_000,
    initialHomeJavaScriptBytes: 510_000,
    disabledPracticeHubJavaScriptBytes: 510_000,
    disabledProgressHubJavaScriptBytes: 510_000,
    hvpEnabledPracticeHubJavaScriptBytes: 860_000,
    hvpEnabledProgressHubJavaScriptBytes: 860_000,
    incrementalControlledHvpJavaScriptBytes: 430_000,
    incrementalHvpAnalyticsJavaScriptBytes: 350_000,
    combinedIncrementalHvpJavaScriptBytes: 455_000,
    largestAssetBytes: 650_000,
    buildDurationMs: 6_723,
    fileCount: 180,
  },
  'neuro-anatomy-preview': {
    totalOutputBytes: 8_600_000,
    clientJavaScriptBytes: 1_900_000,
    initialHomeJavaScriptBytes: 510_000,
    disabledPracticeHubJavaScriptBytes: 510_000,
    disabledProgressHubJavaScriptBytes: 510_000,
    hvpEnabledPracticeHubJavaScriptBytes: 860_000,
    hvpEnabledProgressHubJavaScriptBytes: 860_000,
    incrementalControlledHvpJavaScriptBytes: 430_000,
    incrementalHvpAnalyticsJavaScriptBytes: 350_000,
    combinedIncrementalHvpJavaScriptBytes: 455_000,
    largestAssetBytes: 650_000,
    buildDurationMs: 22_743,
    fileCount: 180,
  },
  'environmental-vision-preview': {
    totalOutputBytes: 8_438_290,
    clientJavaScriptBytes: 1_785_983,
    initialHomeJavaScriptBytes: 507_158,
    disabledPracticeHubJavaScriptBytes: 507_158,
    disabledProgressHubJavaScriptBytes: 507_158,
    hvpEnabledPracticeHubJavaScriptBytes: 854_873,
    hvpEnabledProgressHubJavaScriptBytes: 854_873,
    incrementalControlledHvpJavaScriptBytes: 427_832,
    incrementalHvpAnalyticsJavaScriptBytes: 347_715,
    combinedIncrementalHvpJavaScriptBytes: 450_022,
    largestAssetBytes: 631_378,
    buildDurationMs: 9_404,
    fileCount: 174,
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
