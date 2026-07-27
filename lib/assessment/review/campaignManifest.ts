import type { QuestionBlueprint } from '@/lib/assessment/blueprint/types';
import type { QuestionBank } from '@/lib/assessment/types';
import { applicableCriteria } from './criteria';
import { reviewQuestionHash } from './reviewPack';
import type {
  ContentReviewPolicy,
  ReviewCampaignManifest,
  ReviewDiagnostic,
  ReviewerProfile,
} from './campaignTypes';
import { reviewCampaignManifestSchema } from './campaignSchemas';
import { stableReviewHash } from './stableReviewHash';
import {
  normalizeReviewerProfiles,
  validateReviewerProfiles,
} from './reviewerProfiles';

export function reviewPolicyHash(policy: ContentReviewPolicy): string {
  return stableReviewHash(policy);
}

export function reviewBankHash(
  bank: QuestionBank,
  blueprint: QuestionBlueprint,
  policy: ContentReviewPolicy,
): string {
  const objectives = new Map(
    bank.objectives.map((objective) => [objective.id, objective]),
  );
  return stableReviewHash({
    bank: { id: bank.id, schemaVersion: bank.schemaVersion },
    blueprint: {
      id: blueprint.id,
      bankId: blueprint.bankId,
      totalQuestions: blueprint.totalQuestions,
      sectionTargets: blueprint.sectionTargets,
      formatTargets: blueprint.formatTargets,
      bloomTargets: blueprint.bloomTargets,
      difficultyTargets: blueprint.difficultyTargets,
      stimulusTargets: blueprint.stimulusTargets,
      minimumHigherOrderShare: blueprint.minimumHigherOrderShare,
      minimumQuestionsPerObjective: blueprint.minimumQuestionsPerObjective,
    },
    questions: bank.questions.map((question) => {
      const objective = objectives.get(question.objectiveId);
      if (!objective) throw new Error(`Missing objective ${question.objectiveId}.`);
      return {
        id: question.id,
        version: question.version,
        reviewHash: reviewQuestionHash(question, objective, bank.sources),
      };
    }),
    objectives: bank.objectives.map((objective) => ({
      id: objective.id,
      statement: objective.statement,
      sourceIds: objective.sourceIds,
    })),
    sources: bank.sources.map((source) => ({
      id: source.id,
      title: source.title,
      locator: source.locator,
      url: source.url,
      kind: source.kind,
    })),
    policy: { id: policy.id, version: policy.version },
  });
}

function campaignHashEvidence(
  manifest: Omit<ReviewCampaignManifest, 'campaignHash'>,
): unknown {
  return {
    schemaVersion: manifest.schemaVersion,
    id: manifest.id,
    bankId: manifest.bankId,
    bankHash: manifest.bankHash,
    policy: manifest.policy,
    policyHash: manifest.policyHash,
    createdAt: manifest.createdAt,
    questions: manifest.questions,
    reviewers: normalizeReviewerProfiles(manifest.reviewers),
  };
}

export function reviewCampaignHash(
  manifest: Omit<ReviewCampaignManifest, 'campaignHash'>,
): string {
  return stableReviewHash(campaignHashEvidence(manifest));
}

export function createReviewCampaignManifest(input: {
  campaignId: string;
  createdAt: string;
  bank: QuestionBank;
  blueprint: QuestionBlueprint;
  policy: ContentReviewPolicy;
  reviewers: ReviewerProfile[];
}): ReviewCampaignManifest {
  const validatedReviewers = validateReviewerProfiles(input.reviewers);
  if (validatedReviewers.issues.length > 0) {
    throw new Error(
      validatedReviewers.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('\n'),
    );
  }
  const objectives = new Map(
    input.bank.objectives.map((objective) => [objective.id, objective]),
  );
  const evidence: Omit<ReviewCampaignManifest, 'campaignHash'> = {
    schemaVersion: 1,
    id: input.campaignId,
    bankId: input.bank.id,
    bankHash: reviewBankHash(input.bank, input.blueprint, input.policy),
    policy: { id: input.policy.id, version: input.policy.version },
    policyHash: reviewPolicyHash(input.policy),
    createdAt: input.createdAt,
    questions: input.bank.questions.map((question) => {
      const objective = objectives.get(question.objectiveId);
      if (!objective) throw new Error(`Missing objective ${question.objectiveId}.`);
      return {
        questionId: question.id,
        questionVersion: question.version,
        questionHash: reviewQuestionHash(
          question,
          objective,
          input.bank.sources,
        ),
        applicableCriteria: applicableCriteria(question.format).map(
          (criterion) => criterion.id,
        ),
      };
    }),
    reviewers: validatedReviewers.profiles,
  };
  return {
    ...evidence,
    campaignHash: reviewCampaignHash(evidence),
  };
}

