import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import {
  loadNotes,
  notesReadingPercentage,
  resolveNotes,
} from '@/content/notes-v3/catalog';
import {
  aqueousVitreousChecksum,
  autonomicPharmacologyChecksum,
  bloodSupplyChecksum,
  environmentalVisionChecksum,
  EXPECTED_AQUEOUS_VITREOUS_CHECKSUM,
  EXPECTED_AUTONOMIC_PHARMACOLOGY_CHECKSUM,
  EXPECTED_BLOOD_SUPPLY_CHECKSUM,
  EXPECTED_ENVIRONMENTAL_VISION_CHECKSUM,
  EXPECTED_HVP_CHECKSUM,
  EXPECTED_OCULAR_ADNEXA_CHECKSUM,
  EXPECTED_SYSTEMIC_PATHOLOGY_CHECKSUM,
  EXPECTED_TISSUE_CHECKSUM,
  hvpChecksum,
  ocularAdnexaChecksum,
  systemicPathologyChecksum,
  tissueChecksum,
} from '@/lib/release/assertions';

const batch3Sections = {
  'aqueous-vitreous': [
    'media-chambers',
    'production',
    'flow',
    'iop',
    'vitreous-anatomy',
    'vitreous-clinical',
  ],
  'blood-supply': [
    'arterial-origins',
    'ciliary',
    'retinal',
    'barriers',
    'microcirculation',
    'clinical-blood',
  ],
} as const;

const expectedRecallCounts: Record<string, number[]> = {
  'aqueous-vitreous': [7, 7, 7, 7, 8, 8],
  'blood-supply': [7, 7, 8, 8, 7, 8],
};

const manuscriptHashes = {
  'aqueous-vitreous.md': '4bf0b843da02d34c50c53bf67f8022ca66589a699171272725c3208d8f4e7120',
  'blood-supply.md': '6ce9debccc5dc85305ae8782549974daf5261d2483722fd31848498698f01074',
};

