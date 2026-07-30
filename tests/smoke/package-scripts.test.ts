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
      "questions:review-pack": "tsx scripts/export-question-review-pack.ts",
      "questions:aiken": "tsx scripts/calculate-aiken-v.ts",
      "questions:review-campaign": "tsx scripts/create-review-campaign.ts",
      "questions:review-merge": "tsx scripts/merge-question-reviews.ts",
      "questions:review-readiness": "tsx scripts/report-review-readiness.ts",
      "questions:review-verify": "tsx scripts/verify-review-decision.ts",
      "questions:review-snapshot": "tsx scripts/export-question-bank-snapshot.ts",
      check: "npm run lint && npm run typecheck && npm run test && npm run questions:validate && npm run questions:blueprint && npm run questions:validate:hvp && npm run questions:blueprint:hvp && npm run questions:validate:tissue && npm run questions:blueprint:tissue && npm run build",
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
