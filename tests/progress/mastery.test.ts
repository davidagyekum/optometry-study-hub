import { describe, expect, it } from 'vitest';
import { groupMastery, questionMastery } from '@/lib/progress/mastery';
import type { MasteryEvidence } from '@/lib/progress/types';

const question = (
  encounterCount: number,
  gradableAttemptCount: number,
  answeredAccuracy: number | undefined,
  lastStatus = 'correct',
) => ({ encounterCount, gradableAttemptCount, answeredAccuracy, lastStatus });

const group = (overrides: Partial<MasteryEvidence> = {}): MasteryEvidence => ({
  eligibleQuestionCount: 10,
  distinctQuestionsEncountered: 6,
  distinctGradableQuestions: 3,
  coveragePercentage: 60,
  gradableEncounterCount: 5,
  earnedPoints: 9,
  possiblePoints: 10,
  answeredAccuracy: 90,
  recentMissCount: 0,
  ...overrides,
});

describe('question mastery boundaries', () => {
  it.each([
    [question(0, 0, undefined), 'unseen'],
    [question(1, 1, 100), 'learning'],
    [question(2, 2, 59), 'learning'],
    [question(2, 2, 60), 'developing'],
    [question(2, 2, 74), 'developing'],
    [question(2, 2, 75), 'proficient'],
    [question(2, 2, 90), 'proficient'],
    [question(3, 3, 90, 'correct'), 'mastered'],
    [question(3, 3, 90, 'partial'), 'proficient'],
    [question(3, 3, 90, 'incorrect'), 'proficient'],
  ])('classifies %# exactly', (evidence, expected) => {
    expect(questionMastery(evidence)).toBe(expected);
  });
});

describe('group mastery boundaries', () => {
  it.each([
    [group({ coveragePercentage: 0 }), 'unseen'],
    [group({ coveragePercentage: 24 }), 'learning'],
    [group({ coveragePercentage: 25, answeredAccuracy: 60 }), 'developing'],
    [group({ coveragePercentage: 59, answeredAccuracy: 90 }), 'proficient'],
    [group({ coveragePercentage: 60 }), 'mastered'],
    [group({ distinctGradableQuestions: 2 }), 'proficient'],
    [group({ gradableEncounterCount: 4 }), 'proficient'],
    [group({ gradableEncounterCount: 5 }), 'mastered'],
    [group({ recentMissCount: 1 }), 'proficient'],
    [group({ recentMissCount: 0 }), 'mastered'],
  ])('classifies %# exactly', (evidence, expected) => {
    expect(groupMastery(evidence)).toBe(expected);
  });
});
