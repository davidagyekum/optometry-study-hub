import type { ComponentType } from 'react';
import type { PracticeStrategy } from '@/lib/assessment/practice/types';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionIssue, SessionResult } from '@/lib/assessment/session/types';
import type { Difficulty, QuestionFormat } from '@/lib/assessment/types';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

export type CuratedPracticeRequest = {
  profileId: 'quick' | 'standard' | 'full' | 'targeted' | 'custom' | 'written';
  strategy?: PracticeStrategy;
  requestedCount?: number;
  sectionIds?: string[];
  formats?: QuestionFormat[];
  difficulties?: Difficulty[];
  seed?: string;
};

export type CuratedAvailability = {
  unseen: number;
  missed: number;
  weakTopics: number;
  challenge: number;
};

export type CuratedAttemptSelection = {
  candidates: AssessmentAttemptSnapshot[];
  compatibleAttempt?: AssessmentAttemptSnapshot;
  issues: SessionIssue[];
};

export type CuratedLearnerConfig = {
  labels: Readonly<Record<string, string>>;
  sectionIds: readonly string[];
  automaticFormats: readonly QuestionFormat[];
  difficulties: readonly Difficulty[];
  questionPoolSize: number;
  scoredFormatCount: number;
  fullQuestionCount: number;
  quickQuestionCount: number;
  standardQuestionCount: number;
  targetedQuestionCount: number;
  writtenQuestionCount?: number;
  customMinimumCount: number;
  customMaximumCount: number;
  landingHeading: string;
  landingDescription: string;
  fullContractDescription: string;
  notesLabel: string;
  statusComponent: ComponentType<{ compact?: boolean }>;
};

export type CuratedPracticeDefinition = {
  summary: CuratedExperienceSummary;
  automaticBlueprintId: string;
  writtenBlueprintId?: string;
  registryResult: SessionResult<QuestionRegistry>;
  learner: CuratedLearnerConfig;
  defaultRequest: () => CuratedPracticeRequest;
  replacementRequest: (
    attempt: AssessmentAttemptSnapshot | undefined,
  ) => CuratedPracticeRequest;
  createAttempt: (
    request: CuratedPracticeRequest,
    store: StoreV2,
    registry: QuestionRegistry,
  ) => SessionResult<AssessmentAttemptSnapshot>;
  validateAttempt: (
    attempt: AssessmentAttemptSnapshot,
    registry: QuestionRegistry,
  ) => SessionResult<unknown>;
  validateResult: (
    result: AssessmentResultSnapshot,
    registry: QuestionRegistry,
  ) => SessionResult<unknown>;
  historyPolicy: (
    attempt: AssessmentAttemptSnapshot,
  ) => 'disabled' | 'scored' | 'encounter-and-manual';
  availability: (store: StoreV2) => CuratedAvailability;
};
