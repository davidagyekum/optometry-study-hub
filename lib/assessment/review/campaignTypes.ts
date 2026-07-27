import type {
  BloomLevel,
  Difficulty,
  QuestionFormat,
} from '@/lib/assessment/types';
import type { AikenValue } from './types';

export type ReviewerRole =
  | 'subject-matter-expert'
  | 'assessment-reviewer'
  | 'accessibility-reviewer'
  | 'image-rights-reviewer'
  | 'review-chair';

export type ReviewerProfile = {
  schemaVersion: 1;
  id: string;
  roles: ReviewerRole[];
  expertiseTags: string[];
  independentReviewAttestation: boolean;
  conflictOfInterest:
    | { status: 'none' }
    | { status: 'declared'; description: string };
  consentToAttribution: boolean;
  displayName?: string;
  affiliation?: string;
};

export type ContentReviewPolicy = {
  schemaVersion: 1;
  id: string;
  version: number;
  minimumUniqueReviewers: number;
  flagBelowAikenV: number;
  lowRatingAtOrBelow: number;
  requiredUniversalCriteria: string[];
  requiredFormatCriteria: Record<QuestionFormat, string[]>;
  blockingCriteria: string[];
};

export type ReviewCampaignQuestion = {
  questionId: string;
  questionVersion: number;
  questionHash: string;
  applicableCriteria: string[];
};

export type ReviewCampaignManifest = {
  schemaVersion: 1;
  id: string;
  campaignHash: string;
  bankId: string;
  bankHash: string;
  policy: { id: string; version: number };
  policyHash: string;
  createdAt: string;
  questions: ReviewCampaignQuestion[];
  reviewers: ReviewerProfile[];
};

export type ReviewSubmission = {
  campaignId: string;
  campaignHash: string;
  bankId: string;
  questionId: string;
  questionVersion: number;
  questionHash: string;
  sectionId: string;
  objectiveId: string;
  format: QuestionFormat;
  bloomLevel: BloomLevel;
  difficulty: Difficulty;
  criterion: string;
  reviewerId: string;
  rating?: number;
  comment?: string;
};

export type ReviewPackEntry = Omit<ReviewSubmission, 'rating' | 'comment'> & {
  rating: string;
  comment: string;
};

export type ReviewSourcePackReceipt = {
  reviewerId: string;
  packHash: string;
  rowCount: number;
};

export type MergedReviewSubmissions = {
  schemaVersion: 1;
  campaignId: string;
  campaignHash: string;
  bankId: string;
  bankHash: string;
  sourcePacks: ReviewSourcePackReceipt[];
  submissions: ReviewSubmission[];
  mergedHash: string;
};

export type ReviewIssueSeverity =
  | 'blocking'
  | 'requires-discussion'
  | 'informational';

export type StableReviewIssue = {
  schemaVersion: 1;
  id: string;
  campaignId: string;
  campaignHash: string;
  questionId: string;
  questionVersion: number;
  questionHash: string;
  criterion?: string;
  reviewerId?: string;
  code: string;
  severity: ReviewIssueSeverity;
  message: string;
  evidence?: {
    rating?: number;
    aikenV?: number;
    comment?: string;
  };
};

export type ReviewIssueResolution = {
  schemaVersion: 1;
  issueId: string;
  status: 'open' | 'resolved' | 'not-actionable' | 'accepted-for-discussion';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
};

export type ReviewDecisionType =
  | 'revise'
  | 'retain-draft'
  | 'eligible-for-reviewed'
  | 'retire';

export type QuestionReviewDecision = {
  schemaVersion: 1;
  id: string;
  campaignId: string;
  campaignHash: string;
  questionId: string;
  questionVersion: number;
  questionHash: string;
  evidenceBundleHash: string;
  decision: ReviewDecisionType;
  decidedBy: string;
  decidedAt: string;
  rationale: string;
  resolvedIssueIds: string[];
};

export type QuestionReviewReadinessState =
  | 'not-started'
  | 'incomplete'
  | 'requires-resolution'
  | 'ready-for-human-decision';

export type QuestionReviewAnalysis = {
  questionId: string;
  questionVersion: number;
  questionHash: string;
  coverage: {
    applicableCriteria: number;
    ratedCriteria: number;
    fullyCoveredCriteria: number;
    independentlyCoveredCriteria: number;
    uniqueReviewers: number;
    independentReviewers: number;
    conflictedReviewers: number;
  };
  overallContentValidity?: AikenValue;
  criterionValues: AikenValue[];
  allReviewerOverallContentValidity?: AikenValue;
  allReviewerCriterionValues: AikenValue[];
  ratings: ReviewSubmission[];
  comments: ReviewSubmission[];
  issues: StableReviewIssue[];
  state: QuestionReviewReadinessState;
};

export type BankReviewAnalysis = {
  schemaVersion: 1;
  campaignId: string;
  campaignHash: string;
  bankId: string;
  bankHash: string;
  mergedHash: string;
  policy: { id: string; version: number };
  questions: QuestionReviewAnalysis[];
  summary: {
    totalQuestions: number;
    notStarted: number;
    incomplete: number;
    requiresResolution: number;
    readyForHumanDecision: number;
    totalIssues: Record<ReviewIssueSeverity, number>;
    issueStatusCounts: {
      total: number;
      resolved: number;
      unresolved: number;
    };
    reviewerCoverage: {
      totalReviewers: number;
      independentReviewers: number;
      conflictedReviewers: number;
    };
    criterionCoverage: {
      applicable: number;
      rated: number;
      fullyCovered: number;
      independentlyCovered: number;
    };
  };
};

export type ReviewDiagnostic = {
  code: string;
  message: string;
  row?: number;
  path?: string;
};

export type EvidenceBundle = {
  schemaVersion: 1;
  hash: string;
  campaignId: string;
  campaignHash: string;
  bankHash: string;
  mergedHash: string;
  policy: ContentReviewPolicy;
  manifest: ReviewCampaignManifest;
  merged: MergedReviewSubmissions;
  analysis: BankReviewAnalysis;
  issues: StableReviewIssue[];
  resolutions: ReviewIssueResolution[];
};

export type ReviewAttribution = {
  reviewerId: string;
  consentConfirmed: true;
};
