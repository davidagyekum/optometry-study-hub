import type { ReleaseBuildMetrics, ReleaseProfileId } from '@/lib/release/types';

export type ReleaseBudget = Omit<ReleaseBuildMetrics, 'buildDurationMs' | 'fileCount'>;

/**
 * Measured from the untouched PR #11 main tree (e8b9810f) on bundled Node 24,
 * with the three curated-practice boundary metrics remeasured on the clean
 * PR #13 implementation commit (6b0f085) after introducing the generic lazy
 * adapters. The four profiles were remeasured on the clean Blood Supply
 * checkpoint implementation commit (b79cb79) after the cumulative
 * answer-isolated Aqueous/Vitreous and Blood Supply dynamic chunks crossed
 * the preceding Ocular Adnexa ceiling without entering an initial route
 * closure. Size ceilings use approximately 10% headroom. Build duration
 * remains observational because local and hosted runner I/O varies.
 */
export const RELEASE_BASELINES: Record<ReleaseProfileId, ReleaseBuildMetrics> = {
  disabled: {
    totalOutputBytes: 7_996_819,
    clientJavaScriptBytes: 1_596_037,
    initialHomeJavaScriptBytes: 504_544,
    disabledPracticeHubJavaScriptBytes: 504_544,
    disabledProgressHubJavaScriptBytes: 504_544,
    hvpEnabledPracticeHubJavaScriptBytes: 852_264,
    hvpEnabledProgressHubJavaScriptBytes: 852_264,
    incrementalControlledHvpJavaScriptBytes: 427_837,
    incrementalHvpAnalyticsJavaScriptBytes: 347_720,
    combinedIncrementalHvpJavaScriptBytes: 450_027,
    largestAssetBytes: 630_806,
    buildDurationMs: 6_385,
    fileCount: 165,
  },
  'hvp-public-beta': {
    totalOutputBytes: 7_996_817,
    clientJavaScriptBytes: 1_596_036,
    initialHomeJavaScriptBytes: 504_543,
    disabledPracticeHubJavaScriptBytes: 504_543,
    disabledProgressHubJavaScriptBytes: 504_543,
    hvpEnabledPracticeHubJavaScriptBytes: 852_263,
    hvpEnabledProgressHubJavaScriptBytes: 852_263,
    incrementalControlledHvpJavaScriptBytes: 427_837,
    incrementalHvpAnalyticsJavaScriptBytes: 347_720,
    combinedIncrementalHvpJavaScriptBytes: 450_027,
    largestAssetBytes: 630_806,
    buildDurationMs: 6_981,
    fileCount: 165,
  },
  'tissue-foundations-preview': {
    totalOutputBytes: 7_996_817,
    clientJavaScriptBytes: 1_596_036,
    initialHomeJavaScriptBytes: 504_543,
    disabledPracticeHubJavaScriptBytes: 504_543,
    disabledProgressHubJavaScriptBytes: 504_543,
    hvpEnabledPracticeHubJavaScriptBytes: 852_263,
    hvpEnabledProgressHubJavaScriptBytes: 852_263,
    incrementalControlledHvpJavaScriptBytes: 427_837,
    incrementalHvpAnalyticsJavaScriptBytes: 347_720,
    combinedIncrementalHvpJavaScriptBytes: 450_027,
    largestAssetBytes: 630_806,
    buildDurationMs: 6_523,
    fileCount: 165,
  },
  'hvp-tissue-preview': {
    totalOutputBytes: 7_996_815,
    clientJavaScriptBytes: 1_596_035,
    initialHomeJavaScriptBytes: 504_542,
    disabledPracticeHubJavaScriptBytes: 504_542,
    disabledProgressHubJavaScriptBytes: 504_542,
    hvpEnabledPracticeHubJavaScriptBytes: 852_262,
    hvpEnabledProgressHubJavaScriptBytes: 852_262,
    incrementalControlledHvpJavaScriptBytes: 427_837,
    incrementalHvpAnalyticsJavaScriptBytes: 347_720,
    combinedIncrementalHvpJavaScriptBytes: 450_027,
    largestAssetBytes: 630_806,
    buildDurationMs: 6_723,
    fileCount: 165,
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
