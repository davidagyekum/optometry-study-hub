import { HVP_CURATED_PRACTICE_ID } from '@/lib/assessment/hvp/config';
import { selectRecommendation } from '@/lib/progress/recommendations';
import type {
  HvpActiveSession,
  ProgressRecommendation,
} from '@/lib/progress/types';

export type HvpRecommendationSignals = {
  activeSession: HvpActiveSession;
  retryMissedAvailable: number;
  weakTopicAvailable: number;
  unseenAvailable: number;
  compatibleScoredResultCount: number;
};

export function hvpRecommendation(
  signals: HvpRecommendationSignals,
): ProgressRecommendation | undefined {
  const moduleId = 'human-visual-perception';
  if (signals.activeSession.state === 'recovery-required') {
    return {
      id: 'recover-hvp',
      title: 'Recover saved HVP practice',
      reason: 'Saved HVP practice needs confirmation before it can be resumed or replaced.',
      priority: 1,
      moduleId,
      destination: { view: 'practice', moduleId: HVP_CURATED_PRACTICE_ID },
    };
  }
  if (
    signals.activeSession.state === 'scored-practice'
    || signals.activeSession.state === 'written-practice'
  ) {
    return {
      id: `resume-hvp:${signals.activeSession.attemptId}`,
      title: signals.activeSession.state === 'written-practice'
        ? 'Resume HVP Written Practice'
        : 'Resume current curated practice',
      reason: 'An unfinished compatible session is saved on this browser.',
      priority: 1,
      moduleId,
      destination: { view: 'assessment', moduleId: signals.activeSession.attemptId },
    };
  }
  if (signals.retryMissedAvailable >= 10) {
    return {
      id: 'retry-missed-hvp',
      title: 'Retry missed HVP questions',
      reason: `${signals.retryMissedAvailable} family-compatible questions are available.`,
      priority: 3,
      moduleId,
      destination: { view: 'practice', moduleId: HVP_CURATED_PRACTICE_ID },
    };
  }
  if (signals.weakTopicAvailable >= 10) {
    return {
      id: 'weak-topics-hvp',
      title: 'Practice weak HVP topics',
      reason: `${signals.weakTopicAvailable} family-compatible questions are available.`,
      priority: 4,
      moduleId,
      destination: { view: 'practice', moduleId: HVP_CURATED_PRACTICE_ID },
    };
  }
  if (signals.unseenAvailable >= 10) {
    return {
      id: 'unseen-hvp',
      title: 'Practice unseen HVP questions',
      reason: `${signals.unseenAvailable} family-compatible questions are available.`,
      priority: 5,
      moduleId,
      destination: { view: 'practice', moduleId: HVP_CURATED_PRACTICE_ID },
    };
  }
  if (signals.compatibleScoredResultCount === 0) {
    return {
      id: 'quick-hvp',
      title: 'Start HVP Quick practice',
      reason: 'Begin curated practice with a 10-question session.',
      priority: 6,
      moduleId,
      destination: { view: 'practice', moduleId: HVP_CURATED_PRACTICE_ID },
    };
  }
  return undefined;
}

export function unifiedRecommendation(
  legacyCandidates: ProgressRecommendation[],
  signals: HvpRecommendationSignals,
): ProgressRecommendation | undefined {
  const curated = hvpRecommendation(signals);
  return selectRecommendation(curated ? [...legacyCandidates, curated] : legacyCandidates);
}
