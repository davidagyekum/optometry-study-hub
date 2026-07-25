import { access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const criticalFiles = [
  "app/page.tsx",
  "app/[...path]/page.tsx",
  "app/layout.tsx",
  "app/StudyApp.tsx",
  "content/legacy/courseCatalog.ts",
  "content/legacy/moduleCatalog.ts",
  "content/legacy/additionalModules.ts",
  "content/legacy/opt376Modules.ts",
  "app/globals.css",
  "worker/index.ts",
  "tools/sites-vite-plugin.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  ".openai/hosting.json",
] as const;

describe("repository files", () => {
  it("contains the small set of files required to build the current application", async () => {
    const missing: string[] = [];

    for (const relativePath of criticalFiles) {
      try {
        await access(resolve(root, relativePath));
      } catch {
        missing.push(relativePath);
      }
    }

    expect(missing).toEqual([]);
  });
});
