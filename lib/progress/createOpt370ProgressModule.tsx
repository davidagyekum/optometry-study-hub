import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import type {
  CuratedProgressContribution,
  CuratedProgressModule,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import type { Opt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import {
  calculateCuratedMasteryProgress,
  type CuratedMasteryEngineConfig,
} from '@/lib/progress/curatedMasteryEngine';
import {
  curatedRecommendation,
  unifiedCuratedRecommendation,
} from '@/lib/progress/curatedRecommendation';
import type { CuratedMasterySummary } from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export function createOpt370ProgressModule(
  experience: Opt370PracticeExperience,
): CuratedProgressModule {
  const engineConfig: CuratedMasteryEngineConfig = {
    bank: experience.bank,
    definition: experience.definition,
    registryBuilder: experience.registryBuilder,
    sectionLabels: experience.sectionLabels,
    maximumFamilyRepetition: experience.automaticBlueprint.maximumFamilyRepetition,
  };

  function Status({ compact = false }: { compact?: boolean }) {
    return (
      <CuratedReleaseStatus
        compact={compact}
        summary={experience.definition.summary}
      />
    );
  }

  function calculate(store: StoreV2) {
    return calculateCuratedMasteryProgress(engineConfig, store);
  }

  function signals(summary: CuratedMasterySummary) {
    return {
      activeSession: summary.activeSession,
      retryMissedAvailable: summary.retryMissedAvailable,
      weakTopicAvailable: summary.weakTopicAvailable,
      unseenAvailable: summary.unseenAvailable,
      compatibleScoredResultCount: summary.compatibleScoredResultCount,
    };
  }

  function getContribution(store: StoreV2): CuratedProgressContribution {
    const result = calculate(store);
    if (!result.ok) throw new Error('OPT370_PROGRESS_CONTRIBUTION_UNAVAILABLE');
    const recommendation = curatedRecommendation(
      experience.definition.summary,
      signals(result.summary),
    );
    const active = result.summary.activeSession.state !== 'none';
    return {
      experienceId: experience.definition.summary.experienceId,
      moduleId: experience.definition.summary.moduleId,
      recommendationCandidates: recommendation ? [recommendation] : [],
      activity: result.summary.recentActivity,
      hasStoredData: active
        || result.summary.compatibleScoredResultCount > 0
        || result.summary.writtenSubmissions > 0
        || result.summary.omittedResultCount > 0,
      integrityOmissionCount: result.summary.omittedResultCount,
    };
  }

  function ProgressPanel({
    store,
    go,
    variant,
    legacyCandidates = [],
  }: CuratedProgressPanelProps) {
    const result = calculate(store);
    const nextAction = result.ok
      ? unifiedCuratedRecommendation(
        experience.definition.summary,
        legacyCandidates.filter(
          (candidate) => candidate.moduleId === experience.definition.summary.moduleId,
        ),
        signals(result.summary),
      )
      : undefined;
    return (
      <CuratedMasteryProgressPanel
        Status={Status}
        experience={experience.definition.summary}
        go={go}
        nextAction={nextAction}
        summaryResult={result}
        variant={variant}
      />
    );
  }

  return { ProgressPanel, getContribution };
}
