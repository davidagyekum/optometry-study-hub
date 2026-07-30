import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import { selectRecommendation } from '@/lib/progress/recommendations';
import type {
  HvpActiveSession,
  ProgressRecommendation,
} from '@/lib/progress/types';

export type CuratedRecommendationSignals = {
  activeSession: HvpActiveSession;
  retryMissedAvailable: number;
  weakTopicAvailable: number;
  unseenAvailable: number;
  compatibleScoredResultCount: number;
};

export function curatedRecommendation(
  experience: CuratedExperienceSummary,
  signals: CuratedRecommendationSignals,
  minimumTargetedCount = 10,
): ProgressRecommendation | undefined {
  const moduleId = experience.moduleId;
  const route = {
    view: 'practice' as const,
    moduleId: experience.routeSegment,
  };
  if (signals.activeSession.state === 'recovery-required') {
    return {
      id: `recover:${experience.experienceId}`,
      title: `Recover saved ${experience.shortTitle}`,
      reason: 'Saved curated practice needs confirmation before it can continue.',
      priority: 1,
      moduleId,
      destination: route,
    };
  }
  if (
    signals.activeSession.state === 'scored-practice'
    || signals.activeSession.state === 'written-practice'
  ) {
    return {
      id: `resume:${experience.experienceId}:${signals.activeSession.attemptId}`,
      title: signals.activeSession.state === 'written-practice'
        ? `Resume ${experience.shortTitle} written practice`
        : `Resume ${experience.shortTitle}`,
      reason: 'An unfinished compatible session is saved on this browser.',
      priority: 1,
      moduleId,
      destination: {
        view: 'assessment',
        moduleId: signals.activeSession.attemptId,
      },
    };
  }
  const targeted: Array<{
    count: number;
    id: string;
    title: string;
    priority: number;
  }> = [
    {
      count: signals.retryMissedAvailable,
      id: 'retry-missed',
      title: `Retry missed ${experience.shortTitle} questions`,
      priority: 3,
    },
    {
      count: signals.weakTopicAvailable,
      id: 'weak-topics',
      title: `Practice weak ${experience.shortTitle} topics`,
      priority: 4,
    },
    {
      count: signals.unseenAvailable,
      id: 'unseen',
      title: `Practice unseen ${experience.shortTitle} questions`,
      priority: 5,
    },
  ];
  const available = targeted.find(
    (candidate) => candidate.count >= minimumTargetedCount,
  );
  if (available) {
    return {
      id: `${available.id}:${experience.experienceId}`,
      title: available.title,
      reason: `${available.count} family-compatible questions are available.`,
      priority: available.priority,
      moduleId,
      destination: route,
    };
  }
  if (signals.compatibleScoredResultCount === 0) {
    return {
      id: `quick:${experience.experienceId}`,
      title: `Start ${experience.shortTitle} Quick practice`,
      reason: `Begin curated practice with a ${minimumTargetedCount}-question session.`,
      priority: 6,
      moduleId,
      destination: route,
    };
  }
  return undefined;
}

export function unifiedCuratedRecommendation(
  experience: CuratedExperienceSummary,
  legacyCandidates: ProgressRecommendation[],
  signals: CuratedRecommendationSignals,
  minimumTargetedCount = 10,
): ProgressRecommendation | undefined {
  const curated = curatedRecommendation(
    experience,
    signals,
    minimumTargetedCount,
  );
  return selectRecommendation(
    curated ? [...legacyCandidates, curated] : legacyCandidates,
  );
}
