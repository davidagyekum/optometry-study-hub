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
} as const;

describe('authored Notes V3 catalog', () => {
  it('resolves the four authored modules before Notes V2 with stable section IDs', async () => {
    expect(Object.keys(expectedSections).filter(hasAuthoredNotesV3)).toEqual([
      'environmental-vision',
      'autonomic-pharmacology',
      'tissue-foundations',
      'ocular-adnexa',
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

  it('keeps Notes V2 for other modules and falls back safely from malformed authored content', async () => {
    const blood = moduleMap.get('blood-supply');
    const environmental = moduleMap.get('environmental-vision');
    if (!blood || !environmental) throw new Error('Expected modules are missing');

    expect((await loadNotes(blood)).kind).toBe('v2');
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
    const contents = await Promise.all(Object.keys(expectedSections).map(async (moduleId) => {
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
    });

    const attributes = readFileSync(join(process.cwd(), '.gitattributes'), 'utf8');
    expect(attributes).toContain(
      'content/notes-v3/sources/*.md text eol=lf whitespace=-trailing-space',
    );

    const productionFiles = ['catalog.ts', 'compiler.ts', 'schema.ts', 'types.ts', 'modules/environmental-vision.ts', 'modules/autonomic-pharmacology.ts', 'modules/tissue-foundations.ts', 'modules/ocular-adnexa.ts']
      .map((file) => readFileSync(join(process.cwd(), 'content', 'notes-v3', file), 'utf8'))
      .join('\n');
    expect(productionFiles).not.toMatch(/question-bank|CandidateBank|correctOptionId|correctAnswer|answerRationale/);
  });
});
