import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const roots = ['app', 'components', 'content', 'lib', 'scripts', 'docs', 'tests'];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.md', '.csv', '.json', '.yml', '.yaml']);
const mojibake = /(?:\u00c3(?:[\u0080-\u00bf]|[\u0192\u201a\u2013\u2014\u2018\u2019\u201c\u201d\u2020\u2021\u2022\u2026\u2030\u2039\u203a\u20ac\u2122])|\u00c2[\u0080-\u00bf]|\u00e2(?:\u20ac|\u2020)[\u0080-\u00ff\u0152-\u0178\u2010-\u2122]|\ufffd)/u;
export const containsMojibake = (value: string): boolean => mojibake.test(value);
function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => { const path = join(root, entry.name); return entry.isDirectory() ? filesUnder(path) : extensions.has(extname(path)) ? [path] : []; });
}

describe('UTF-8 source integrity', () => {
  it.each([
    ['misdecoded e acute', '\u00c3\u00a9'],
    ['misdecoded multiplication sign as a Latin-1 control pair', '\u00c3\u0097'],
    ['misdecoded multiplication sign as Windows-1252 punctuation', '\u00c3\u2014'],
    ['misdecoded pound sign', '\u00c2\u00a3'],
  ])('detects %s', (_label, value) => expect(containsMojibake(value)).toBe(true));
  it.each(['é', '×', '£', '“valid punctuation”', '2–3 µL/min'])('allows valid Unicode %j', (value) => expect(containsMojibake(value)).toBe(false));
  it('contains no known UTF-8 mojibake or replacement characters', () => {
    const failures = roots.flatMap(filesUnder).flatMap((path) => { const lines = readFileSync(path, 'utf8').split(/\r?\n/); return lines.flatMap((line, index) => containsMojibake(line) ? [`${relative(process.cwd(), path)}:${index + 1}`] : []); });
    expect(failures, `Mojibake found in:\n${failures.join('\n')}`).toEqual([]);
  });
});
