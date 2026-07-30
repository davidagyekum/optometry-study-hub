import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';

const EXPECTED_BANK_HASH =
  '97c1bc76cbae20681b1c4494bb7d35d282420f8c03a9181927720e024ae9dccb';
const EXPECTED_ASSET_HASHES: Record<string, string> = {
  'aqueous-chamber-flow.svg':
    '566a410aa5b087fdb7e4bdf9732009239e0394b3328f6721aa36a052768ff37f',
  'conventional-outflow.svg':
    'd27046d898d1d22c2107abf68198761074c06c0db873cf1cf2f325a8a8635c22',
  'iop-determinants.svg':
    '2c96b4c32e9111e028d42716ef073b3d13685dd93c16f1283615f5f470690933',
  'vitreous-attachments.svg':
    '31422d93c75a6da982061cf235f64f6eae222cd4a83b2287a6c288a664b72263',
};

describe('Aqueous and Vitreous canonical assets', () => {
  it('binds the authored bank to its exact serialized checksum', () => {
    const bytes = readFileSync(
      'content/question-bank/opt376/aqueous-vitreous/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex'))
      .toBe(EXPECTED_BANK_HASH);
  });

  it('retains exact neutral SVG bytes and normalized interaction geometry', () => {
    for (const [file, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      const path = `public/images/modules/aqueous/assessment/${file}`;
      const bytes = readFileSync(path);
      const svg = bytes.toString('utf8');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
      expect(svg).toMatch(/<svg[^>]+viewBox="0 0 1200 675"/);
      expect(svg).not.toMatch(/correct|answer/i);
    }
    aqueousVitreousCandidateBank.questions.forEach((question) => {
      if (question.format === 'image_hotspot') {
        question.regions.forEach((region) => {
          expect(region.x).toBeGreaterThanOrEqual(0);
          expect(region.y).toBeGreaterThanOrEqual(0);
          expect(region.x + region.width).toBeLessThanOrEqual(1);
          expect(region.y + region.height).toBeLessThanOrEqual(1);
        });
      }
      if (question.format === 'image_label') {
        question.targets.forEach((target) => {
          expect(target.x).toBeGreaterThanOrEqual(0);
          expect(target.x).toBeLessThanOrEqual(1);
          expect(target.y).toBeGreaterThanOrEqual(0);
          expect(target.y).toBeLessThanOrEqual(1);
        });
      }
    });
  });
});
