import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import type {
  CuratedProgressContribution,
  CuratedProgressModule,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import { autonomicPharmacologyPracticeDefinition } from '@/lib/assessment/autonomic-pharmacology/definition';
import { autonomicPharmacologyCuratedPracticeBlueprint } from '@/lib/assessment/autonomic-pharmacology/practiceBlueprint';
import { buildDraftOnlyAutonomicPharmacologyRegistry } from '@/lib/assessment/autonomic-pharmacology/registry';
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

const engineConfig: CuratedMasteryEngineConfig = {
  bank: autonomicPharmacologyCandidateBank,
  definition: autonomicPharmacologyPracticeDefinition,
  registryBuilder: buildDraftOnlyAutonomicPharmacologyRegistry,
  sectionLabels: {
    'pharm-adrenergic': 'Adrenergic pharmacology',
    'pharm-cholinergic': 'Cholinergic pharmacology',
  },
  maximumFamilyRepetition:
    autonomicPharmacologyCuratedPracticeBlueprint.maximumFamilyRepetition,
};

function AutonomicPharmacologyStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={autonomicPharmacologyPracticeDefinition.summary}
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

export function getAutonomicPharmacologyProgressContribution(
  store: StoreV2,
): CuratedProgressContribution {
  const result = calculate(store);
  if (!result.ok) {
    throw new Error('AUTONOMIC_PHARMACOLOGY_PROGRESS_CONTRIBUTION_UNAVAILABLE');
  }
  const recommendation = curatedRecommendation(
    autonomicPharmacologyPracticeDefinition.summary,
    signals(result.summary),
  );
  const active = result.summary.activeSession.state !== 'none';
  return {
    experienceId: autonomicPharmacologyPracticeDefinition.summary.experienceId,
    moduleId: autonomicPharmacologyPracticeDefinition.summary.moduleId,
    recommendationCandidates: recommendation ? [recommendation] : [],
    activity: result.summary.recentActivity,
    hasStoredData: active
      || result.summary.compatibleScoredResultCount > 0
      || result.summary.writtenSubmissions > 0
      || result.summary.omittedResultCount > 0,
    integrityOmissionCount: result.summary.omittedResultCount,
  };
}

export function AutonomicPharmacologyProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
}: CuratedProgressPanelProps) {
  const result = calculate(store);
  const nextAction = result.ok
    ? unifiedCuratedRecommendation(
      autonomicPharmacologyPracticeDefinition.summary,
      legacyCandidates.filter(
        (candidate) => (
          candidate.moduleId === autonomicPharmacologyPracticeDefinition.summary.moduleId
        ),
      ),
      signals(result.summary),
    )
    : undefined;
  return (
    <CuratedMasteryProgressPanel
      Status={AutonomicPharmacologyStatus}
      experience={autonomicPharmacologyPracticeDefinition.summary}
      go={go}
      nextAction={nextAction}
      summaryResult={result}
      variant={variant}
    />
  );
}

export const autonomicPharmacologyProgressModule: CuratedProgressModule = {
  ProgressPanel: AutonomicPharmacologyProgressPanel,
  getContribution: getAutonomicPharmacologyProgressContribution,
};
