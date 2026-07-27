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
import { validateReviewerProfiles } from './reviewerProfiles';

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

export function createReviewCampaignManifest(input: {
  campaignId: string;
  createdAt: string;
  bank: QuestionBank;
  blueprint: QuestionBlueprint;
  policy: ContentReviewPolicy;
  reviewers: ReviewerProfile[];
}): ReviewCampaignManifest {
  const objectives = new Map(
    input.bank.objectives.map((objective) => [objective.id, objective]),
  );
  return {
    schemaVersion: 1,
    id: input.campaignId,
    bankId: input.bank.id,
    bankHash: reviewBankHash(input.bank, input.blueprint, input.policy),
    policy: { id: input.policy.id, version: input.policy.version },
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
    reviewers: input.reviewers,
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
  const expectedHash = reviewBankHash(input.bank, input.blueprint, input.policy);
  if (manifest.bankHash !== expectedHash) {
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
  const expected = createReviewCampaignManifest({
    campaignId: manifest.id,
    createdAt: manifest.createdAt,
    bank: input.bank,
    blueprint: input.blueprint,
    policy: input.policy,
    reviewers: manifest.reviewers,
  });
  if (manifest.questions.length !== expected.questions.length) {
    issues.push({
      code: 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH',
      message: `Expected ${expected.questions.length} questions; found ${manifest.questions.length}.`,
    });
  } else {
    expected.questions.forEach((question, index) => {
      if (
        stableReviewHash(manifest.questions[index]) !==
        stableReviewHash(question)
      ) {
        issues.push({
          code: 'REVIEW_CAMPAIGN_QUESTION_MATRIX_MISMATCH',
          message: `Campaign question ${index + 1} does not match canonical evidence.`,
        });
      }
    });
  }
  issues.push(
    ...validateReviewerProfiles(manifest.reviewers).issues,
  );
  const reviewerIds = manifest.reviewers.map((reviewer) => reviewer.id);
  if (new Set(reviewerIds).size !== reviewerIds.length) {
    issues.push({
      code: 'REVIEWER_ID_DUPLICATE',
      message: 'Campaign reviewer IDs must be unique.',
    });
  }
  return { manifest, issues };
}
