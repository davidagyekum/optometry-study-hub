import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { loadNotes, notesReadingPercentage, resolveNotes } from '@/content/notes-v3/catalog';
import { humanVisualPerceptionNotesV3 } from '@/content/notes-v3/modules/human-visual-perception';
import { systemicPathologyNotesV3 } from '@/content/notes-v3/modules/systemic-pathology';
import { studyModuleContentV3Schema } from '@/content/notes-v3/schema';
import type { StudyModuleContentV3 } from '@/content/notes-v3/types';
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

const manuscriptHashes = {
  'human-visual-perception.md': '5c5361cba83a5db98024e444ebb47e0bb3e0de8f44d7b7f6ee057580c903f278',
  'systemic-pathology.md': '5613703dc57e41d388c80e2b7d97d14d356b7e49127c14f27cbffe95283ca2a6',
};

function cloneContent(content: StudyModuleContentV3): StudyModuleContentV3 {
  return JSON.parse(JSON.stringify(content)) as StudyModuleContentV3;
}

describe('Notes V3 Batch 4 content', () => {
  it('preserves the canonical manuscript bytes and exact authored section identities', () => {
    for (const [file, expectedHash] of Object.entries(manuscriptHashes)) {
      const bytes = readFileSync(join(process.cwd(), 'content', 'notes-v3', 'sources', file));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
    }

    expect(humanVisualPerceptionNotesV3.sections.map((section) => section.id)).toEqual([
      'hvp-foundations',
      'hvp-retina',
      'hvp-lgn',
      'hvp-extrastriate',
    ]);
    expect(systemicPathologyNotesV3.sections.map((section) => section.id)).toEqual([
      'path-breast',
      'path-cardio',
      'path-endocrine',
      'path-gi',
      'path-renal',
    ]);
    expect(systemicPathologyNotesV3.legacySupplementalSections?.map((section) => section.id)).toEqual([
      'path-lymph',
      'path-respiratory',
    ]);
  });

  it('compiles nine focus maps, nine summaries and 168 matched recall pairs', () => {
    const contents = [humanVisualPerceptionNotesV3, systemicPathologyNotesV3];
    const blocks = contents.flatMap((content) => content.sections.flatMap((section) => section.blocks));
    const recall = blocks.filter((block) => block.type === 'active-recall');

    expect(blocks.filter((block) => block.type === 'focus-map')).toHaveLength(9);
    expect(blocks.filter((block) => block.type === 'one-minute-summary')).toHaveLength(9);
    expect(recall.reduce((total, block) => total + block.questions.length, 0)).toBe(168);
    expect(recall.reduce((total, block) => total + block.answers.length, 0)).toBe(168);
    expect(humanVisualPerceptionNotesV3.sections
      .flatMap((section) => section.blocks)
      .filter((block) => block.type === 'active-recall')
      .reduce((total, block) => total + block.questions.length, 0)).toBe(55);
    expect(systemicPathologyNotesV3.sections
      .flatMap((section) => section.blocks)
      .filter((block) => block.type === 'active-recall')
      .reduce((total, block) => total + block.questions.length, 0)).toBe(113);
  });

  it('keeps every primary and supplemental source mapping complete and answer-free', () => {
    for (const content of [humanVisualPerceptionNotesV3, systemicPathologyNotesV3]) {
      expect(studyModuleContentV3Schema.safeParse(content).success).toBe(true);
      const sourceIds = new Set(content.sources.map((source) => source.id));
      for (const section of [...content.sections, ...(content.legacySupplementalSections ?? [])]) {
        expect(section.sourceIds.length).toBeGreaterThan(0);
        expect(section.sourceIds.every((sourceId) => sourceIds.has(sourceId))).toBe(true);
      }
    }

    const adapterRoot = join(process.cwd(), 'content', 'notes-v3', 'modules');
    const adapters = ['human-visual-perception.ts', 'systemic-pathology.ts']
      .map((file) => readFileSync(join(adapterRoot, file), 'utf8'))
      .join('\n');
    expect(adapters).not.toMatch(/question-bank|CandidateBank|correctOptionId|correctAnswer|answerRationale|acceptedAnswers|rubric/);
    expect(adapters).toContain('no assessment-bank data imported');
    expect(adapters).toContain('direct Endocrine Pathology deck was unavailable');
  });

  it('retains the HVP corrections and Systemic source boundaries', () => {
    const hvp = JSON.stringify(humanVisualPerceptionNotesV3).toLowerCase();
    for (const phrase of [
      'melanopsin',
      'small bistratified',
      'midget',
      'parasol',
      's-cones',
      'end-stopped',
      'orientation',
      'developmental dyslexia',
      'interacting',
    ]) expect(hvp).toContain(phrase);

    const systemic = JSON.stringify(systemicPathologyNotesV3).toLowerCase();
    expect(systemic).toContain('direct endocrine pathology deck was unavailable');
    expect(systemic).toContain('inflammatory bowel disease');
    expect(systemic).toContain('comparison is not invented here');
    expect(systemic).toContain('intellectual disability');
  });

  it('rejects malformed supplemental content as one complete V3 candidate', () => {
    const duplicate = cloneContent(systemicPathologyNotesV3);
    duplicate.legacySupplementalSections![0].id = duplicate.sections[0].id;
    expect(studyModuleContentV3Schema.safeParse(duplicate).success).toBe(false);

    const unknownSectionSource = cloneContent(systemicPathologyNotesV3);
    unknownSectionSource.legacySupplementalSections![0].sourceIds = ['missing-source'];
    expect(studyModuleContentV3Schema.safeParse(unknownSectionSource).success).toBe(false);

    const unknownBlockSource = cloneContent(systemicPathologyNotesV3);
    const sourceNote = unknownBlockSource.legacySupplementalSections![0].blocks.find((block) => block.type === 'source-note');
    if (!sourceNote || sourceNote.type !== 'source-note') throw new Error('Expected supplemental source note');
    sourceNote.sourceIds = ['missing-source-note'];
    expect(studyModuleContentV3Schema.safeParse(unknownBlockSource).success).toBe(false);

    const badTable = cloneContent(systemicPathologyNotesV3);
    const table = badTable.legacySupplementalSections![0].blocks.find((block) => block.type === 'comparison-table');
    if (!table || table.type !== 'comparison-table') throw new Error('Expected supplemental comparison table');
    table.rows[0] = [table.rows[0][0]];
    expect(studyModuleContentV3Schema.safeParse(badTable).success).toBe(false);

    const studyModule = moduleMap.get('systemic-pathology');
    if (!studyModule) throw new Error('Systemic Pathology module missing');
    expect(resolveNotes(studyModule, duplicate).kind).toBe('v2');
    expect(resolveNotes(studyModule, unknownBlockSource).kind).toBe('v2');
    expect(resolveNotes(studyModule, badTable).kind).toBe('v2');
  });

  it('preserves all seven Systemic reading IDs and ignores unknown historical IDs', () => {
    const content = systemicPathologyNotesV3;
    const allIds = [
      ...content.sections,
      ...(content.legacySupplementalSections ?? []),
    ].map((section) => section.id);

    expect(notesReadingPercentage(content, [])).toBe(0);
    expect(notesReadingPercentage(content, [allIds[0]])).toBe(14);
    expect(notesReadingPercentage(content, allIds.slice(0, 5))).toBe(71);
    expect(notesReadingPercentage(content, allIds)).toBe(100);
    const withUnknown = [...allIds, 'unknown-historical-id'];
    const preserved = [...withUnknown];
    expect(notesReadingPercentage(content, withUnknown)).toBe(100);
    expect(withUnknown).toEqual(preserved);
  });

  it('falls back to Notes V2 for absent, thrown and malformed authored loaders', async () => {
    const studyModule = moduleMap.get('systemic-pathology');
    if (!studyModule) throw new Error('Systemic Pathology module missing');

    expect((await loadNotes(studyModule, null)).kind).toBe('v2');
    expect((await loadNotes(studyModule, async () => { throw new Error('Synthetic chunk failure'); })).kind).toBe('v2');
    expect(resolveNotes(studyModule, { ...systemicPathologyNotesV3, sections: [] }).kind).toBe('v2');
  });

  it('preserves all eight canonical assessment-bank hashes', () => {
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
});
