import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';

const EXPECTED_BANK_HASH =
  '06ed91a7323147e8eb9ce1fe6d4813209d986d0b4e4664d55136a012d544b379';
const EXPECTED_ASSET_HASHES: Record<string, string> = {
  'breast-duct-lobule.svg':
    '843511b82a9b28e1832a88234351157deaef351c45657cafdb8d696a4cf918f7',
  'coronary-territories.svg':
    '9e4596c811d620ffbaf1a305c90814d76e4f697afe099fd65005b47b64ac12ac',
  'endocrine-axis.svg':
    '5554c8b69627e09e8b7944284a130e178a501bb3f322296431ed47b814a70fc2',
  'gastrointestinal-landmarks.svg':
    'dbefbbd4ecce9c261d94a6570198954f4569f29a831de45b1230ba277b350d3a',
  'kidney-nephron.svg':
    '899c413f4086966d9cf9d173ddfc8dd737d9c524c84925c9dea20dd363dd1118',
};

function counts(field: 'sectionId' | 'format' | 'difficulty' | 'bloomLevel') {
  return systemicPathologyCandidateBank.questions.reduce<Record<string, number>>(
    (result, question) => ({
      ...result,
      [question[field]]: (result[question[field]] ?? 0) + 1,
    }),
    {},
  );
}

describe('Systemic Pathology canonical draft bank', () => {
  it('retains the exact authored identity and content counts', () => {
    const bytes = readFileSync(
      'content/question-bank/systemic-pathology/systemic-pathology/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex'))
      .toBe(EXPECTED_BANK_HASH);
    expect(systemicPathologyCandidateBank).toMatchObject({
      id: 'systemic-pathology-five-block-candidate',
      courseIds: ['systemic-pathology'],
    });
    expect(systemicPathologyCandidateBank.questions).toHaveLength(80);
    expect(systemicPathologyCandidateBank.objectives).toHaveLength(20);
    expect(systemicPathologyCandidateBank.sources).toHaveLength(19);
    const gravesQuestion = systemicPathologyCandidateBank.questions.find(
      (question) => question.id === 'endocrine-graves-mechanism-sba-001',
    );
    expect(gravesQuestion).toMatchObject({
      options: expect.arrayContaining([
        expect.objectContaining({ id: 'pituitary-tsh-deficiency' }),
      ]),
    });
    expect(bytes.toString('utf8')).toContain('pituitary-tsH-deficiency');    expect(counts('sectionId')).toEqual({
      'path-breast': 16,
      'path-cardio': 16,
      'path-endocrine': 16,
      'path-gi': 16,
      'path-renal': 16,
    });
    expect(counts('format')).toEqual({
      single_best_answer: 40,
      true_false: 5,
      multiple_response: 8,
      matching: 7,
      extended_matching: 5,
      ordering: 4,
      image_hotspot: 3,
      image_label: 3,
      short_answer: 3,
      open_response: 2,
    });
    expect(counts('difficulty')).toEqual({
      foundation: 22,
      intermediate: 43,
      advanced: 15,
    });
    expect(counts('bloomLevel')).toEqual({
      remember: 3,
      understand: 9,
      apply: 35,
      analyze: 30,
      evaluate: 2,
      create: 1,
    });
    expect(systemicPathologyCandidateBank.questions.filter(
      (question) => ['apply', 'analyze', 'evaluate', 'create']
        .includes(question.bloomLevel),
    )).toHaveLength(68);
    expect([
      ...systemicPathologyCandidateBank.questions,
      ...systemicPathologyCandidateBank.objectives,
    ].every((item) => item.reviewStatus === 'draft')).toBe(true);
  });

  it('binds every question to a registered objective and source', () => {
    const objectives = new Map(
      systemicPathologyCandidateBank.objectives.map(
        (objective) => [objective.id, objective],
      ),
    );
    const sourceIds = new Set(
      systemicPathologyCandidateBank.sources.map((entry) => entry.id),
    );
    systemicPathologyCandidateBank.questions.forEach((question) => {
      expect(objectives.get(question.objectiveId)).toMatchObject({
        courseId: question.courseId,
        moduleId: question.moduleId,
        sectionId: question.sectionId,
      });
      question.sources.forEach((entry) => expect(sourceIds).toContain(entry.id));
    });
    systemicPathologyCandidateBank.objectives.forEach((objective) => {
      expect(systemicPathologyCandidateBank.questions.filter(
        (question) => question.objectiveId === objective.id,
      ).length).toBeGreaterThanOrEqual(3);
      objective.sourceIds.forEach((id) => expect(sourceIds).toContain(id));
    });
  });

  it('retains the five current systemic pathology blocks', () => {
    const corpus = JSON.stringify(systemicPathologyCandidateBank);
    expect(corpus).toMatch(/breast/i);
    expect(corpus).toMatch(/cardiovascular/i);
    expect(corpus).toMatch(/endocrine/i);
    expect(corpus).toMatch(/gastrointestinal/i);
    expect(corpus).toMatch(/renal/i);
    expect(corpus).toMatch(/glomerul/i);
  });

  it('retains exact original SVG bytes and normalized interaction geometry', () => {
    for (const [file, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      const path = `public/images/courses/systemic-pathology/assessment/${file}`;
      const bytes = readFileSync(path);
      const svg = bytes.toString('utf8');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
      expect(svg).toMatch(/<svg[^>]+viewBox=/);
      expect(svg).not.toMatch(/correct|answer|<script/i);
    }
    systemicPathologyCandidateBank.questions.forEach((question) => {
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
