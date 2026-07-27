import { access } from 'node:fs/promises';
import { join } from 'node:path';
import {
  createReviewCampaignManifest,
  validateCampaignDirectoryManifest,
  validateReviewCampaignManifest,
} from '@/lib/assessment/review/campaignManifest';
import {
  campaignReviewRows,
  campaignRowsToCsv,
} from '@/lib/assessment/review/reviewerPack';
import { validateReviewerProfiles } from '@/lib/assessment/review/reviewerProfiles';
import {
  buildReviewDossier,
  reviewDossierMarkdown,
  reviewGuide,
} from '@/lib/assessment/review/reviewPack';
import {
  canonicalReviewContext,
  readJson,
  requireValue,
  runCommand,
  valueFor,
  writeJson,
  writeText,
} from './review-command-utils';

runCommand(async () => {
  const campaignId = requireValue('--campaign-id');
  const reviewersPath = requireValue('--reviewers');
  const createdAt = valueFor('--created-at') ?? new Date().toISOString();
  const reviewers = validateReviewerProfiles(await readJson(reviewersPath));
  if (reviewers.issues.length > 0) {
    throw new Error(
      reviewers.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
    );
  }
  const manifest = createReviewCampaignManifest({
    campaignId,
    createdAt,
    ...canonicalReviewContext,
    reviewers: reviewers.profiles,
  });
  const validated = validateReviewCampaignManifest(
    manifest,
    canonicalReviewContext,
  );
  if (validated.issues.length > 0) {
    throw new Error(
      validated.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
    );
  }
  const directory = join('tmp', 'question-review', campaignId);
  const manifestPath = join(directory, 'campaign-manifest.json');
  try {
    await access(manifestPath);
    const compatibility = validateCampaignDirectoryManifest(
      await readJson(manifestPath),
      manifest,
    );
    if (compatibility.length > 0) {
      throw new Error(
        `${compatibility[0].code}: ${compatibility[0].message} Directory: ${directory}.`,
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      !('code' in error && error.code === 'ENOENT')
    ) {
      throw error;
    }
  }
  await writeJson(manifestPath, manifest);
  await writeText(
    join(directory, 'campaign-summary.md'),
    [
      `# Review campaign ${campaignId}`,
      '',
      `Campaign hash: \`${manifest.campaignHash}\``,
      `Bank: \`${manifest.bankId}\``,
      `Bank hash: \`${manifest.bankHash}\``,
      `Policy: \`${manifest.policy.id}@${manifest.policy.version}\``,
      `Policy hash: \`${manifest.policyHash}\``,
      `Created: ${manifest.createdAt}`,
      `Questions: ${manifest.questions.length}`,
      `Reviewers: ${manifest.reviewers.length}`,
      '',
      'The 0.80 Aiken value is a project discussion flag, not universal proof of validity. This campaign never changes review status.',
    ].join('\n'),
  );
  for (const reviewer of manifest.reviewers) {
    await writeText(
      join(directory, 'reviewer-packs', `${reviewer.id}.csv`),
      campaignRowsToCsv(
        campaignReviewRows(manifest, canonicalReviewContext.bank, reviewer.id),
      ),
    );
    await writeText(
      join(directory, 'reviewer-packs', `${reviewer.id}-guide.md`),
      `${reviewGuide(canonicalReviewContext.bank)}\nCampaign: \`${manifest.id}\`\nCampaign hash: \`${manifest.campaignHash}\`\nReviewer ID: \`${reviewer.id}\`\n`,
    );
  }
  await writeText(
    join(directory, 'review-items.md'),
    reviewDossierMarkdown(canonicalReviewContext.bank),
  );
  await writeJson(
    join(directory, 'review-items.json'),
    buildReviewDossier(canonicalReviewContext.bank),
  );
  console.log(
    `Created ${campaignId} (${manifest.campaignHash}): ${manifest.questions.length} questions, 338 criteria per reviewer, ${manifest.reviewers.length} reviewer packs.`,
  );
});
