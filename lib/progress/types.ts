import type { AssessmentAttemptSnapshot } from '@/lib/storage/schemas';
import type { Result } from '@/lib/legacy/types';

export type MasteryLevel =
  | 'unseen'
  | 'learning'
  | 'developing'
  | 'proficient'
  | 'mastered';

export type LegacyModuleAnalytics = {
  moduleId: string;
  readingCompleted: number;
  readingTotal: number;
  readingPercentage: number;
  activeAttempt?: {
    id: string;
    answeredCount: number;
    flaggedCount: number;
    startedAt: string;
  };
  savedResultCount: number;
  latestResult?: Result;
  latestPercentage?: number;
  bestPercentage?: number;
  recentAveragePercentage?: number;
  lastSubmittedAt?: string;
};

export type LegacyCourseAnalytics = {
  courseId: string;
  readingCompleted: number;
  readingTotal: number;
  readingPercentage: number;
  savedResultCount: number;
  latestResult?: Result;
  latestPercentage?: number;
  bestPercentage?: number;
  recentAveragePercentage?: number;
  activeModuleCount: number;
};

export type MasteryEvidence = {
  eligibleQuestionCount: number;
  distinctQuestionsEncountered: number;
  distinctGradableQuestions: number;
  coveragePercentage: number;
  gradableEncounterCount: number;
  earnedPoints: number;
  possiblePoints: number;
  answeredAccuracy?: number;
  recentMissCount: number;
  lastActivity?: string;
};

export type QuestionMasteryEvidence = {
  questionId: string;
  version: number;
  sectionId: string;
  objectiveId: string;
  format: string;
  difficulty: string;
  bloomLevel: string;
  encounterCount: number;
  gradableAttemptCount: number;
  earnedPoints: number;
  possiblePoints: number;
  answeredAccuracy?: number;
  unansweredCount: number;
  lastStatus?: string;
  lastActivity?: string;
  limitedAccuracyEvidence: boolean;
  mastery: MasteryLevel;
};

export type MasteryGroup = MasteryEvidence & {
  id: string;
  label: string;
  mastery: MasteryLevel;
};

export type ProgressActivity = {
  id: string;
  kind:
    | 'legacy-started'
    | 'legacy-completed'
    | 'curated-started'
    | 'curated-completed'
    | 'written-completed';
  moduleId: string;
  timestamp: string;
  label: string;
  scorePercentage?: number;
  destination: { view: string; moduleId: string };
};

export type ProgressRecommendation = {
  id: string;
  title: string;
  reason: string;
  priority: number;
  moduleId: string;
  destination: { view: string; moduleId: string };
};

export type CompatibleCuratedResult = {
  resultId: string;
  submittedAt: string;
  profile: string;
  strategy: string;
  questionCount: number;
  percentage: number;
};

export type HvpCuratedSummary = {
  compatibleScoredResultCount: number;
  omittedResultCount: number;
  integrityIssueCategories: Record<string, number>;
  latestPercentage?: number;
  bestPercentage?: number;
  averageSessionPercentage?: number;
  weightedAnsweredAccuracy?: number;
  lastSubmittedAt?: string;
  activePractice?: AssessmentAttemptSnapshot;
  distinctCurrentQuestionsEncountered: number;
  eligibleAutomaticQuestionTotal: number;
  coveragePercentage: number;
  gradableAnsweredEncounters: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  unansweredCount: number;
  profileDistribution: Record<string, number>;
  strategyDistribution: Record<string, number>;
  retryMissedAvailable: number;
  weakTopicAvailable: number;
  unseenAvailable: number;
  writtenSubmissions: number;
  latestWrittenSubmissionAt?: string;
  writtenResponsesSupplied: number;
  writtenUnansweredPrompts: number;
  questions: QuestionMasteryEvidence[];
  sections: MasteryGroup[];
  objectives: MasteryGroup[];
  formats: MasteryGroup[];
  difficulties: MasteryGroup[];
  bloomLevels: MasteryGroup[];
  masteryDistribution: Record<MasteryLevel, number>;
  recentSessions: CompatibleCuratedResult[];
};
