import { join } from 'node:path';
import { validateMergedReviewSubmissions } from '@/lib/assessment/review/mergeSubmissions';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import {
  createEvidenceBundle,
  validateReviewDecisions,
} from '@/lib/assessment/review/reviewDecisions';
import { validateIssueResolutions } from '@/lib/assessment/review/issueResolutions';
import {
  campaignDirectory,
  canonicalReviewContext,
  loadCampaign,
  readJson,
  requireValue,
  runCommand,
  safeMarkdownJson,
  writeJson,
  writeText,
} from './review-command-utils';

runCommand(async () => {
  const campaignPath = requireValue('--campaign');
  const submissionsPath = requireValue('--submissions');
  const resolutionsPath = requireValue('--resolutions');
  const decisionsPath = requireValue('--decisions');
  const manifest = await loadCampaign(campaignPath);
  const mergedValidation = validateMergedReviewSubmissions({
    value: await readJson(submissionsPath),
    manifest,
    bank: canonicalReviewContext.bank,
  });
  if (!mergedValidation.merged || mergedValidation.issues.length > 0) {
    throw new Error(
      mergedValidation.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('\n'),
    );
  }
  const baseAnalysis = analyzeReviewCampaign({
    manifest,
    merged: mergedValidation.merged,
    policy: canonicalReviewContext.policy,
  });
  const resolutionValidation = validateIssueResolutions({
    value: await readJson(resolutionsPath),
    issues: baseAnalysis.questions.flatMap((question) => question.issues),
    manifest,
  });
  if (resolutionValidation.issues.length > 0) {
    throw new Error(
      resolutionValidation.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('\n'),
    );
  }
  const bundle = createEvidenceBundle({
    manifest,
    merged: mergedValidation.merged,
    resolutions: resolutionValidation.resolutions,
    policy: canonicalReviewContext.policy,
  });
  const decisionValidation = validateReviewDecisions({
    value: await readJson(decisionsPath),
    bundle,
    manifest,
    context: canonicalReviewContext,
  });
  const decisions = decisionValidation.decisions;
  const decided = new Set(decisions.map((decision) => decision.questionId));
  const report = {
    schemaVersion: 1,
    campaignId: manifest.id,
    campaignHash: manifest.campaignHash,
    bankHash: manifest.bankHash,
    mergedHash: mergedValidation.merged.mergedHash,
    evidenceBundleHash: bundle.hash,
    valid: decisionValidation.issues.length === 0,
    decisions,
    questionsWithoutDecisions: manifest.questions
      .map((question) => question.questionId)
      .filter((questionId) => !decided.has(questionId)),
    issues: decisionValidation.issues,
  };
  const directory = campaignDirectory(campaignPath);
  await writeJson(join(directory, 'review-decision-verification.json'), report);
  await writeText(
    join(directory, 'review-decision-verification.md'),
    [
      '# Review decision verification',
      '',
      `Campaign: \`${manifest.id}\``,
      `Campaign hash: \`${manifest.campaignHash}\``,
      `Merged hash: \`${mergedValidation.merged.mergedHash}\``,
      `Evidence bundle: \`${bundle.hash}\``,
      `Valid submitted decisions: ${decisions.length}`,
      `Questions without decisions: ${report.questionsWithoutDecisions.length}`,
      '',
      'Verification never changes question source, review status, or reviewer metadata.',
      '',
      safeMarkdownJson(report),
    ].join('\n'),
  );
  console.log(
    `Verified ${decisions.length} decisions; ${report.questionsWithoutDecisions.length} questions have no decision. Evidence ${bundle.hash}.`,
  );
  if (decisionValidation.issues.length > 0) process.exitCode = 2;
});
