import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousBlueprint } from '@/content/question-bank/opt376/aqueous-vitreous/blueprint';
import { aqueousVitreousReviewPolicy } from '@/content/question-bank/opt376/aqueous-vitreous/reviewPolicy';
import type {
  ContentReviewPolicy,
  ReviewCampaignManifest,
} from '@/lib/assessment/review/campaignTypes';
import type { QuestionBank } from '@/lib/assessment/types';
import type { QuestionBlueprint } from '@/lib/assessment/blueprint/types';
import { validateReviewCampaignManifest } from '@/lib/assessment/review/campaignManifest';

export const canonicalReviewContext: {
  bank: QuestionBank;
  blueprint: QuestionBlueprint;
  policy: ContentReviewPolicy;
} = {
  bank: aqueousVitreousCandidateBank,
  blueprint: aqueousVitreousBlueprint,
  policy: aqueousVitreousReviewPolicy,
};

export function valuesFor(flag: string, args = process.argv.slice(2)): string[] {
  const values: string[] = [];
  args.forEach((entry, index) => {
    if (entry === flag && args[index + 1]) values.push(args[index + 1]);
  });
  return values;
}

export function valueFor(flag: string, args = process.argv.slice(2)): string | undefined {
  return valuesFor(flag, args)[0];
}

export function requireValue(flag: string): string {
  const value = valueFor(flag);
  if (!value) throw new Error(`Missing required ${flag} argument.`);
  return value;
}

export async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

export async function writeText(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeText(path, JSON.stringify(value, null, 2));
}

export async function loadCampaign(path: string): Promise<ReviewCampaignManifest> {
  const validated = validateReviewCampaignManifest(
    await readJson(path),
    canonicalReviewContext,
  );
  if (!validated.manifest || validated.issues.length > 0) {
    throw new Error(
      `Invalid campaign manifest:\n${validated.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('\n')}`,
    );
  }
  return validated.manifest;
}

export function campaignDirectory(manifestPath: string): string {
  return dirname(manifestPath);
}

export function safeMarkdownJson(value: unknown): string {
  return `\`\`\`json\n${JSON.stringify(value, null, 2).replaceAll(
    '</script',
    '<\\/script',
  )}\n\`\`\``;
}

export function runCommand(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
