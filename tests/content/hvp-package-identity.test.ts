import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('OPT 374 supplied package identity', () => {
  it('preserves the canonical JSON byte-for-byte', () => {
    const bytes = readFileSync(
      'content/question-bank/opt374/human-visual-perception/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      '029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a',
    );
  });
});
