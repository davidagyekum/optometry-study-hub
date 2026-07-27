import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  mergeReviewerPacks,
  mergedSubmissionsCsv,
} from '@/lib/assessment/review/mergeSubmissions';
import {
  campaignDirectory,
  canonicalReviewContext,
  loadCampaign,
  requireValue,
  runCommand,
  safeMarkdownJson,
  valuesFor,
  writeJson,
  writeText,
} from './review-command-utils';

runCommand(async () => {
  const campaignPath = requireValue('--campaign');
  const inputPaths = valuesFor('--input');
  if (inputPaths.length === 0) throw new Error('At least one --input is required.');
  const manifest = await loadCampaign(campaignPath);
  const packs = await Promise.all(
    inputPaths.map(async (path) => ({ name: path, csv: await readFile(path, 'utf8') })),
  );
  const result = mergeReviewerPacks({
    manifest,
    bank: canonicalReviewContext.bank,
    packs,
  });
  if (!result.merged || result.issues.length > 0) {
    throw new Error(
      result.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
    );
  }
  const directory = campaignDirectory(campaignPath);
  await writeJson(join(directory, 'merged-submissions.json'), result.merged);
  await writeText(
    join(directory, 'merged-submissions.csv'),
    mergedSubmissionsCsv(result.merged),
  );
  await writeText(
    join(directory, 'merge-report.md'),
    [
      '# Review submission merge report',
      '',
      `Campaign: \`${manifest.id}\``,
      `Campaign hash: \`${manifest.campaignHash}\``,
      `Merged hash: \`${result.merged.mergedHash}\``,
      `Input packs: ${inputPaths.length}`,
      `Coverage rows retained: ${result.merged.submissions.length}`,
      `Numeric ratings: ${result.merged.submissions.filter((row) => row.rating !== undefined).length}`,
      `Qualitative comments: ${result.merged.submissions.filter((row) => row.comment).length}`,
      '',
      'Comments are untrusted text. The CSV convenience export may trigger spreadsheet formula handling in some software; inspect untrusted cells before opening. Canonical evidence is the JSON file.',
      '',
      safeMarkdownJson({
        sourcePacks: result.merged.sourcePacks,
        inputFiles: inputPaths.map((path) => path.split(/[\\/]/).at(-1)),
      }),
    ].join('\n'),
  );
  console.log(
    `Merged ${inputPaths.length} packs with ${result.merged.submissions.length} coverage rows. Evidence ${result.merged.mergedHash}.`,
  );
});
