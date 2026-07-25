import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contentSources = [
  "content/legacy/courseCatalog.ts",
  "content/legacy/additionalModules.ts",
  "content/legacy/opt376Modules.ts",
  "content/legacy/imageCatalog.ts",
] as const;
const localImagePattern = /\/images\/[A-Za-z0-9_./-]+/g;

describe("referenced educational assets", () => {
  it("resolves every local image reference under public/", async () => {
    const references = new Set<string>();

    for (const source of contentSources) {
      const contents = await readFile(resolve(root, source), "utf8");
      for (const match of contents.matchAll(localImagePattern)) {
        references.add(match[0]);
      }
    }

    expect(references.size).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const reference of [...references].sort()) {
      try {
        await access(resolve(root, "public", reference.slice(1)));
      } catch {
        missing.push(reference);
      }
    }

    expect(
      missing,
      `Missing educational image assets:\n${missing.join("\n")}`,
    ).toEqual([]);
  });
});