describe('Notes V3 Batch 3 content', () => {
  it('compiles all 12 stable sections with complete sources and 89 recall pairs', async () => {
    let recallTotal = 0;
    for (const [moduleId, expectedIds] of Object.entries(batch3Sections)) {
      const studyModule = moduleMap.get(moduleId);
      if (!studyModule) throw new Error(`Missing module: ${moduleId}`);
      const resolution = await loadNotes(studyModule);
      expect(resolution.kind).toBe('v3');
      if (resolution.kind !== 'v3') continue;

      expect(resolution.content.courseId).toBe('neuro-anatomy');
      expect(resolution.content.sections.map((section) => section.id)).toEqual(expectedIds);
      const registeredSources = new Set(resolution.content.sources.map((source) => source.id));

      resolution.content.sections.forEach((section, index) => {
        expect(section.figure).toBeDefined();
        expect(section.sourceIds.length).toBeGreaterThan(0);
        expect(section.sourceIds.every((sourceId) => registeredSources.has(sourceId))).toBe(true);
        expect(section.blocks.filter((block) => block.type === 'focus-map')).toHaveLength(1);
        expect(section.blocks.filter((block) => block.type === 'one-minute-summary')).toHaveLength(1);
        const recall = section.blocks.filter((block) => block.type === 'active-recall');
        expect(recall).toHaveLength(1);
        expect(recall[0].questions).toHaveLength(expectedRecallCounts[moduleId][index]);
        expect(recall[0].answers).toHaveLength(expectedRecallCounts[moduleId][index]);
        expect(recall[0].questions.length).toBe(recall[0].answers.length);
        recallTotal += recall[0].questions.length;
      });
    }
    expect(recallTotal).toBe(89);
  });

  it('retains the required Aqueous/Vitreous and Blood Supply teaching boundaries', async () => {
    const aqueousModule = moduleMap.get('aqueous-vitreous');
    const bloodModule = moduleMap.get('blood-supply');
    if (!aqueousModule || !bloodModule) throw new Error('Batch 3 modules are missing');
    const [aqueous, blood] = await Promise.all([loadNotes(aqueousModule), loadNotes(bloodModule)]);
    if (aqueous.kind !== 'v3' || blood.kind !== 'v3') throw new Error('Batch 3 Notes V3 failed to load');

    const aqueousText = JSON.stringify(aqueous.content).toLowerCase();
    for (const phrase of [
      'iris bombe',
      'blood–aqueous barrier',
      'schlemm',
      'uveoscleral',
      '90%',
      'tonometr',
      'hyaloid fossa',
      'retrolental space',
      '98–99%',
      'synchysis',
      'syneresis',
      'posterior vitreous detachment',
      'curtain',
    ]) expect(aqueousText).toContain(phrase);

    const bloodText = JSON.stringify(blood.content).toLowerCase();
    for (const phrase of [
      'internal carotid',
      'ophthalmic artery',
      'inner retina',
      'outer retina',
      'choriocapillaris',
      'zinn–haller',
      'vortex veins',
      'circumciliary',
      'foveal avascular zone',
      'fenestrated',
      'continuous',
      'no leakage',
      'pericyte',
      'red cell',
      'diabetic retinopathy',
      'sudden painless monocular visual loss',
    ]) expect(bloodText).toContain(phrase);
  });

  it('preserves reading percentages and falls back without migrating historical IDs', async () => {
    for (const [moduleId, sectionIds] of Object.entries(batch3Sections)) {
      const studyModule = moduleMap.get(moduleId);
      if (!studyModule) throw new Error(`Missing module: ${moduleId}`);
      const resolution = await loadNotes(studyModule);
      if (resolution.kind !== 'v3') throw new Error(`Notes V3 missing: ${moduleId}`);
      const read = [...sectionIds, 'unknown-historical-id'];
      const original = [...read];
      expect(notesReadingPercentage(resolution.content, read)).toBe(100);
      expect(read).toEqual(original);

      const thrown = await loadNotes(studyModule, async () => {
        throw new Error('Synthetic route chunk failure');
      });
      expect(thrown.kind).toBe('v2');
      const malformed = resolveNotes(studyModule, { schemaVersion: 3, moduleId });
      expect(malformed.kind).toBe('v2');
    }

    const unauthored = moduleMap.get('human-visual-perception');
    if (!unauthored) throw new Error('Human Visual Perception module missing');
    expect((await loadNotes(unauthored)).kind).toBe('v2');
  });

  it('preserves exact manuscript and canonical assessment identities', () => {
    for (const [file, expected] of Object.entries(manuscriptHashes)) {
      const bytes = readFileSync(join(process.cwd(), 'content', 'notes-v3', 'sources', file));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected);
    }
    expect([
      aqueousVitreousChecksum(),
      bloodSupplyChecksum(),
      hvpChecksum(),
      tissueChecksum(),
      ocularAdnexaChecksum(),
      environmentalVisionChecksum(),
      autonomicPharmacologyChecksum(),
      systemicPathologyChecksum(),
    ]).toEqual([
      EXPECTED_AQUEOUS_VITREOUS_CHECKSUM,
      EXPECTED_BLOOD_SUPPLY_CHECKSUM,
      EXPECTED_HVP_CHECKSUM,
      EXPECTED_TISSUE_CHECKSUM,
      EXPECTED_OCULAR_ADNEXA_CHECKSUM,
      EXPECTED_ENVIRONMENTAL_VISION_CHECKSUM,
      EXPECTED_AUTONOMIC_PHARMACOLOGY_CHECKSUM,
      EXPECTED_SYSTEMIC_PATHOLOGY_CHECKSUM,
    ]);
  });

  it('keeps Batch 3 behind separate answer-free lazy adapters with inert source HTML', () => {
    const root = join(process.cwd(), 'content', 'notes-v3');
    const catalog = readFileSync(join(root, 'catalog.ts'), 'utf8');
    expect(catalog).not.toContain('?raw');
    for (const moduleId of Object.keys(batch3Sections)) {
      expect(catalog).toContain(`import('@/content/notes-v3/modules/${moduleId}')`);
      const adapter = readFileSync(join(root, 'modules', `${moduleId}.ts`), 'utf8');
      expect(adapter).toContain(`/sources/${moduleId}.md?raw`);
      expect(adapter).not.toMatch(/question-bank|bank\.json|CandidateBank|correctOptionId|correctAnswer|answerRationale|acceptedAnswers|rubric/);
      const manuscript = readFileSync(join(root, 'sources', `${moduleId}.md`), 'utf8');
      expect(manuscript).not.toMatch(/<script|<iframe|<object|onerror\s*=|onclick\s*=/i);
    }
  });
});
