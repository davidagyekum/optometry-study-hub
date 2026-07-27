import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const STATIC_IMPORT = /\bimport(?:\s+type)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

function resolveLocalImport(from: string, specifier: string): string | undefined {
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
  return candidates.find((candidate) => existsSync(candidate));
}

function staticGraph(entry: string): Set<string> {
  const visited = new Set<string>();
  const pending = [resolve(entry)];
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    if (file.endsWith('.json')) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(STATIC_IMPORT)) {
      const dependency = resolveLocalImport(file, match[1]);
      if (dependency && !visited.has(dependency)) pending.push(dependency);
    }
  }
  return visited;
}

describe('disabled learner import boundary', () => {
  it('keeps hidden candidate banks outside the ordinary static learner graph', () => {
    const graph = [...staticGraph('app/StudyApp.tsx')]
      .map((path) => path.replaceAll('\\', '/'));
    expect(graph.some((path) => path.includes(
      '/content/question-bank/opt374/human-visual-perception/',
    ))).toBe(false);
    expect(graph.some((path) => path.includes(
      '/content/question-bank/opt376/aqueous-vitreous/bank',
    ))).toBe(false);
  });
});
