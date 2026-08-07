import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import {
  hasAuthoredNotesV3,
  loadNotes,
  notesReadingPercentage,
  resolveNotes,
} from '@/content/notes-v3/catalog';
import { studyModuleContentV3Schema } from '@/content/notes-v3/schema';

const expectedSections = {
  'environmental-vision': ['env-optics', 'env-task', 'env-ergonomics', 'env-hazards', 'env-protection', 'env-lighting'],
  'autonomic-pharmacology': ['pharm-adrenergic', 'pharm-cholinergic'],
  'tissue-foundations': ['tissue-nervous', 'tissue-connective', 'tissue-epithelium'],
  'ocular-adnexa': ['landmarks', 'muscles', 'tarsus-glands', 'lower-lid-blood', 'lacrimal-gland', 'tears'],
  'aqueous-vitreous': ['media-chambers', 'production', 'flow', 'iop', 'vitreous-anatomy', 'vitreous-clinical'],
  'blood-supply': ['arterial-origins', 'ciliary', 'retinal', 'barriers', 'microcirculation', 'clinical-blood'],
  'human-visual-perception': ['hvp-foundations', 'hvp-retina', 'hvp-lgn', 'hvp-extrastriate'],
  'systemic-pathology': ['path-breast', 'path-cardio', 'path-endocrine', 'path-gi', 'path-renal'],
  'schematic-eye-refractive-states': ['vergence-paraxial', 'schematic-models', 'emmetropia', 'myopia', 'hyperopia', 'far-point-axial'],
  'multifocal-foundations': ['presbyopia-add', 'construction-types', 'segment-designs', 'nvp-prism', 'jump-tca', 'bifocal-fitting', 'trifocals'],
  'progressive-addition-lenses': ['pal-principles', 'pal-designs', 'reference-markings', 'patient-frame', 'measure-order', 'verification-delivery', 'pal-troubleshooting'],
  'pd-and-dispensing': ['quality-mistakes', 'pd-concepts', 'pd-rule-methods', 'pupillometer', 'near-pd', 'pd-prism', 'final-dispensing'],
  'special-lenses': ['lenticular-aspheric', 'aniseikonia', 'spectacle-magnification', 'safety-filters', 'fresnel-prism', 'slab-off'],
} as const;

