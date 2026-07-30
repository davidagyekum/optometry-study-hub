import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';

const EXPECTED_BANK_HASH =
  '7f8c0d7915bccd3c3ffcf2ac96bc44758366928198ec55e68ee5e5c55d43e143';
const EXPECTED_ASSET_HASHES: Record<string, string> = {
  'adrenergic-varicosity.svg':
    '1e2c20768ad43a88fda05ad17ded1640e45bb6851ce896eadb2dd906e857bf8d',
  'autonomic-effector-map.svg':
    'd4ec6f823e69ecf453b3bca5095a3a12e7815965afb6ed9c6606742f51509f87',
  'catecholamine-pathway.svg':
    'aeab6bd8b7c493999d96cb5eb285b90bc9c77f4beceb4a5ca7b5eb6a7f899c45',
  'cholinergic-synapse.svg':
    '235aaa2862e6be5edfb7334efd15b18b0f00eb8cde3a5e0d63336a23dd44d208',
  'ocular-autonomic-effects.svg':
    'db51ce14fd4517888e50f473fe26502a75b816dd10367ac44bd8f7b7fe735cc0',
};

function counts(field: 'sectionId' | 'format' | 'difficulty' | 'bloomLevel') {
  return autonomicPharmacologyCandidateBank.questions.reduce<Record<string, number>>(
    (result, question) => ({
      ...result,
      [question[field]]: (result[question[field]] ?? 0) + 1,
    }),
    {},
  );
}

describe('Autonomic Pharmacology canonical draft bank', () => {
  it('retains the exact authored identity and content counts', () => {
    const bytes = readFileSync(
      'content/question-bank/pharmacology/autonomic-pharmacology/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex'))
      .toBe(EXPECTED_BANK_HASH);
    expect(autonomicPharmacologyCandidateBank).toMatchObject({
      id: 'autonomic-pharmacology-candidate',
      courseIds: ['pharmacology'],
    });
    expect(autonomicPharmacologyCandidateBank.questions).toHaveLength(80);
    expect(autonomicPharmacologyCandidateBank.objectives).toHaveLength(20);
    expect(autonomicPharmacologyCandidateBank.sources).toHaveLength(18);
    expect(counts('sectionId')).toEqual({
      'pharm-adrenergic': 40,
      'pharm-cholinergic': 40,
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
      foundation: 16,
      intermediate: 40,
      advanced: 24,
    });
    expect(counts('bloomLevel')).toEqual({
      remember: 5,
      understand: 13,
      apply: 30,
      analyze: 29,
      evaluate: 1,
      create: 2,
    });
    expect(autonomicPharmacologyCandidateBank.questions.filter(
      (question) => ['apply', 'analyze', 'evaluate', 'create']
        .includes(question.bloomLevel),
    )).toHaveLength(62);
    expect([
      ...autonomicPharmacologyCandidateBank.questions,
      ...autonomicPharmacologyCandidateBank.objectives,
    ].every((item) => item.reviewStatus === 'draft')).toBe(true);
  });

  it('binds every question to a registered objective and source', () => {
    const objectives = new Map(
      autonomicPharmacologyCandidateBank.objectives.map(
        (objective) => [objective.id, objective],
      ),
    );
    const sourceIds = new Set(
      autonomicPharmacologyCandidateBank.sources.map((entry) => entry.id),
    );
    autonomicPharmacologyCandidateBank.questions.forEach((question) => {
      expect(objectives.get(question.objectiveId)).toMatchObject({
        courseId: question.courseId,
        moduleId: question.moduleId,
        sectionId: question.sectionId,
      });
      question.sources.forEach((entry) => expect(sourceIds).toContain(entry.id));
    });
    autonomicPharmacologyCandidateBank.objectives.forEach((objective) => {
      expect(autonomicPharmacologyCandidateBank.questions.filter(
        (question) => question.objectiveId === objective.id,
      ).length).toBeGreaterThanOrEqual(2);
      objective.sourceIds.forEach((id) => expect(sourceIds).toContain(id));
    });
  });

  it('retains key autonomic and ocular pharmacology contracts', () => {
    const corpus = JSON.stringify(autonomicPharmacologyCandidateBank);
    expect(corpus).toMatch(/adrenergic/i);
    expect(corpus).toMatch(/cholinergic/i);
    expect(corpus).toMatch(/catecholamine/i);
    expect(corpus).toMatch(/organophosphate/i);
    expect(corpus).toMatch(/intraocular pressure/i);
    expect(corpus).toMatch(/accommodation/i);
  });

  it('retains exact original SVG bytes and normalized interaction geometry', () => {
    for (const [file, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      const path = `public/images/courses/pharmacology/assessment/${file}`;
      const bytes = readFileSync(path);
      const svg = bytes.toString('utf8');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
      expect(svg).toMatch(/<svg[^>]+viewBox=/);
      expect(svg).not.toMatch(/correct|answer|<script/i);
    }
    autonomicPharmacologyCandidateBank.questions.forEach((question) => {
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
