import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type PackageManifest = {
  engines?: { node?: string };
  scripts?: Record<string, string>;
};

async function readPackage(): Promise<PackageManifest> {
  return JSON.parse(
    await readFile(resolve(root, "package.json"), "utf8"),
  ) as PackageManifest;
}

describe("package scripts", () => {
  it("declares the supported development and quality commands", async () => {
    const manifest = await readPackage();

    expect(manifest.scripts).toMatchObject({
      dev: "vinext dev",
      build: "vinext build",
      start: "vinext start",
      lint: expect.any(String),
      typecheck: "tsc --noEmit",
      test: "vitest run",
      "questions:validate": "tsx scripts/validate-question-bank.ts",
      "questions:report": "tsx scripts/report-question-bank.ts",
      "questions:blueprint": "tsx scripts/report-question-blueprint.ts",
      "questions:validate:tissue":
        "tsx scripts/validate-tissue-foundations-question-bank.ts",
      "questions:report:tissue":
        "tsx scripts/report-tissue-foundations-question-bank.ts",
      "questions:blueprint:tissue":
        "tsx scripts/report-tissue-foundations-question-blueprint.ts",
      "questions:validate:ocular":
        "tsx scripts/validate-ocular-adnexa-question-bank.ts",
      "questions:report:ocular":
        "tsx scripts/report-ocular-adnexa-question-bank.ts",
      "questions:blueprint:ocular":
        "tsx scripts/report-ocular-adnexa-question-blueprint.ts",
      "questions:validate:blood":
        "tsx scripts/validate-blood-supply-question-bank.ts",
      "questions:report:blood":
        "tsx scripts/report-blood-supply-question-bank.ts",
      "questions:blueprint:blood":
        "tsx scripts/report-blood-supply-question-blueprint.ts",
      "questions:review-pack": "tsx scripts/export-question-review-pack.ts",
      "questions:aiken": "tsx scripts/calculate-aiken-v.ts",
      "questions:review-campaign": "tsx scripts/create-review-campaign.ts",
      "questions:review-merge": "tsx scripts/merge-question-reviews.ts",
      "questions:review-readiness": "tsx scripts/report-review-readiness.ts",
      "questions:review-verify": "tsx scripts/verify-review-decision.ts",
      "questions:review-snapshot": "tsx scripts/export-question-bank-snapshot.ts",
      'questions:validate:autonomic-pharmacology':
        'tsx scripts/validate-autonomic-pharmacology-question-bank.ts',
      'questions:report:autonomic-pharmacology':
        'tsx scripts/report-autonomic-pharmacology-question-bank.ts',
      'questions:blueprint:autonomic-pharmacology':
        'tsx scripts/report-autonomic-pharmacology-question-blueprint.ts',
      'release:build:autonomic-pharmacology':
        'tsx scripts/run-release-build.ts --profile=autonomic-pharmacology-preview',
      'questions:validate:systemic-pathology':
        'tsx scripts/validate-systemic-pathology-question-bank.ts',
      'questions:report:systemic-pathology':
        'tsx scripts/report-systemic-pathology-question-bank.ts',
      'questions:blueprint:systemic-pathology':
        'tsx scripts/report-systemic-pathology-question-blueprint.ts',
      'release:build:systemic-pathology':
        'tsx scripts/run-release-build.ts --profile=systemic-pathology-preview',
      'release:build:full-curated':
        'tsx scripts/run-release-build.ts --profile=full-curated-preview',
      "release:build:neuro":
        "tsx scripts/run-release-build.ts --profile=neuro-anatomy-preview",
      check: "npm run lint && npm run typecheck && npm run test && npm run questions:validate && npm run questions:blueprint && npm run questions:validate:hvp && npm run questions:blueprint:hvp && npm run questions:validate:tissue && npm run questions:blueprint:tissue && npm run questions:validate:ocular -- --strict && npm run questions:blueprint:ocular && npm run questions:validate:blood -- --strict && npm run questions:blueprint:blood && npm run questions:validate:environmental-vision -- --strict && npm run questions:blueprint:environmental-vision && npm run questions:validate:autonomic-pharmacology -- --strict && npm run questions:blueprint:autonomic-pharmacology && npm run questions:validate:systemic-pathology -- --strict && npm run questions:blueprint:systemic-pathology && npm run build",
    });
  });

  it("preserves the supported Node runtime floor", async () => {
    const manifest = await readPackage();

    expect(manifest.engines?.node).toBe(">=22.13.0");
  });

  it("does not point the test command at a missing test file", async () => {
    const manifest = await readPackage();
    const testScript = manifest.scripts?.test ?? "";
    const referencedFiles = Array.from(
      testScript.matchAll(/(?:^|\s)([./\w-]+\.(?:[cm]?js|ts))(?=\s|$)/g),
      (match) => match[1],
    );

    const missing: string[] = [];
    for (const referencedFile of referencedFiles) {
      try {
        await access(resolve(root, referencedFile));
      } catch {
        missing.push(referencedFile);
      }
    }

    expect(missing).toEqual([]);
  });
});