describe('authored Notes V3 catalog', () => {
  it('resolves all thirteen authored modules before Notes V2 with stable section IDs', async () => {
    expect(Object.keys(expectedSections).filter(hasAuthoredNotesV3)).toEqual([
      'environmental-vision',
      'autonomic-pharmacology',
      'tissue-foundations',
      'ocular-adnexa',
      'aqueous-vitreous',
      'blood-supply',
      'human-visual-perception',
      'systemic-pathology',
      'schematic-eye-refractive-states',
      'multifocal-foundations',
      'progressive-addition-lenses',
      'pd-and-dispensing',
      'special-lenses',
    ]);

    for (const [moduleId, sectionIds] of Object.entries(expectedSections)) {
      const studyModule = moduleMap.get(moduleId);
      if (!studyModule) throw new Error(`Missing module: ${moduleId}`);
      const resolution = await loadNotes(studyModule);
      expect(resolution.kind).toBe('v3');
      if (resolution.kind !== 'v3') continue;
      expect(studyModuleContentV3Schema.safeParse(resolution.content).success).toBe(true);
      expect(resolution.content.sections.map((section) => section.id)).toEqual(sectionIds);
      expect(resolution.content.sections.every((section) => section.figure && section.sourceIds.length > 0)).toBe(true);
      expect(resolution.content.sources.length).toBeGreaterThan(0);
    }
  });

  it('falls back safely from malformed authored content', async () => {
    const humanVisualPerception = moduleMap.get('human-visual-perception');
    const environmental = moduleMap.get('environmental-vision');
    if (!humanVisualPerception || !environmental) throw new Error('Expected modules are missing');

    expect((await loadNotes(humanVisualPerception)).kind).toBe('v3');
    const fallback = resolveNotes(environmental, { schemaVersion: 3, moduleId: environmental.id });
    expect(fallback.kind).toBe('v2');
    if (fallback.kind === 'v2') expect(fallback.reason).toMatch(/could not be validated/i);
  });

  it('preserves reading progress through the stable section IDs', async () => {
    const studyModule = moduleMap.get('environmental-vision');
    if (!studyModule) throw new Error('Environmental Vision module missing');
    const resolution = await loadNotes(studyModule);
    if (resolution.kind !== 'v3') throw new Error('Environmental Notes V3 missing');
    expect(notesReadingPercentage(resolution.content, ['env-optics', 'env-task', 'unknown-historical-id'])).toBe(33);
    expect(notesReadingPercentage(resolution.content, expectedSections['environmental-vision'])).toBe(100);
  });

  it('contains the required teaching blocks, focus tiers, recall and source-scoped corrections', async () => {
    const establishedRichNotesModuleIds = [
      'environmental-vision',
      'autonomic-pharmacology',
      'tissue-foundations',
      'ocular-adnexa',
      'aqueous-vitreous',
      'blood-supply',
      'human-visual-perception',
      'systemic-pathology',
    ];
    const contents = await Promise.all(establishedRichNotesModuleIds.map(async (moduleId) => {
      const studyModule = moduleMap.get(moduleId);
      if (!studyModule) throw new Error(`Missing module: ${moduleId}`);
      const resolution = await loadNotes(studyModule);
      if (resolution.kind !== 'v3') throw new Error(`Notes V3 missing: ${moduleId}`);
      return resolution.content;
    }));

    for (const content of contents) {
      const blocks = content.sections.flatMap((section) => section.blocks);
      expect(blocks.some((block) => block.type === 'focus-map')).toBe(true);
      expect(blocks.some((block) => block.type === 'rich-explanation')).toBe(true);
      expect(blocks.some((block) => block.type === 'cause-effect-chain')).toBe(true);
      expect(blocks.some((block) => block.type === 'memory-hook')).toBe(true);
      expect(blocks.some((block) => block.type === 'exam-trap')).toBe(true);
      expect(blocks.some((block) => block.type === 'worked-example')).toBe(true);
      expect(blocks.some((block) => block.type === 'active-recall')).toBe(true);
      expect(blocks.some((block) => block.type === 'one-minute-summary')).toBe(true);
      expect(blocks.some((block) => block.type === 'definition-list')).toBe(true);

      const focusMaps = blocks.filter((block) => block.type === 'focus-map');
      expect(focusMaps.every((block) => block.groups.map((group) => group.priority).join(',') === 'must,should,useful')).toBe(true);
      const recall = blocks.filter((block) => block.type === 'active-recall');
      expect(recall.every((block) => block.questions.length === block.answers.length)).toBe(true);
    }

    const environmental = JSON.stringify(contents.find((content) => content.moduleId === 'environmental-vision'));
    const pharmacology = JSON.stringify(contents.find((content) => content.moduleId === 'autonomic-pharmacology'));
    expect(environmental).toContain('Penetrating');
    expect(environmental.toLowerCase()).toContain('immediate irrigation');
    expect(pharmacology.toLowerCase()).toContain('topical timolol');
    expect(pharmacology).toContain('pralidoxime');
  });
  it('preserves the reviewed manuscript bytes and keeps assessment banks out of production Notes V3', () => {
    const sourceDir = join(process.cwd(), 'content', 'notes-v3', 'sources');
    const hashes = Object.fromEntries(readdirSync(sourceDir).map((file) => {
      const bytes = readFileSync(join(sourceDir, file));
      return [file, createHash('sha256').update(bytes).digest('hex')];
    }));
    expect(hashes).toEqual({
      'autonomic-pharmacology.md': '60750407cc64ffb1c41aac6c9279bd3fe6f9f9751ff67d5f9ed2af42ce25fee6',
      'environmental-vision.md': '067cd76956aa1d71ee07630db409eed2e76a47d943bc2961fe2fd24bf843a074',
      'ocular-adnexa.md': '7e81766be4986edbdd601962b12c9f8c7552111aca1414b0a4ba33e049b30cfc',
      'tissue-foundations.md': 'd5e6401d89cb6ae6d618f7ec04c9092cab82c1257f4fc39d55b48680e4029152',
      'aqueous-vitreous.md': '4bf0b843da02d34c50c53bf67f8022ca66589a699171272725c3208d8f4e7120',
      'blood-supply.md': '6ce9debccc5dc85305ae8782549974daf5261d2483722fd31848498698f01074',
      'human-visual-perception.md': '5c5361cba83a5db98024e444ebb47e0bb3e0de8f44d7b7f6ee057580c903f278',
      'hvp-colour-perception.md': '05c5aa2869e1cfc9cd73cc61c591ed19ee363f06eb5c49c25fc8f674206347e7',
      'hvp-depth-perception.md': 'aa8cdb702fa6803aa67a9d3c71caa5c8dfcbf20cef5ec26cdb4241b9419b29db',
      'systemic-pathology.md': '5613703dc57e41d388c80e2b7d97d14d356b7e49127c14f27cbffe95283ca2a6',
      'schematic-eye-refractive-states.md': '2a4973ee65637552a6ea17924940a10104d1f2b5495b1f8f56a2178a4e29a59e',
      'multifocal-foundations.md': '7040a230f39539561d0fdeb100a1389d1918ca379631d197fdf9d9c588f462f6',
      'progressive-addition-lenses.md': '9be3c5d4ad9704f1acd5955230587fc0e95c20ed90fad2fdd41f91fa3b0281e2',
      'pd-and-dispensing.md': '14ebfb0d0b9e94c11a341b6c039f679a79c22552ab0b523d9c8d8e7854edf809',
      'special-lenses.md': '76dbfda8121e9dcf64d6f55dd32661d9b502e29ac8c766120f5b00cb4b8e4d97',
    });

    const attributes = readFileSync(join(process.cwd(), '.gitattributes'), 'utf8');
    expect(attributes).toContain(
      'content/notes-v3/sources/*.md text eol=lf whitespace=-trailing-space',
    );

    const productionFiles = ['catalog.ts', 'compiler.ts', 'schema.ts', 'types.ts', 'modules/environmental-vision.ts', 'modules/autonomic-pharmacology.ts', 'modules/tissue-foundations.ts', 'modules/ocular-adnexa.ts', 'modules/aqueous-vitreous.ts', 'modules/blood-supply.ts', 'modules/human-visual-perception.ts', 'modules/hvp-depth-perception.ts', 'modules/hvp-colour-perception.ts', 'modules/systemic-pathology.ts', 'modules/schematic-eye-refractive-states.ts', 'modules/multifocal-foundations.ts', 'modules/progressive-addition-lenses.ts', 'modules/pd-and-dispensing.ts', 'modules/special-lenses.ts']
      .map((file) => readFileSync(join(process.cwd(), 'content', 'notes-v3', file), 'utf8'))
      .join('\n');
    expect(productionFiles).not.toMatch(/question-bank|CandidateBank|correctOptionId|correctAnswer|answerRationale/);
  });
});
