import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';

const EXPECTED_BANK_HASH =
  'fe96d664bdad67b40a4711332612e59e26a2b5a2c3844aae279dc71f662ecb9f';
const EXPECTED_ASSET_HASHES: Record<string, string> = {
  'eyelid-landmarks.svg':
    '188fdc6d542dd9c45aad1b2517eac5d0df5775d58d2ab07361cff32b722efeae',
  'eyelid-layers.svg':
    'ca6d2e0c400068728451810e6d237d305300e33e9116f99e134bc3888c695e0b',
  'lacrimal-gland.svg':
    '82c59b74b4d534933ee073d9438d0602f88deb651b30c67b4161300c72387d88',
  'lacrimal-innervation.svg':
    'c31d2e62caea8407cf9f08743a52be8c78f889cf7301e0ffc71eeeecabb83a1d',
  'tear-drainage.svg':
    '76763793e8ffe5c8bd353963833147e826e0a1e30aca9c7bbff1ad6019f51462',
};

function counts(field: 'sectionId' | 'format' | 'difficulty' | 'bloomLevel') {
  return ocularAdnexaCandidateBank.questions.reduce<Record<string, number>>(
    (result, question) => ({
      ...result,
      [question[field]]: (result[question[field]] ?? 0) + 1,
    }),
    {},
  );
}

describe('OPT 376 Ocular Adnexa canonical draft bank', () => {
  it('retains the package identity and exact content counts', () => {
    const bytes = readFileSync(
      'content/question-bank/opt376/ocular-adnexa/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex'))
      .toBe(EXPECTED_BANK_HASH);
    expect(ocularAdnexaCandidateBank).toMatchObject({
      id: 'opt376-ocular-adnexa-candidate',
      courseIds: ['neuro-anatomy'],
    });
    expect(ocularAdnexaCandidateBank.questions).toHaveLength(80);
    expect(ocularAdnexaCandidateBank.objectives).toHaveLength(18);
    expect(ocularAdnexaCandidateBank.sources).toHaveLength(8);
    expect(counts('sectionId')).toEqual({
      landmarks: 10,
      muscles: 16,
      'tarsus-glands': 18,
      'lower-lid-blood': 8,
      'lacrimal-gland': 12,
      tears: 16,
    });
    expect(counts('format')).toEqual({
      single_best_answer: 40,
      true_false: 6,
      multiple_response: 9,
      matching: 7,
      extended_matching: 4,
      ordering: 4,
      image_hotspot: 3,
      image_label: 2,
      short_answer: 3,
      open_response: 2,
    });
    expect(counts('difficulty')).toEqual({
      foundation: 21,
      intermediate: 41,
      advanced: 18,
    });
    expect(counts('bloomLevel')).toEqual({
      understand: 21,
      apply: 41,
      analyze: 16,
      evaluate: 1,
      create: 1,
    });
    expect([
      ...ocularAdnexaCandidateBank.questions,
      ...ocularAdnexaCandidateBank.objectives,
    ].every((item) => item.reviewStatus === 'draft')).toBe(true);
  });

  it('binds every question to a registered objective and source', () => {
    const objectives = new Map(
      ocularAdnexaCandidateBank.objectives.map(
        (objective) => [objective.id, objective],
      ),
    );
    const sourceIds = new Set(
      ocularAdnexaCandidateBank.sources.map((entry) => entry.id),
    );
    ocularAdnexaCandidateBank.questions.forEach((question) => {
      expect(objectives.get(question.objectiveId)).toMatchObject({
        courseId: question.courseId,
        moduleId: question.moduleId,
        sectionId: question.sectionId,
      });
      question.sources.forEach((entry) => expect(sourceIds).toContain(entry.id));
    });
    ocularAdnexaCandidateBank.objectives.forEach((objective) => {
      expect(ocularAdnexaCandidateBank.questions.filter(
        (question) => question.objectiveId === objective.id,
      ).length).toBeGreaterThanOrEqual(2);
      objective.sourceIds.forEach((id) => expect(sourceIds).toContain(id));
    });
  });

  it('preserves corrected lacrimal physiology in the authored content', () => {
    const corpus = JSON.stringify(ocularAdnexaCandidateBank);
    expect(corpus).toMatch(/parasympathetic secretomotor/i);
    expect(corpus).toMatch(/deep petrosal/i);
    expect(corpus).toMatch(/greater petrosal/i);
    expect(corpus).not.toMatch(/primarily sympathetic tear production/i);
  });

  it('retains exact original SVG bytes and normalized interaction geometry', () => {
    for (const [file, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      const path =
        `public/images/courses/neuro-tissues/ocular-adnexa/assessment/${file}`;
      const bytes = readFileSync(path);
      const svg = bytes.toString('utf8');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
      expect(svg).toMatch(/<svg[^>]+viewBox=/);
      expect(svg).not.toMatch(/correct|answer/i);
    }
    ocularAdnexaCandidateBank.questions.forEach((question) => {
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
