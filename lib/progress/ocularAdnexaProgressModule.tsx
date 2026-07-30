import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { CuratedMasteryProgressPanel } from '@/components/progress/CuratedMasteryProgressPanel';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import type {
  CuratedProgressContribution,
  CuratedProgressModule,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';
import { ocularAdnexaPracticeDefinition } from '@/lib/assessment/ocular-adnexa/definition';
import { ocularAdnexaCuratedPracticeBlueprint } from '@/lib/assessment/ocular-adnexa/practiceBlueprint';
import { buildDraftOnlyOcularAdnexaRegistry } from '@/lib/assessment/ocular-adnexa/registry';
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
  bank: ocularAdnexaCandidateBank,
  definition: ocularAdnexaPracticeDefinition,
  registryBuilder: buildDraftOnlyOcularAdnexaRegistry,
  sectionLabels: {
    landmarks: 'Landmarks and topography',
    muscles: 'Skin, lashes and muscles',
    'tarsus-glands': 'Tarsus, conjunctiva and glands',
    'lower-lid-blood': 'Lower lid and blood supply',
    'lacrimal-gland': 'Lacrimal gland',
    tears: 'Tear film and drainage',
  },
  maximumFamilyRepetition:
    ocularAdnexaCuratedPracticeBlueprint.maximumFamilyRepetition,
};

function OcularAdnexaStatus({ compact = false }: { compact?: boolean }) {
  return (
    <CuratedReleaseStatus
      compact={compact}
      summary={ocularAdnexaPracticeDefinition.summary}
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

export function getOcularAdnexaProgressContribution(
  store: StoreV2,
): CuratedProgressContribution {
  const result = calculate(store);
  if (!result.ok) {
    throw new Error('OCULAR_ADNEXA_PROGRESS_CONTRIBUTION_UNAVAILABLE');
  }
  const recommendation = curatedRecommendation(
    ocularAdnexaPracticeDefinition.summary,
    signals(result.summary),
  );
  const active = result.summary.activeSession.state !== 'none';
  return {
    experienceId: ocularAdnexaPracticeDefinition.summary.experienceId,
    moduleId: ocularAdnexaPracticeDefinition.summary.moduleId,
    recommendationCandidates: recommendation ? [recommendation] : [],
    activity: result.summary.recentActivity,
    hasStoredData: active
      || result.summary.compatibleScoredResultCount > 0
      || result.summary.writtenSubmissions > 0
      || result.summary.omittedResultCount > 0,
    integrityOmissionCount: result.summary.omittedResultCount,
  };
}

export function OcularAdnexaProgressPanel({
  store,
  go,
  variant,
  legacyCandidates = [],
}: CuratedProgressPanelProps) {
  const result = calculate(store);
  const nextAction = result.ok
    ? unifiedCuratedRecommendation(
      ocularAdnexaPracticeDefinition.summary,
      legacyCandidates.filter(
        (candidate) => (
          candidate.moduleId === ocularAdnexaPracticeDefinition.summary.moduleId
        ),
      ),
      signals(result.summary),
    )
    : undefined;
  return (
    <CuratedMasteryProgressPanel
      Status={OcularAdnexaStatus}
      experience={ocularAdnexaPracticeDefinition.summary}
      go={go}
      nextAction={nextAction}
      summaryResult={result}
      variant={variant}
    />
  );
}

export const ocularAdnexaProgressModule: CuratedProgressModule = {
  ProgressPanel: OcularAdnexaProgressPanel,
  getContribution: getOcularAdnexaProgressContribution,
};
