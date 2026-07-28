import type {
  MasteryEvidence,
  MasteryLevel,
  QuestionMasteryEvidence,
} from '@/lib/progress/types';

export function accuracyPercentage(earned: number, possible: number): number | undefined {
  return possible > 0 ? (earned / possible) * 100 : undefined;
}

export function questionMastery(
  evidence: Pick<
    QuestionMasteryEvidence,
    'encounterCount' | 'gradableAttemptCount' | 'answeredAccuracy' | 'lastStatus'
  >,
): MasteryLevel {
  if (evidence.encounterCount === 0) return 'unseen';
  const accuracy = evidence.answeredAccuracy ?? 0;
  if (evidence.gradableAttemptCount < 2 || accuracy < 60) return 'learning';
  if (accuracy < 75) return 'developing';
  if (
    accuracy < 90
    || evidence.gradableAttemptCount < 3
    || evidence.lastStatus !== 'correct'
  ) return 'proficient';
  return 'mastered';
}

export function groupMastery(evidence: MasteryEvidence): MasteryLevel {
  if (evidence.coveragePercentage === 0) return 'unseen';
  const accuracy = evidence.answeredAccuracy ?? 0;
  if (
    evidence.gradableEncounterCount < 3
    || evidence.distinctGradableQuestions < 2
    || accuracy < 60
    || evidence.coveragePercentage < 25
  ) return 'learning';
  if (accuracy < 75) return 'developing';
  if (
    accuracy < 90
    || evidence.coveragePercentage < 60
    || evidence.distinctGradableQuestions < 3
    || evidence.recentMissCount > 0
  ) return 'proficient';
  if (
    evidence.gradableEncounterCount >= 5
    && evidence.recentMissCount === 0
  ) return 'mastered';
  return 'proficient';
}
