import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import type {
  CuratedProgressContribution,
  CuratedProgressModule,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import { aqueousVitreousCuratedPracticeDefinition } from '@/lib/assessment/aqueous-vitreous-curated/definition';
import { aqueousVitreousCuratedPracticeBlueprint } from '@/lib/assessment/aqueous-vitreous-curated/practiceBlueprint';
import { buildDraftOnlyAqueousVitreousCuratedRegistry } from '@/lib/assessment/aqueous-vitreous-curated/registry';
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
  bank: aqueousVitreousCandidateBank,
  definition: aqueousVitreousCuratedPracticeDefinition,
  registryBuilder: buildDraftOnlyAqueousVitreousCuratedRegistry,
  sectionLabels: {
    'media-chambers': 'Ocular media and chambers',
  production: 'Aqueous production and functions',
  flow: 'Aqueous flow and drainage',
  iop: 'Intraocular pressure',
  'vitreous-anatomy': 'Vitreous anatomy and attachments',
  'vitreous-clinical': 'Vitreous ageing and clinical change',
  },
  maximumFamilyRepetition:
    aqueousVitreousCuratedPracticeBlueprint.maximumFamilyRepetition,
};

function AqueousVitreousStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={aqueousVitreousCuratedPracticeDefinition.summary}
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

export function getAqueousVitreousCuratedProgressContribution(
  store: StoreV2,
): CuratedProgressContribution {
  const result = calculate(store);
  if (!result.ok) {
    throw new Error('AQUEOUS_VITREOUS_CURATED_PROGRESS_CONTRIBUTION_UNAVAILABLE');
  }
  const recommendation = curatedRecommendation(
    aqueousVitreousCuratedPracticeDefinition.summary,
    signals(result.summary),
  );
  const active = result.summary.activeSession.state !== 'none';
  return {
    experienceId: aqueousVitreousCuratedPracticeDefinition.summary.experienceId,
    moduleId: aqueousVitreousCuratedPracticeDefinition.summary.moduleId,
    recommendationCandidates: recommendation ? [recommendation] : [],
    activity: result.summary.recentActivity,
    hasStoredData: active
      || result.summary.compatibleScoredResultCount > 0
      || result.summary.writtenSubmissions > 0
      || result.summary.omittedResultCount > 0,
    integrityOmissionCount: result.summary.omittedResultCount,
  };
}

export function AqueousVitreousCuratedProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
}: CuratedProgressPanelProps) {
  const result = calculate(store);
  const nextAction = result.ok
    ? unifiedCuratedRecommendation(
      aqueousVitreousCuratedPracticeDefinition.summary,
      legacyCandidates.filter(
        (candidate) => (
          candidate.moduleId === aqueousVitreousCuratedPracticeDefinition.summary.moduleId
        ),
      ),
      signals(result.summary),
    )
    : undefined;
  return (
    <CuratedMasteryProgressPanel
      Status={AqueousVitreousStatus}
      experience={aqueousVitreousCuratedPracticeDefinition.summary}
      go={go}
      nextAction={nextAction}
      summaryResult={result}
      variant={variant}
    />
  );
}

export const aqueousVitreousCuratedProgressModule: CuratedProgressModule = {
  ProgressPanel: AqueousVitreousCuratedProgressPanel,
  getContribution: getAqueousVitreousCuratedProgressContribution,
};
