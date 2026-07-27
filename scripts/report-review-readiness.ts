import { join } from 'node:path';
import type { ReviewIssueResolution } from '@/lib/assessment/review/campaignTypes';
import { validateMergedReviewSubmissions } from '@/lib/assessment/review/mergeSubmissions';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import {
  openResolutionTemplate,
  validateIssueResolutions,
} from '@/lib/assessment/review/issueResolutions';
import {
  applyReviewResolutions,
  everyQuestionReady,
} from '@/lib/assessment/review/readiness';
import {
  campaignDirectory,
  canonicalReviewContext,
  loadCampaign,
  readJson,
  requireValue,
  runCommand,
  safeMarkdownJson,
  valueFor,
  writeJson,
  writeText,
} from './review-command-utils';

runCommand(async () => {
  const campaignPath = requireValue('--campaign');
  const submissionsPath = requireValue('--submissions');
  const resolutionsPath = valueFor('--resolutions');
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
  let analysis = analyzeReviewCampaign({
    manifest,
    merged: mergedValidation.merged,
    policy: canonicalReviewContext.policy,
  });
  let resolutions: ReviewIssueResolution[] = [];
  if (resolutionsPath) {
    const validated = validateIssueResolutions({
      value: await readJson(resolutionsPath),
      issues: analysis.questions.flatMap((question) => question.issues),
      manifest,
    });
    if (validated.issues.length > 0) {
      throw new Error(
        validated.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
      );
    }
    resolutions = validated.resolutions;
    analysis = applyReviewResolutions(analysis, resolutions);
  }
  const directory = campaignDirectory(campaignPath);
  const issues = analysis.questions.flatMap((question) => question.issues);
  await writeJson(join(directory, 'review-analysis.json'), analysis);
  await writeJson(join(directory, 'review-issues.json'), issues);
  await writeJson(
    join(directory, 'resolution-template.json'),
    openResolutionTemplate(issues, resolutions),
  );
  await writeText(
    join(directory, 'review-analysis.md'),
    [
      '# Expert review readiness',
      '',
      `Campaign: \`${manifest.id}\``,
      `Campaign hash: \`${manifest.campaignHash}\``,
      `Bank hash: \`${manifest.bankHash}\``,
      `Merged hash: \`${mergedValidation.merged.mergedHash}\``,
      `Not started: ${analysis.summary.notStarted}`,
      `Incomplete: ${analysis.summary.incomplete}`,
      `Requires resolution: ${analysis.summary.requiresResolution}`,
      `Ready for human decision: ${analysis.summary.readyForHumanDecision}`,
      `Issues: ${analysis.summary.issueStatusCounts.total} total, ${analysis.summary.issueStatusCounts.resolved} resolved, ${analysis.summary.issueStatusCounts.unresolved} unresolved`,
      '',
      "Readiness-facing Aiken's V uses independent, unconflicted reviewers only. All-reviewer statistics remain separate diagnostics. The project flag requires discussion and never approves an item.",
      '',
      '## Evidence',
      '',
      safeMarkdownJson(
        analysis.questions.map((question) => ({
          questionId: question.questionId,
          version: question.questionVersion,
          hash: question.questionHash,
          state: question.state,
          independentCoverage: question.coverage.independentlyCoveredCriteria,
          overallContentValidity: question.overallContentValidity,
          criterionValues: question.criterionValues,
          allReviewerCriterionValues: question.allReviewerCriterionValues,
          comments: question.comments.map((comment) => ({
            reviewerId: comment.reviewerId,
            criterion: comment.criterion,
            comment: comment.comment,
          })),
          issues: question.issues,
        })),
      ),
    ].join('\n'),
  );
  console.log(JSON.stringify(analysis.summary, null, 2));
  if (process.argv.includes('--require-ready') && !everyQuestionReady(analysis)) {
    process.exitCode = 2;
  }
});
