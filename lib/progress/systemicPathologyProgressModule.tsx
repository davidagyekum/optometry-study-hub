import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import type {
  CuratedProgressContribution,
  CuratedProgressModule,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import { systemicPathologyPracticeDefinition } from '@/lib/assessment/systemic-pathology/definition';
import { systemicPathologyCuratedPracticeBlueprint } from '@/lib/assessment/systemic-pathology/practiceBlueprint';
import { buildDraftOnlySystemicPathologyRegistry } from '@/lib/assessment/systemic-pathology/registry';
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
  bank: systemicPathologyCandidateBank,
  definition: systemicPathologyPracticeDefinition,
  registryBuilder: buildDraftOnlySystemicPathologyRegistry,
  sectionLabels: {
    'path-breast': 'Breast pathology',
    'path-cardio': 'Cardiovascular pathology',
    'path-endocrine': 'Endocrine pathology',
    'path-gi': 'Gastrointestinal pathology',
    'path-renal': 'Renal pathology',
  },
  maximumFamilyRepetition:
    systemicPathologyCuratedPracticeBlueprint.maximumFamilyRepetition,
};

function SystemicPathologyStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={systemicPathologyPracticeDefinition.summary}
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

export function getSystemicPathologyProgressContribution(
  store: StoreV2,
): CuratedProgressContribution {
  const result = calculate(store);
  if (!result.ok) {
    throw new Error('SYSTEMIC_PATHOLOGY_PROGRESS_CONTRIBUTION_UNAVAILABLE');
  }
  const recommendation = curatedRecommendation(
    systemicPathologyPracticeDefinition.summary,
    signals(result.summary),
  );
  const active = result.summary.activeSession.state !== 'none';
  return {
    experienceId: systemicPathologyPracticeDefinition.summary.experienceId,
    moduleId: systemicPathologyPracticeDefinition.summary.moduleId,
    recommendationCandidates: recommendation ? [recommendation] : [],
    activity: result.summary.recentActivity,
    hasStoredData: active
      || result.summary.compatibleScoredResultCount > 0
      || result.summary.writtenSubmissions > 0
      || result.summary.omittedResultCount > 0,
    integrityOmissionCount: result.summary.omittedResultCount,
  };
}

export function SystemicPathologyProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
}: CuratedProgressPanelProps) {
  const result = calculate(store);
  const nextAction = result.ok
    ? unifiedCuratedRecommendation(
      systemicPathologyPracticeDefinition.summary,
      legacyCandidates.filter(
        (candidate) => (
          candidate.moduleId === systemicPathologyPracticeDefinition.summary.moduleId
        ),
      ),
      signals(result.summary),
    )
    : undefined;
  return (
    <CuratedMasteryProgressPanel
      Status={SystemicPathologyStatus}
      experience={systemicPathologyPracticeDefinition.summary}
      go={go}
      nextAction={nextAction}
      summaryResult={result}
      variant={variant}
    />
  );
}

export const systemicPathologyProgressModule: CuratedProgressModule = {
  ProgressPanel: SystemicPathologyProgressPanel,
  getContribution: getSystemicPathologyProgressContribution,
};
