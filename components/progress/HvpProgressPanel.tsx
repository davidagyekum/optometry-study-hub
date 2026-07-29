import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import { HvpReleaseStatus } from '@/components/assessment/hvp/HvpReleaseStatus';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { CuratedProgressContribution } from '@/lib/assessment/curated/types';
import { hvpPracticeDefinition } from '@/lib/assessment/hvp/definition';
import {
  hvpRecommendation,
  unifiedRecommendation,
} from '@/lib/progress/curatedRecommendations';
import { calculateCuratedProgress } from '@/lib/progress/curatedAnalytics';
import { hvpProgressAdapter } from '@/lib/progress/hvpAnalytics';
import type { HvpCuratedSummary, ProgressRecommendation } from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

function signals(summary: HvpCuratedSummary) {
  return {
    activeSession: summary.activeSession,
    retryMissedAvailable: summary.retryMissedAvailable,
    weakTopicAvailable: summary.weakTopicAvailable,
    unseenAvailable: summary.unseenAvailable,
    compatibleScoredResultCount: summary.compatibleScoredResultCount,
  };
}

function calculate(store: StoreV2) {
  return calculateCuratedProgress(hvpProgressAdapter, store);
}

export function getHvpProgressContribution(store: StoreV2): CuratedProgressContribution {
  const result = calculate(store);
  if (!result.ok) throw new Error('HVP_PROGRESS_CONTRIBUTION_UNAVAILABLE');
  const recommendation = hvpRecommendation(signals(result.summary));
  const active = result.summary.activeSession.state !== 'none';
  return {
    experienceId: hvpPracticeDefinition.summary.experienceId,
    moduleId: hvpPracticeDefinition.summary.moduleId,
    recommendationCandidates: recommendation ? [recommendation] : [],
    activity: result.summary.recentActivity,
    hasStoredData: active
      || result.summary.compatibleScoredResultCount > 0
      || result.summary.writtenSubmissions > 0
      || result.summary.omittedResultCount > 0,
    integrityOmissionCount: result.summary.omittedResultCount,
  };
}

export function HvpProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
}: {
  store: StoreV2;
  go: GoToRoute;
  variant: 'resume' | 'summary' | 'detail';
  legacyCandidates?: ProgressRecommendation[];
}) {
  const result = calculate(store);
  const nextAction = result.ok
    ? unifiedRecommendation(
      legacyCandidates.filter(
        (candidate) => candidate.moduleId === hvpPracticeDefinition.summary.moduleId,
      ),
      signals(result.summary),
    ) ?? hvpRecommendation(signals(result.summary))
    : undefined;
  return (
    <CuratedMasteryProgressPanel
      Status={HvpReleaseStatus}
      experience={hvpPracticeDefinition.summary}
      go={go}
      nextAction={nextAction}
      summaryResult={result}
      variant={variant}
    />
  );
}
