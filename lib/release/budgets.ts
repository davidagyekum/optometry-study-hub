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
 * remains observational because local and hosted runner I/O varies. Systemic and
 * full-curated profiles were measured on clean checkpoint commit `7ac2a47`.
 * The global output ceilings and every route-closure baseline were remeasured
 * on the clean OPT 370 implementation checkpoint after adding five route-lazy
 * authored manuscripts, five 80-question banks, and their supplied SVG assets.
 * The disabled profile measured 12,661,168 total bytes and 3,677,297 client-JS
 * bytes. The all-content production profile was then measured at 13,210,819 total
 * bytes and 3,907,478 client-JS bytes on the clean all-content implementation before budget calibration; each profile
 * receives ten-per-cent headroom over its measured baseline. Controlled-practice
 * isolation remains independently constrained below.
 */
export const RELEASE_BASELINES: Record<ReleaseProfileId, ReleaseBuildMetrics> = {
  disabled: {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577251,
    disabledPracticeHubJavaScriptBytes: 577251,
    disabledProgressHubJavaScriptBytes: 577251,
    hvpEnabledPracticeHubJavaScriptBytes: 925096,
    hvpEnabledProgressHubJavaScriptBytes: 925096,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 8551,
    fileCount: 260,
  },
  'hvp-public-beta': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577250,
    disabledPracticeHubJavaScriptBytes: 577250,
    disabledProgressHubJavaScriptBytes: 577250,
    hvpEnabledPracticeHubJavaScriptBytes: 925095,
    hvpEnabledProgressHubJavaScriptBytes: 925095,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 8105,
    fileCount: 260,
  },
  'tissue-foundations-preview': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577250,
    disabledPracticeHubJavaScriptBytes: 577250,
    disabledProgressHubJavaScriptBytes: 577250,
    hvpEnabledPracticeHubJavaScriptBytes: 925095,
    hvpEnabledProgressHubJavaScriptBytes: 925095,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 8006,
    fileCount: 260,
  },
  'hvp-tissue-preview': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577249,
    disabledPracticeHubJavaScriptBytes: 577249,
    disabledProgressHubJavaScriptBytes: 577249,
    hvpEnabledPracticeHubJavaScriptBytes: 925094,
    hvpEnabledProgressHubJavaScriptBytes: 925094,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 7935,
    fileCount: 260,
  },
  'neuro-anatomy-preview': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577247,
    disabledPracticeHubJavaScriptBytes: 577247,
    disabledProgressHubJavaScriptBytes: 577247,
    hvpEnabledPracticeHubJavaScriptBytes: 925092,
    hvpEnabledProgressHubJavaScriptBytes: 925092,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 7944,
    fileCount: 260,
  },
  'environmental-vision-preview': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577250,
    disabledPracticeHubJavaScriptBytes: 577250,
    disabledProgressHubJavaScriptBytes: 577250,
    hvpEnabledPracticeHubJavaScriptBytes: 925095,
    hvpEnabledProgressHubJavaScriptBytes: 925095,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 8204,
    fileCount: 260,
  },
  'autonomic-pharmacology-preview': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577250,
    disabledPracticeHubJavaScriptBytes: 577250,
    disabledProgressHubJavaScriptBytes: 577250,
    hvpEnabledPracticeHubJavaScriptBytes: 925095,
    hvpEnabledProgressHubJavaScriptBytes: 925095,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 7911,
    fileCount: 260,
  },
  'systemic-pathology-preview': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577250,
    disabledPracticeHubJavaScriptBytes: 577250,
    disabledProgressHubJavaScriptBytes: 577250,
    hvpEnabledPracticeHubJavaScriptBytes: 925095,
    hvpEnabledProgressHubJavaScriptBytes: 925095,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 8085,
    fileCount: 260,
  },
  'full-curated-preview': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577243,
    disabledPracticeHubJavaScriptBytes: 577243,
    disabledProgressHubJavaScriptBytes: 577243,
    hvpEnabledPracticeHubJavaScriptBytes: 925088,
    hvpEnabledProgressHubJavaScriptBytes: 925088,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 8243,
    fileCount: 260,
  },
  'all-course-content-public': {
    totalOutputBytes: 13210819,
    clientJavaScriptBytes: 3907478,
    initialHomeJavaScriptBytes: 593769,
    disabledPracticeHubJavaScriptBytes: 593769,
    disabledProgressHubJavaScriptBytes: 593769,
    hvpEnabledPracticeHubJavaScriptBytes: 943338,
    hvpEnabledProgressHubJavaScriptBytes: 943338,
    incrementalControlledHvpJavaScriptBytes: 430434,
    incrementalHvpAnalyticsJavaScriptBytes: 349569,
    combinedIncrementalHvpJavaScriptBytes: 452705,
    largestAssetBytes: 639752,
    buildDurationMs: 14359,
    fileCount: 280,
  },
  'full-curated-public-beta': {
    totalOutputBytes: 12661168,
    clientJavaScriptBytes: 3677297,
    initialHomeJavaScriptBytes: 577243,
    disabledPracticeHubJavaScriptBytes: 577243,
    disabledProgressHubJavaScriptBytes: 577243,
    hvpEnabledPracticeHubJavaScriptBytes: 925088,
    hvpEnabledProgressHubJavaScriptBytes: 925088,
    incrementalControlledHvpJavaScriptBytes: 428710,
    incrementalHvpAnalyticsJavaScriptBytes: 347845,
    combinedIncrementalHvpJavaScriptBytes: 450981,
    largestAssetBytes: 634445,
    buildDurationMs: 8072,
    fileCount: 260,
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
