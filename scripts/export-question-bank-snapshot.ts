import { join } from 'node:path';
import { reviewBankHash } from '@/lib/assessment/review/campaignManifest';
import { reviewQuestionHash } from '@/lib/assessment/review/reviewPack';
import {
  canonicalReviewContext,
  runCommand,
  writeJson,
} from './review-command-utils';

runCommand(async () => {
  const { bank, blueprint, policy } = canonicalReviewContext;
  const objectives = new Map(
    bank.objectives.map((objective) => [objective.id, objective]),
  );
  const snapshot = {
    schemaVersion: 1,
    bankId: bank.id,
    bankHash: reviewBankHash(bank, blueprint, policy),
    blueprint: { id: blueprint.id, bankId: blueprint.bankId },
    policy: { id: policy.id, version: policy.version },
    questions: bank.questions.map((question) => {
      const objective = objectives.get(question.objectiveId);
      if (!objective) throw new Error(`Missing objective ${question.objectiveId}.`);
      return {
        id: question.id,
        version: question.version,
        hash: reviewQuestionHash(question, objective, bank.sources),
        reviewStatus: question.reviewStatus,
        ...(question.reviewer ? { reviewer: question.reviewer } : {}),
        objectiveId: question.objectiveId,
        sourceIds: question.sources.map((source) => source.id),
      };
    }),
    objectives: bank.objectives.map((objective) => ({
      id: objective.id,
      statement: objective.statement,
      reviewStatus: objective.reviewStatus,
      sourceIds: objective.sourceIds,
    })),
    sources: bank.sources.map((source) => ({
      id: source.id,
      title: source.title,
      locator: source.locator,
      url: source.url,
      kind: source.kind,
    })),
  };
  const path = join('tmp', 'question-review', 'current-bank-snapshot.json');
  await writeJson(path, snapshot);
  console.log(
    `Exported ${snapshot.questions.length} draft candidate questions to ${path}.`,
  );
});