export function validateReviewCampaignManifest(
  value: unknown,
  input: {
    bank: QuestionBank;
    blueprint: QuestionBlueprint;
    policy: ContentReviewPolicy;
  },
): { manifest?: ReviewCampaignManifest; issues: ReviewDiagnostic[] } {
  const parsed = reviewCampaignManifestSchema.safeParse(value);
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map((issue) => ({
        code: 'REVIEW_CAMPAIGN_INVALID',
        message: issue.message,
        path: issue.path.join('.'),
      })),
    };
  }
  const manifest = parsed.data as ReviewCampaignManifest;
  const issues: ReviewDiagnostic[] = [];
  if (manifest.bankId !== input.bank.id) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_BANK_MISMATCH',
      message: `Expected bank ${input.bank.id}; found ${manifest.bankId}.`,
    });
  }
  const expectedBankHash = reviewBankHash(
    input.bank,
    input.blueprint,
    input.policy,
  );
  if (manifest.bankHash !== expectedBankHash) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_BANK_STALE',
      message: 'Campaign bank hash does not match the canonical bank.',
    });
  }
  if (
    manifest.policy.id !== input.policy.id ||
    manifest.policy.version !== input.policy.version
  ) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_POLICY_MISMATCH',
      message: 'Campaign policy identity does not match the current policy.',
    });
  }
  if (manifest.policyHash !== reviewPolicyHash(input.policy)) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_POLICY_STALE',
      message: 'Campaign policy hash does not match the complete current policy.',
    });
  }
  const expected = createReviewCampaignManifest({
    campaignId: manifest.id,
    createdAt: manifest.createdAt,
    bank: input.bank,
    blueprint: input.blueprint,
    policy: input.policy,
    reviewers: manifest.reviewers,
  });
  if (
    stableReviewHash(manifest.questions) !==
    stableReviewHash(expected.questions)
  ) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH',
      message: 'Campaign question matrix does not match canonical evidence.',
    });
  }
  if (
    stableReviewHash(manifest.reviewers) !==
    stableReviewHash(expected.reviewers)
  ) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_REVIEWERS_NOT_NORMALIZED',
      message: 'Campaign reviewer profiles are not in canonical normalized form.',
    });
  }
  const withoutHash: Omit<ReviewCampaignManifest, 'campaignHash'> = {
    schemaVersion: manifest.schemaVersion,
    id: manifest.id,
    bankId: manifest.bankId,
    bankHash: manifest.bankHash,
    policy: manifest.policy,
    policyHash: manifest.policyHash,
    createdAt: manifest.createdAt,
    questions: manifest.questions,
    reviewers: manifest.reviewers,
  };
  if (manifest.campaignHash !== reviewCampaignHash(withoutHash)) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_HASH_MISMATCH',
      message: 'Campaign hash does not match its immutable campaign evidence.',
    });
  }
  if (manifest.campaignHash !== expected.campaignHash) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_STALE',
      message: 'Campaign evidence differs from the current canonical campaign.',
    });
  }
  issues.push(...validateReviewerProfiles(manifest.reviewers).issues);
  return { manifest, issues };
}


export function validateCampaignDirectoryManifest(
  existing: unknown,
  expected: ReviewCampaignManifest,
): ReviewDiagnostic[] {
  const existingHash =
    existing && typeof existing === 'object'
      ? (existing as { campaignHash?: unknown }).campaignHash
      : undefined;
  return existingHash === expected.campaignHash
    ? []
    : [
        {
          code: 'REVIEW_CAMPAIGN_DIRECTORY_CONFLICT',
          message:
            'Existing campaign directory contains a different immutable campaign hash.',
        },
      ];
}
