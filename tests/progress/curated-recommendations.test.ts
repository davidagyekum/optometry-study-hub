import { describe, expect, it } from 'vitest';
import {
  hvpRecommendation,
} from '@/lib/progress/curatedRecommendations';

const base = {
  retryMissedAvailable: 0,
  weakTopicAvailable: 0,
  unseenAvailable: 0,
  compatibleScoredResultCount: 0,
};

describe('curated recommendation priority', () => {
  it.each([
    [{ ...base, activeAttemptId: 'active-hvp' }, 'resume-hvp', 1],
    [{ ...base, retryMissedAvailable: 10 }, 'retry-missed-hvp', 3],
    [{ ...base, weakTopicAvailable: 10 }, 'weak-topics-hvp', 4],
    [{ ...base, unseenAvailable: 10 }, 'unseen-hvp', 5],
    [base, 'quick-hvp', 6],
  ])('selects the highest eligible tier for %#', (signals, id, priority) => {
    expect(hvpRecommendation(signals)).toMatchObject({ id, priority });
  });

  it('uses strict availability thresholds deterministically', () => {
    expect(hvpRecommendation({
      ...base,
      retryMissedAvailable: 9,
      weakTopicAvailable: 10,
      unseenAvailable: 118,
    }).id).toBe('weak-topics-hvp');
    expect(hvpRecommendation({
      ...base,
      retryMissedAvailable: 9,
      weakTopicAvailable: 9,
      unseenAvailable: 9,
    })).toEqual(hvpRecommendation({
      ...base,
      retryMissedAvailable: 9,
      weakTopicAvailable: 9,
      unseenAvailable: 9,
    }));
  });
});
