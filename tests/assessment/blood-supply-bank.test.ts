import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';

const EXPECTED_BANK_HASH =
  '1ce2628c3c74ac124b7034d7c34efba63a10dc4d6dcaab079e5eed73a01ccf8d';
const EXPECTED_ASSET_HASHES: Record<string, string> = {
  'ophthalmic-origin.svg':
    '8d3f008d1dac553f82554fa10b85f32f6dfa052ee25424f6d2a71ac5b599ccb8',
  'ciliary-circulation.svg':
    '5c8cdd15f90138425baacfc324109861b776ee61703d3efa7e2e15f516ae37ea',
  'retinal-dual-supply.svg':
    '84306f79986eba2cf4c533f5880133dee694e126e67ac75c0d89e644c3329fcf',
  'blood-retina-barriers.svg':
    'e2157ff6961abd6557997bc59db72556f41154ae45ce29ece721fb7bcb00b3c7',
  'retinal-microcirculation.svg':
    '5a23b7bfc02f09917dd6e6fa31bebe60766c1438922c35fc35343b60d7a955c9',
};

function counts(field: 'sectionId' | 'format' | 'difficulty' | 'bloomLevel') {
  return bloodSupplyCandidateBank.questions.reduce<Record<string, number>>(
    (result, question) => ({
      ...result,
      [question[field]]: (result[question[field]] ?? 0) + 1,
    }),
    {},
  );
}

describe('OPT 376 Blood Supply canonical draft bank', () => {
  it('retains the exact authored identity and content counts', () => {
    const bytes = readFileSync(
      'content/question-bank/opt376/blood-supply/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex'))
      .toBe(EXPECTED_BANK_HASH);
    expect(bloodSupplyCandidateBank).toMatchObject({
      id: 'opt376-blood-supply-candidate',
      courseIds: ['neuro-anatomy'],
    });
    expect(bloodSupplyCandidateBank.questions).toHaveLength(80);
    expect(bloodSupplyCandidateBank.objectives).toHaveLength(18);
    expect(bloodSupplyCandidateBank.sources).toHaveLength(8);
    expect(counts('sectionId')).toEqual({
      'arterial-origins': 12,
      ciliary: 15,
      retinal: 15,
      barriers: 14,
      microcirculation: 12,
      'clinical-blood': 12,
    });
    expect(counts('format')).toEqual({
      single_best_answer: 30,
      true_false: 6,
      multiple_response: 10,
      matching: 8,
      extended_matching: 6,
      ordering: 6,
      image_hotspot: 4,
      image_label: 4,
      short_answer: 4,
      open_response: 2,
    });
    expect(counts('difficulty')).toEqual({
      foundation: 20,
      intermediate: 42,
      advanced: 18,
    });
    expect(counts('bloomLevel')).toEqual({
      remember: 6,
      understand: 18,
      apply: 48,
      analyze: 6,
      evaluate: 1,
      create: 1,
    });
    expect(bloodSupplyCandidateBank.questions.filter(
      (question) => ['apply', 'analyze', 'evaluate', 'create']
        .includes(question.bloomLevel),
    )).toHaveLength(56);
    expect([
      ...bloodSupplyCandidateBank.questions,
      ...bloodSupplyCandidateBank.objectives,
    ].every((item) => item.reviewStatus === 'draft')).toBe(true);
  });

  it('binds every question to a registered objective and source', () => {
    const objectives = new Map(
      bloodSupplyCandidateBank.objectives.map(
        (objective) => [objective.id, objective],
      ),
    );
    const sourceIds = new Set(
      bloodSupplyCandidateBank.sources.map((entry) => entry.id),
    );
    bloodSupplyCandidateBank.questions.forEach((question) => {
      expect(objectives.get(question.objectiveId)).toMatchObject({
        courseId: question.courseId,
        moduleId: question.moduleId,
        sectionId: question.sectionId,
      });
      question.sources.forEach((entry) => expect(sourceIds).toContain(entry.id));
    });
    bloodSupplyCandidateBank.objectives.forEach((objective) => {
      expect(bloodSupplyCandidateBank.questions.filter(
        (question) => question.objectiveId === objective.id,
      ).length).toBeGreaterThanOrEqual(2);
      objective.sourceIds.forEach((id) => expect(sourceIds).toContain(id));
    });
  });

  it('retains the key dual-supply and barrier contracts', () => {
    const corpus = JSON.stringify(bloodSupplyCandidateBank);
    expect(corpus).toMatch(/internal carotid/i);
    expect(corpus).toMatch(/foveal avascular zone/i);
    expect(corpus).toMatch(/inner blood-retina barrier/i);
    expect(corpus).toMatch(/outer blood-retina barrier/i);
    expect(corpus).toMatch(/continuous and nonfenestrated/i);
    expect(corpus).toMatch(/fenestrated/i);
    expect(corpus).toMatch(/sudden painless monocular/i);
  });

  it('retains exact original SVG bytes and normalized interaction geometry', () => {
    for (const [file, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      const path = `public/images/modules/blood/assessment/${file}`;
      const bytes = readFileSync(path);
      const svg = bytes.toString('utf8');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
      expect(svg).toMatch(/<svg[^>]+viewBox=/);
      expect(svg).not.toMatch(/correct|answer/i);
    }
    bloodSupplyCandidateBank.questions.forEach((question) => {
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
