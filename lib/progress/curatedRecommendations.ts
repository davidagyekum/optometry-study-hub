import type {
  ProgressRecommendation,
} from '@/lib/progress/types';

export type HvpRecommendationSignals = {
  activeAttemptId?: string;
  retryMissedAvailable: number;
  weakTopicAvailable: number;
  unseenAvailable: number;
  compatibleScoredResultCount: number;
};

export function hvpRecommendation(
  signals: HvpRecommendationSignals,
): ProgressRecommendation {
  const moduleId = 'human-visual-perception';
  if (signals.activeAttemptId) {
    return {
      id: 'resume-hvp',
      title: 'Resume current curated practice',
      reason: 'An unfinished controlled session is saved on this browser.',
      priority: 1,
      moduleId,
      destination: { view: 'assessment', moduleId: signals.activeAttemptId },
    };
  }
  if (signals.retryMissedAvailable >= 10) {
    return {
      id: 'retry-missed-hvp',
      title: 'Retry missed HVP questions',
      reason: `${signals.retryMissedAvailable} family-compatible questions are available.`,
      priority: 3,
      moduleId,
      destination: { view: 'practice', moduleId: 'human-visual-perception-curated' },
    };
  }
  if (signals.weakTopicAvailable >= 10) {
    return {
      id: 'weak-topics-hvp',
      title: 'Practice weak HVP topics',
      reason: `${signals.weakTopicAvailable} family-compatible questions are available.`,
      priority: 4,
      moduleId,
      destination: { view: 'practice', moduleId: 'human-visual-perception-curated' },
    };
  }
  if (signals.unseenAvailable >= 10) {
    return {
      id: 'unseen-hvp',
      title: 'Practice unseen HVP questions',
      reason: `${signals.unseenAvailable} family-compatible questions are available.`,
      priority: 5,
      moduleId,
      destination: { view: 'practice', moduleId: 'human-visual-perception-curated' },
    };
  }
  return {
    id: 'quick-hvp',
    title: 'Start HVP Quick practice',
    reason: signals.compatibleScoredResultCount
      ? 'Build more current-version evidence with a 10-question session.'
      : 'Begin curated practice with a 10-question session.',
    priority: 6,
    moduleId,
    destination: { view: 'practice', moduleId: 'human-visual-perception-curated' },
  };
}
