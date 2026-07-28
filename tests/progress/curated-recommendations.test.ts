import { describe, expect, it } from 'vitest';
import {
  hvpRecommendation,
  unifiedRecommendation,
  type HvpRecommendationSignals,
} from '@/lib/progress/curatedRecommendations';
import type { AssessmentAttemptSnapshot } from '@/lib/storage/schemas';
import type { ProgressRecommendation } from '@/lib/progress/types';

const base: HvpRecommendationSignals = {
  activeSession: { state: 'none' },
  retryMissedAvailable: 0,
  weakTopicAvailable: 0,
  unseenAvailable: 0,
  compatibleScoredResultCount: 0,
};
const attempt = {
  id: 'active-hvp',
  orderedQuestionIds: ['question'],
} as AssessmentAttemptSnapshot;
const legacy: ProgressRecommendation = {
  id: 'resume-legacy:ocular-adnexa',
  title: 'Resume legacy',
  reason: 'Saved',
  priority: 2,
  moduleId: 'ocular-adnexa',
  destination: { view: 'quiz', moduleId: 'ocular-adnexa' },
};

describe('curated and unified recommendation priority', () => {
  it.each([
    [{ ...base, activeSession: { state: 'scored-practice', attemptId: attempt.id, attempt } }, 'resume-hvp:active-hvp', 1],
    [{ ...base, activeSession: { state: 'written-practice', attemptId: attempt.id, attempt } }, 'resume-hvp:active-hvp', 1],
    [{ ...base, activeSession: { state: 'recovery-required', candidateCount: 2, issueCodes: ['PILOT_MULTIPLE_ACTIVE_ATTEMPTS'] as string[] } }, 'recover-hvp', 1],
    [{ ...base, retryMissedAvailable: 10 }, 'retry-missed-hvp', 3],
    [{ ...base, weakTopicAvailable: 10 }, 'weak-topics-hvp', 4],
    [{ ...base, unseenAvailable: 10 }, 'unseen-hvp', 5],
    [base, 'quick-hvp', 6],
  ] as const)('selects the highest eligible HVP tier for %#', (signals, id, priority) => {
    expect(hvpRecommendation(signals)).toMatchObject({ id, priority });
  });

  it('selects one global recommendation across HVP and legacy priorities', () => {
    expect(unifiedRecommendation([legacy], base)?.id).toBe(legacy.id);
    expect(unifiedRecommendation([legacy], {
      ...base,
      activeSession: { state: 'written-practice', attemptId: attempt.id, attempt },
    })?.priority).toBe(1);
    expect(unifiedRecommendation([legacy], {
      ...base,
      retryMissedAvailable: 10,
    })?.id).toBe(legacy.id);
  });

  it('does not recommend Quick after a compatible scored result exists', () => {
    expect(hvpRecommendation({
      ...base,
      compatibleScoredResultCount: 1,
    })).toBeUndefined();
  });

  it('uses strict availability thresholds deterministically', () => {
    const signals = {
      ...base,
      retryMissedAvailable: 9,
      weakTopicAvailable: 10,
      unseenAvailable: 118,
    };
    expect(hvpRecommendation(signals)?.id).toBe('weak-topics-hvp');
    expect(hvpRecommendation(signals)).toEqual(hvpRecommendation(signals));
  });
});
