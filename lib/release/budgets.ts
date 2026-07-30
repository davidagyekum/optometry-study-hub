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
    totalOutputBytes: 8438292,
    clientJavaScriptBytes: 1785984,
    initialHomeJavaScriptBytes: 507159,
    disabledPracticeHubJavaScriptBytes: 507159,
    disabledProgressHubJavaScriptBytes: 507159,
    hvpEnabledPracticeHubJavaScriptBytes: 854874,
    hvpEnabledProgressHubJavaScriptBytes: 854874,
    incrementalControlledHvpJavaScriptBytes: 427832,
    incrementalHvpAnalyticsJavaScriptBytes: 347715,
    combinedIncrementalHvpJavaScriptBytes: 450022,
    largestAssetBytes: 631378,
    buildDurationMs: 8352,
    fileCount: 174,
  },
  'hvp-public-beta': {
    totalOutputBytes: 8438290,
    clientJavaScriptBytes: 1785983,
    initialHomeJavaScriptBytes: 507158,
    disabledPracticeHubJavaScriptBytes: 507158,
    disabledProgressHubJavaScriptBytes: 507158,
    hvpEnabledPracticeHubJavaScriptBytes: 854873,
    hvpEnabledProgressHubJavaScriptBytes: 854873,
    incrementalControlledHvpJavaScriptBytes: 427832,
    incrementalHvpAnalyticsJavaScriptBytes: 347715,
    combinedIncrementalHvpJavaScriptBytes: 450022,
    largestAssetBytes: 631378,
    buildDurationMs: 8365,
    fileCount: 174,
  },
  'tissue-foundations-preview': {
    totalOutputBytes: 8438290,
    clientJavaScriptBytes: 1785983,
    initialHomeJavaScriptBytes: 507158,
    disabledPracticeHubJavaScriptBytes: 507158,
    disabledProgressHubJavaScriptBytes: 507158,
    hvpEnabledPracticeHubJavaScriptBytes: 854873,
    hvpEnabledProgressHubJavaScriptBytes: 854873,
    incrementalControlledHvpJavaScriptBytes: 427832,
    incrementalHvpAnalyticsJavaScriptBytes: 347715,
    combinedIncrementalHvpJavaScriptBytes: 450022,
    largestAssetBytes: 631378,
    buildDurationMs: 8279,
    fileCount: 174,
  },
  'hvp-tissue-preview': {
    totalOutputBytes: 8438288,
    clientJavaScriptBytes: 1785982,
    initialHomeJavaScriptBytes: 507157,
    disabledPracticeHubJavaScriptBytes: 507157,
    disabledProgressHubJavaScriptBytes: 507157,
    hvpEnabledPracticeHubJavaScriptBytes: 854872,
    hvpEnabledProgressHubJavaScriptBytes: 854872,
    incrementalControlledHvpJavaScriptBytes: 427832,
    incrementalHvpAnalyticsJavaScriptBytes: 347715,
    combinedIncrementalHvpJavaScriptBytes: 450022,
    largestAssetBytes: 631378,
    buildDurationMs: 8168,
    fileCount: 174,
  },
  'neuro-anatomy-preview': {
    totalOutputBytes: 8438284,
    clientJavaScriptBytes: 1785980,
    initialHomeJavaScriptBytes: 507155,
    disabledPracticeHubJavaScriptBytes: 507155,
    disabledProgressHubJavaScriptBytes: 507155,
    hvpEnabledPracticeHubJavaScriptBytes: 854870,
    hvpEnabledProgressHubJavaScriptBytes: 854870,
    incrementalControlledHvpJavaScriptBytes: 427832,
    incrementalHvpAnalyticsJavaScriptBytes: 347715,
    combinedIncrementalHvpJavaScriptBytes: 450022,
    largestAssetBytes: 631378,
    buildDurationMs: 8166,
    fileCount: 174,
  },
  'environmental-vision-preview': {
    totalOutputBytes: 8438290,
    clientJavaScriptBytes: 1785983,
    initialHomeJavaScriptBytes: 507158,
    disabledPracticeHubJavaScriptBytes: 507158,
    disabledProgressHubJavaScriptBytes: 507158,
    hvpEnabledPracticeHubJavaScriptBytes: 854873,
    hvpEnabledProgressHubJavaScriptBytes: 854873,
    incrementalControlledHvpJavaScriptBytes: 427832,
    incrementalHvpAnalyticsJavaScriptBytes: 347715,
    combinedIncrementalHvpJavaScriptBytes: 450022,
    largestAssetBytes: 631378,
    buildDurationMs: 8779,
    fileCount: 174,
  },
  'autonomic-pharmacology-preview': {
    totalOutputBytes: 8866345,
    clientJavaScriptBytes: 1971237,
    initialHomeJavaScriptBytes: 509145,
    disabledPracticeHubJavaScriptBytes: 509145,
    disabledProgressHubJavaScriptBytes: 509145,
    hvpEnabledPracticeHubJavaScriptBytes: 856865,
    hvpEnabledProgressHubJavaScriptBytes: 856865,
    incrementalControlledHvpJavaScriptBytes: 427837,
    incrementalHvpAnalyticsJavaScriptBytes: 347720,
    combinedIncrementalHvpJavaScriptBytes: 450027,
    largestAssetBytes: 631819,
    buildDurationMs: 7477,
    fileCount: 183,
  },
  'systemic-pathology-preview': {
    totalOutputBytes: 8866345,
    clientJavaScriptBytes: 1971237,
    initialHomeJavaScriptBytes: 509145,
    disabledPracticeHubJavaScriptBytes: 509145,
    disabledProgressHubJavaScriptBytes: 509145,
    hvpEnabledPracticeHubJavaScriptBytes: 856865,
    hvpEnabledProgressHubJavaScriptBytes: 856865,
    incrementalControlledHvpJavaScriptBytes: 427837,
    incrementalHvpAnalyticsJavaScriptBytes: 347720,
    combinedIncrementalHvpJavaScriptBytes: 450027,
    largestAssetBytes: 631819,
    buildDurationMs: 7477,
    fileCount: 183,
  },
  'full-curated-preview': {
    totalOutputBytes: 8866345,
    clientJavaScriptBytes: 1971237,
    initialHomeJavaScriptBytes: 509145,
    disabledPracticeHubJavaScriptBytes: 509145,
    disabledProgressHubJavaScriptBytes: 509145,
    hvpEnabledPracticeHubJavaScriptBytes: 856865,
    hvpEnabledProgressHubJavaScriptBytes: 856865,
    incrementalControlledHvpJavaScriptBytes: 427837,
    incrementalHvpAnalyticsJavaScriptBytes: 347720,
    combinedIncrementalHvpJavaScriptBytes: 450027,
    largestAssetBytes: 631819,
    buildDurationMs: 7477,
    fileCount: 183,
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
