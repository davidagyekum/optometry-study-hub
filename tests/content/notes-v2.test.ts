import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  notesV2Catalog,
  notesV2ReadingPercentage,
  notesV2SectionIds,
  resolveNotesV2,
} from '@/content/notes-v2/catalog';
import { studyModuleContentV2Schema } from '@/content/notes-v2/schema';
import { modules } from '@/content/legacy/moduleCatalog';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { loadStore, saveStore } from '@/lib/storage/store';

const curatedBanks = new Map([
  ['human-visual-perception', humanVisualPerceptionCandidateBank],
  ['tissue-foundations', tissueFoundationsCandidateBank],
  ['ocular-adnexa', ocularAdnexaCandidateBank],
  ['aqueous-vitreous', aqueousVitreousCandidateBank],
  ['blood-supply', bloodSupplyCandidateBank],
  ['environmental-vision', environmentalVisionCandidateBank],
  ['autonomic-pharmacology', autonomicPharmacologyCandidateBank],
  ['systemic-pathology', systemicPathologyCandidateBank],
]);

const expectedSections: Record<string, string[]> = {
  'human-visual-perception': ['hvp-foundations', 'hvp-retina', 'hvp-lgn', 'hvp-extrastriate'],
  'environmental-vision': ['env-optics', 'env-task', 'env-ergonomics', 'env-hazards', 'env-protection', 'env-lighting'],
  'tissue-foundations': ['tissue-nervous', 'tissue-connective', 'tissue-epithelium'],
  'ocular-adnexa': ['landmarks', 'muscles', 'tarsus-glands', 'lower-lid-blood', 'lacrimal-gland', 'tears'],
  'aqueous-vitreous': ['media-chambers', 'production', 'flow', 'iop', 'vitreous-anatomy', 'vitreous-clinical'],
  'blood-supply': ['arterial-origins', 'ciliary', 'retinal', 'barriers', 'microcirculation', 'clinical-blood'],
  'autonomic-pharmacology': ['pharm-adrenergic', 'pharm-cholinergic'],
  'systemic-pathology': ['path-breast', 'path-cardio', 'path-endocrine', 'path-gi', 'path-renal'],
  'schematic-eye-refractive-states': ['vergence-paraxial', 'schematic-models', 'emmetropia', 'myopia', 'hyperopia', 'far-point-axial'],
  'multifocal-foundations': ['presbyopia-add', 'construction-types', 'segment-designs', 'nvp-prism', 'jump-tca', 'bifocal-fitting', 'trifocals'],
  'progressive-addition-lenses': ['pal-principles', 'pal-designs', 'reference-markings', 'patient-frame', 'measure-order', 'verification-delivery', 'pal-troubleshooting'],
  'pd-and-dispensing': ['quality-mistakes', 'pd-concepts', 'pd-rule-methods', 'pupillometer', 'near-pd', 'pd-prism', 'final-dispensing'],
  'special-lenses': ['lenticular-aspheric', 'aniseikonia', 'spectacle-magnification', 'safety-filters', 'fresnel-prism', 'slab-off'],
};

describe('Notes V2 content contract', () => {
  it('validates all thirteen modules with the exact stable reading anchors', () => {
    expect(notesV2Catalog.size).toBe(13);
    for (const legacyModule of modules) {
      const content = notesV2Catalog.get(legacyModule.id);
      expect(content, legacyModule.id).toBeDefined();
      expect(studyModuleContentV2Schema.safeParse(content).success, legacyModule.id).toBe(true);
      expect(content?.sections.map((section) => section.id), legacyModule.id)
        .toEqual(expectedSections[legacyModule.id]);
      const recognized = new Set(notesV2SectionIds(content!));
      expect(legacyModule.sections.every((section) => recognized.has(section.id)), legacyModule.id)
        .toBe(true);
    }
    expect(notesV2Catalog.get('systemic-pathology')?.legacySupplementalSections
      ?.map((section) => section.id)).toEqual(['path-lymph', 'path-respiratory']);
  });

  it('maps every curated question section to a primary Notes V2 anchor', () => {
    for (const [moduleId, bank] of curatedBanks) {
      const noteIds = new Set(notesV2Catalog.get(moduleId)?.sections.map((section) => section.id));
      const bankIds = new Set(bank.questions.map((question) => question.sectionId));
      expect([...bankIds].filter((sectionId) => !noteIds.has(sectionId)), moduleId).toEqual([]);
    }
  });

  it('registers every source and retains every referenced local figure', () => {
    for (const [moduleId, content] of notesV2Catalog) {
      const registered = new Set(content.sources.map((source) => source.id));
      const sections = [...content.sections, ...(content.legacySupplementalSections ?? [])];
      for (const section of sections) {
        expect(section.sourceIds.every((sourceId) => registered.has(sourceId)), `${moduleId}:${section.id}`)
          .toBe(true);
        expect(existsSync(join(process.cwd(), 'public', section.figure?.src ?? '')), `${moduleId}:${section.id}`)
          .toBe(true);
        for (const block of section.blocks) {
          if (block.type === 'source-note') {
            expect(block.sourceIds.every((sourceId) => registered.has(sourceId)), `${moduleId}:${section.id}`)
              .toBe(true);
          }
        }
      }
    }
  });

  it('falls back without mutating progress when candidate content is malformed', () => {
    const legacyModule = modules.find((item) => item.id === 'systemic-pathology');
    if (!legacyModule) throw new Error('Systemic Pathology module missing');
    const historical = ['path-breast', 'path-lymph', 'unknown-historical-id'];
    expect(resolveNotesV2(legacyModule, { schemaVersion: 2 })).toEqual({
      kind: 'legacy',
      reason: 'Structured notes could not be validated. The original notes remain available.',
    });
    expect(historical).toEqual(['path-breast', 'path-lymph', 'unknown-historical-id']);
    const content = notesV2Catalog.get(legacyModule.id);
    if (!content) throw new Error('Systemic Pathology Notes V2 missing');
    expect(notesV2ReadingPercentage(content, historical)).toBe(29);
    expect(notesV2SectionIds(content)).toContain('path-lymph');
    expect(notesV2SectionIds(content)).toContain('path-respiratory');
  });

  it('round-trips stable and unknown reading IDs without a storage-version change', () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    };
    const store = createEmptyStoreV2();
    store.read['systemic-pathology'] = ['path-breast', 'path-lymph', 'unknown-historical-id'];
    expect(saveStore(store, storage)).toBe(true);
    const reloaded = loadStore(storage);
    expect(reloaded.version).toBe(2);
    expect(reloaded.read['systemic-pathology'])
      .toEqual(['path-breast', 'path-lymph', 'unknown-historical-id']);
  });

  it('keeps answer keys and rationales out of the production notes bundle', () => {
    const source = readFileSync(join(process.cwd(), 'content/notes-v2/catalog.ts'), 'utf8');
    expect(source).not.toMatch(/question-bank|correctOption|correctAnswer|rationale/);
    const serialized = JSON.stringify([...notesV2Catalog.values()]);
    expect(serialized).not.toMatch(/"correctOptionIds?"|"rationale"|"answer"/);
  });
});