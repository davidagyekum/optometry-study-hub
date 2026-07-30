import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import type {
  CuratedProgressContribution,
  CuratedProgressModule,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import { environmentalVisionPracticeDefinition } from '@/lib/assessment/environmental-vision/definition';
import { environmentalVisionCuratedPracticeBlueprint } from '@/lib/assessment/environmental-vision/practiceBlueprint';
import { buildDraftOnlyEnvironmentalVisionRegistry } from '@/lib/assessment/environmental-vision/registry';
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
  bank: environmentalVisionCandidateBank,
  definition: environmentalVisionPracticeDefinition,
  registryBuilder: buildDraftOnlyEnvironmentalVisionRegistry,
  sectionLabels: {
    'env-optics': 'Physical optics and ocular absorption',
    'env-task': 'Visual task analysis',
    'env-ergonomics': 'Visual ergonomics',
    'env-hazards': 'Ocular hazards and injury',
    'env-protection': 'Eye and face protection',
    'env-lighting': 'Workplace lighting',
  },
  maximumFamilyRepetition:
    environmentalVisionCuratedPracticeBlueprint.maximumFamilyRepetition,
};

function EnvironmentalVisionStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={environmentalVisionPracticeDefinition.summary}
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

export function getEnvironmentalVisionProgressContribution(
  store: StoreV2,
): CuratedProgressContribution {
  const result = calculate(store);
  if (!result.ok) {
    throw new Error('ENVIRONMENTAL_VISION_PROGRESS_CONTRIBUTION_UNAVAILABLE');
  }
  const recommendation = curatedRecommendation(
    environmentalVisionPracticeDefinition.summary,
    signals(result.summary),
  );
  const active = result.summary.activeSession.state !== 'none';
  return {
    experienceId: environmentalVisionPracticeDefinition.summary.experienceId,
    moduleId: environmentalVisionPracticeDefinition.summary.moduleId,
    recommendationCandidates: recommendation ? [recommendation] : [],
    activity: result.summary.recentActivity,
    hasStoredData: active
      || result.summary.compatibleScoredResultCount > 0
      || result.summary.writtenSubmissions > 0
      || result.summary.omittedResultCount > 0,
    integrityOmissionCount: result.summary.omittedResultCount,
  };
}

export function EnvironmentalVisionProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
}: CuratedProgressPanelProps) {
  const result = calculate(store);
  const nextAction = result.ok
    ? unifiedCuratedRecommendation(
      environmentalVisionPracticeDefinition.summary,
      legacyCandidates.filter(
        (candidate) => (
          candidate.moduleId === environmentalVisionPracticeDefinition.summary.moduleId
        ),
      ),
      signals(result.summary),
    )
    : undefined;
  return (
    <CuratedMasteryProgressPanel
      Status={EnvironmentalVisionStatus}
      experience={environmentalVisionPracticeDefinition.summary}
      go={go}
      nextAction={nextAction}
      summaryResult={result}
      variant={variant}
    />
  );
}

export const environmentalVisionProgressModule: CuratedProgressModule = {
  ProgressPanel: EnvironmentalVisionProgressPanel,
  getContribution: getEnvironmentalVisionProgressContribution,
};
