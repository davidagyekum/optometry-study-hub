import { createHash } from 'node:crypto';

export function stableReviewValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableReviewValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableReviewValue(entry)]),
    );
  }
  return value;
}

export function stableReviewJson(value: unknown): string {
  return JSON.stringify(stableReviewValue(value));
}

export function stableReviewHash(value: unknown): string {
  return createHash('sha256').update(stableReviewJson(value), 'utf8').digest('hex');
}

export function normalizeIssueText(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ');
}
