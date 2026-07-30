import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { EXPECTED_TISSUE_CHECKSUM } from '@/lib/release/assertions';

const EXPECTED_ASSET_HASHES: Record<string, string> = {
  'cns-pns-myelin.svg':
    'd0f656ea49e62e8bdcc2756bb68b54bb4688b0de1a6ec97af0e07fad9bf7c286',
  'epithelium-orientation.svg':
    'c21cb849e45a2f80339099fd16fa3ab4bb7ae7b35bd9f8eaa65571b69f47d596',
  'neuron-structure.svg':
    '6a9f184e4490bde554e1bdede2a664c1c3a283012b1fe68529d0c7100e59a000',
  'peripheral-nerve-layers.svg':
    '16ba49000d35f46c5ca506850c1b518e126ef0b008b9dd174e3103e72278ae51',
};

function counts(field: 'sectionId' | 'format' | 'difficulty' | 'bloomLevel') {
  return tissueFoundationsCandidateBank.questions.reduce<Record<string, number>>(
    (result, question) => ({
      ...result,
      [question[field]]: (result[question[field]] ?? 0) + 1,
    }),
    {},
  );
}

describe('OPT 376 Tissue Foundations canonical bank', () => {
  it('retains the byte-identical canonical package identity', () => {
    const bytes = readFileSync(
      'content/question-bank/opt376/tissue-foundations/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex'))
      .toBe(EXPECTED_TISSUE_CHECKSUM);
    expect(tissueFoundationsCandidateBank).toMatchObject({
      id: 'opt376-tissue-foundations-candidate',
      courseIds: ['neuro-anatomy'],
    });
  });

  it('retains all exact content counts and draft boundaries', () => {
    expect(tissueFoundationsCandidateBank.questions).toHaveLength(80);
    expect(tissueFoundationsCandidateBank.objectives).toHaveLength(18);
    expect(tissueFoundationsCandidateBank.sources).toHaveLength(10);
    expect(counts('sectionId')).toEqual({
      'tissue-nervous': 44,
      'tissue-epithelium': 20,
      'tissue-connective': 16,
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
      foundation: 28,
      intermediate: 41,
      advanced: 11,
    });
    expect(counts('bloomLevel')).toEqual({
      remember: 5,
      understand: 20,
      apply: 39,
      analyze: 14,
      evaluate: 1,
      create: 1,
    });
    expect([
      ...tissueFoundationsCandidateBank.questions,
      ...tissueFoundationsCandidateBank.objectives,
    ].every((item) => item.reviewStatus === 'draft')).toBe(true);
  });

  it('binds every question to a registered objective and source', () => {
    const objectives = new Map(
      tissueFoundationsCandidateBank.objectives.map(
        (objective) => [objective.id, objective],
      ),
    );
    const sourceIds = new Set(
      tissueFoundationsCandidateBank.sources.map((source) => source.id),
    );
    tissueFoundationsCandidateBank.questions.forEach((question) => {
      const objective = objectives.get(question.objectiveId);
      expect(objective).toMatchObject({
        courseId: question.courseId,
        moduleId: question.moduleId,
        sectionId: question.sectionId,
      });
      question.sources.forEach((source) => expect(sourceIds).toContain(source.id));
    });
    tissueFoundationsCandidateBank.objectives.forEach((objective) => {
      expect(tissueFoundationsCandidateBank.questions.filter(
        (question) => question.objectiveId === objective.id,
      ).length).toBeGreaterThanOrEqual(2);
      objective.sourceIds.forEach((sourceId) => expect(sourceIds).toContain(sourceId));
    });
  });

  it('keeps normalized stems unique and every family at two or fewer', () => {
    const normalized = tissueFoundationsCandidateBank.questions.map(
      (question) => question.stem.trim().toLocaleLowerCase().replace(/\s+/g, ' '),
    );
    expect(new Set(normalized).size).toBe(80);
    const familyCounts = tissueFoundationsCandidateBank.questions.reduce<
      Record<string, number>
    >((result, question) => ({
      ...result,
      [question.familyId]: (result[question.familyId] ?? 0) + 1,
    }), {});
    expect(Math.max(...Object.values(familyCounts))).toBeLessThanOrEqual(2);
  });

  it('retains exact original SVG bytes and neutral normalized geometry', () => {
    for (const [file, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      const path = `public/images/courses/neuro-tissues/assessment/${file}`;
      const bytes = readFileSync(path);
      const source = bytes.toString('utf8');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
      expect(source).toMatch(/<svg[^>]+viewBox=/);
      expect(source).not.toMatch(/correct|answer|perineurium|axon hillock/i);
    }
    tissueFoundationsCandidateBank.questions.forEach((question) => {
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
