import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const STATIC_IMPORT = /\bimport(?:\s+type)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

function resolveImport(from: string, specifier: string): string | undefined {
  const base = specifier.startsWith('@/')
    ? resolve(specifier.slice(2))
    : specifier.startsWith('.')
      ? resolve(dirname(from), specifier)
      : undefined;
  if (!base) return undefined;
  const candidates = extname(base)
    ? [base]
    : [
      ...EXTENSIONS.map((extension) => `${base}${extension}`),
      ...EXTENSIONS.map((extension) => resolve(base, `index${extension}`)),
    ];
  return candidates.find(existsSync);
}

function graph(entry: string): string[] {
  const pending = [resolve(entry)];
  const visited = new Set<string>();
  while (pending.length) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    if (file.endsWith('.json')) continue;
    for (const match of readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      const dependency = resolveImport(file, match[1]);
      if (dependency) pending.push(dependency);
    }
  }
  return [...visited].map((file) => file.replaceAll('\\', '/'));
}

describe('generic curated-practice import isolation', () => {
  it('keeps answer-bearing HVP and Aqueous banks outside the ordinary app graph', () => {
    const files = graph('app/StudyApp.tsx');
    expect(files.some((file) => file.includes(
      '/content/question-bank/opt374/human-visual-perception/',
    ))).toBe(false);
    expect(files.some((file) => file.includes(
      '/content/question-bank/opt376/aqueous-vitreous/bank',
    ))).toBe(false);
  });

  it('keeps the test fixture and Aqueous pilot out of the production registry', () => {
    const source = readFileSync(
      'lib/assessment/curated/experienceRegistry.ts',
      'utf8',
    );
    expect(source).not.toContain('dummyCuratedExperience');
    expect(source).not.toContain('AssessmentPilotRouter');
    expect(source).not.toContain('aqueous-vitreous/bank');
    expect(source).toContain(
      "@/components/assessment/hvp/HvpPracticeRouter",
    );
  });
});
