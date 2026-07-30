import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';

const EXPECTED_BANK_HASH =
  'cd453b8dd2f691db44bc93eb550f290d0c7213e44f16dc1913e5d75559b99385';
const EXPECTED_ASSET_HASHES: Record<string, string> = {
  'lighting-distribution.svg':
    '5c279be985e6ddfdae342bae4a6d5e90273198ec403adaddf2a13e3bb1567dde',
  'ocular-injury-paths.svg':
    '02d2bb3051ff8ad88fc48e561b062719e626a07e8434ece350ae25286f3de60f',
  'optical-radiation-eye.svg':
    'c3a928a9bc71c4eed44c308ec89451c88debf5a56702af22d43c84166aa83b86',
  'visual-task-workcell.svg':
    'b149cdacb60ced30569b9b53f87c331a4f56e90d1613e461c87a0782a9614305',
  'workstation-ergonomics.svg':
    '93180cb9a2e27dfdfe4bb1bc57c5c0ef6c8c05a313333a511a0652b2b6bc9e2b',
};

function counts(field: 'sectionId' | 'format' | 'difficulty' | 'bloomLevel') {
  return environmentalVisionCandidateBank.questions.reduce<Record<string, number>>(
    (result, question) => ({
      ...result,
      [question[field]]: (result[question[field]] ?? 0) + 1,
    }),
    {},
  );
}

describe('OPT 508 Environmental Vision canonical draft bank', () => {
  it('retains the exact authored identity and content counts', () => {
    const bytes = readFileSync(
      'content/question-bank/opt508/environmental-vision/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex'))
      .toBe(EXPECTED_BANK_HASH);
    expect(environmentalVisionCandidateBank).toMatchObject({
      id: 'opt508-environmental-vision-candidate',
      courseIds: ['environmental-vision'],
    });
    expect(environmentalVisionCandidateBank.questions).toHaveLength(80);
    expect(environmentalVisionCandidateBank.objectives).toHaveLength(18);
    expect(environmentalVisionCandidateBank.sources).toHaveLength(21);
    expect(counts('sectionId')).toEqual({
      'env-optics': 14,
      'env-task': 14,
      'env-ergonomics': 14,
      'env-hazards': 15,
      'env-protection': 13,
      'env-lighting': 10,
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
      foundation: 26,
      intermediate: 39,
      advanced: 15,
    });
    expect(counts('bloomLevel')).toEqual({
      remember: 4,
      understand: 11,
      apply: 33,
      analyze: 26,
      evaluate: 5,
      create: 1,
    });
    expect(environmentalVisionCandidateBank.questions.filter(
      (question) => ['apply', 'analyze', 'evaluate', 'create']
        .includes(question.bloomLevel),
    )).toHaveLength(65);
    expect([
      ...environmentalVisionCandidateBank.questions,
      ...environmentalVisionCandidateBank.objectives,
    ].every((item) => item.reviewStatus === 'draft')).toBe(true);
  });

  it('binds every question to a registered objective and source', () => {
    const objectives = new Map(
      environmentalVisionCandidateBank.objectives.map(
        (objective) => [objective.id, objective],
      ),
    );
    const sourceIds = new Set(
      environmentalVisionCandidateBank.sources.map((entry) => entry.id),
    );
    environmentalVisionCandidateBank.questions.forEach((question) => {
      expect(objectives.get(question.objectiveId)).toMatchObject({
        courseId: question.courseId,
        moduleId: question.moduleId,
        sectionId: question.sectionId,
      });
      question.sources.forEach((entry) => expect(sourceIds).toContain(entry.id));
    });
    environmentalVisionCandidateBank.objectives.forEach((objective) => {
      expect(environmentalVisionCandidateBank.questions.filter(
        (question) => question.objectiveId === objective.id,
      ).length).toBeGreaterThanOrEqual(2);
      objective.sourceIds.forEach((id) => expect(sourceIds).toContain(id));
    });
  });

  it('retains the key optics, hazard, protection and lighting contracts', () => {
    const corpus = JSON.stringify(environmentalVisionCandidateBank);
    expect(corpus).toMatch(/ultraviolet/i);
    expect(corpus).toMatch(/visual task/i);
    expect(corpus).toMatch(/ergonomic/i);
    expect(corpus).toMatch(/chemical/i);
    expect(corpus).toMatch(/face shield/i);
    expect(corpus).toMatch(/illuminance/i);
  });

  it('retains exact original SVG bytes and normalized interaction geometry', () => {
    for (const [file, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      const path = `public/images/courses/environmental/assessment/${file}`;
      const bytes = readFileSync(path);
      const svg = bytes.toString('utf8');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
      expect(svg).toMatch(/<svg[^>]+viewBox=/);
      expect(svg).not.toMatch(/correct|answer|<script|<text/i);
    }
    environmentalVisionCandidateBank.questions.forEach((question) => {
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
