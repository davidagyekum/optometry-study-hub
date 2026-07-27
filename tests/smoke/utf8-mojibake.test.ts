import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const roots = ['app', 'components', 'content', 'lib', 'scripts', 'docs', 'tests'];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.md', '.csv', '.json', '.yml', '.yaml']);
const mojibake = /(?:\u00c3[\u00a2\u0192\u201a]|\u00c2[\u0080-\u00bf]|\u00e2(?:\u20ac|\u2020)[\u0080-\u00ff\u0152-\u0178\u2010-\u2122]|\ufffd)/u;
function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => { const path = join(root, entry.name); return entry.isDirectory() ? filesUnder(path) : extensions.has(extname(path)) ? [path] : []; });
}

describe('UTF-8 source integrity', () => {
  it('contains no known UTF-8 mojibake or replacement characters', () => {
    const failures = roots.flatMap(filesUnder).flatMap((path) => { const lines = readFileSync(path, 'utf8').split(/\r?\n/); return lines.flatMap((line, index) => mojibake.test(line) ? [`${relative(process.cwd(), path)}:${index + 1}`] : []); });
    expect(failures, `Mojibake found in:\n${failures.join('\n')}`).toEqual([]);
  });
});
