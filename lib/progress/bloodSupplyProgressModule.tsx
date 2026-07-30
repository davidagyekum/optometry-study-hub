import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import type {
  CuratedProgressContribution,
  CuratedProgressModule,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import { bloodSupplyPracticeDefinition } from '@/lib/assessment/blood-supply/definition';
import { bloodSupplyCuratedPracticeBlueprint } from '@/lib/assessment/blood-supply/practiceBlueprint';
import { buildDraftOnlyBloodSupplyRegistry } from '@/lib/assessment/blood-supply/registry';
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
  bank: bloodSupplyCandidateBank,
  definition: bloodSupplyPracticeDefinition,
  registryBuilder: buildDraftOnlyBloodSupplyRegistry,
  sectionLabels: {
    'arterial-origins': 'Ophthalmic artery and arterial origins',
    ciliary: 'Posterior ciliary and uveal circulation',
    retinal: 'Retinal circulation and foveal avascular zone',
    barriers: 'Blood-retina barriers and capillary types',
    microcirculation: 'Retinal microcirculation and exchange',
    'clinical-blood': 'Clinical vascular localization',
  },
  maximumFamilyRepetition:
    bloodSupplyCuratedPracticeBlueprint.maximumFamilyRepetition,
};

function BloodSupplyStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={bloodSupplyPracticeDefinition.summary}
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

export function getBloodSupplyProgressContribution(
  store: StoreV2,
): CuratedProgressContribution {
  const result = calculate(store);
  if (!result.ok) {
    throw new Error('BLOOD_SUPPLY_PROGRESS_CONTRIBUTION_UNAVAILABLE');
  }
  const recommendation = curatedRecommendation(
    bloodSupplyPracticeDefinition.summary,
    signals(result.summary),
  );
  const active = result.summary.activeSession.state !== 'none';
  return {
    experienceId: bloodSupplyPracticeDefinition.summary.experienceId,
    moduleId: bloodSupplyPracticeDefinition.summary.moduleId,
    recommendationCandidates: recommendation ? [recommendation] : [],
    activity: result.summary.recentActivity,
    hasStoredData: active
      || result.summary.compatibleScoredResultCount > 0
      || result.summary.writtenSubmissions > 0
      || result.summary.omittedResultCount > 0,
    integrityOmissionCount: result.summary.omittedResultCount,
  };
}

export function BloodSupplyProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
}: CuratedProgressPanelProps) {
  const result = calculate(store);
  const nextAction = result.ok
    ? unifiedCuratedRecommendation(
      bloodSupplyPracticeDefinition.summary,
      legacyCandidates.filter(
        (candidate) => (
          candidate.moduleId === bloodSupplyPracticeDefinition.summary.moduleId
        ),
      ),
      signals(result.summary),
    )
    : undefined;
  return (
    <CuratedMasteryProgressPanel
      Status={BloodSupplyStatus}
      experience={bloodSupplyPracticeDefinition.summary}
      go={go}
      nextAction={nextAction}
      summaryResult={result}
      variant={variant}
    />
  );
}

export const bloodSupplyProgressModule: CuratedProgressModule = {
  ProgressPanel: BloodSupplyProgressPanel,
  getContribution: getBloodSupplyProgressContribution,
};
