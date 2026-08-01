import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { loadNotes, notesReadingPercentage } from '@/content/notes-v3/catalog';

const batch2Sections = {
  'tissue-foundations': [
    'tissue-nervous',
    'tissue-connective',
    'tissue-epithelium',
  ],
  'ocular-adnexa': [
    'landmarks',
    'muscles',
    'tarsus-glands',
    'lower-lid-blood',
    'lacrimal-gland',
    'tears',
  ],
} as const;

const expectedRecallCounts: Record<string, number[]> = {
  'tissue-foundations': [8, 8, 8],
  'ocular-adnexa': [6, 6, 6, 6, 7, 8],
};

describe('Notes V3 Batch 2 content', () => {
  it('compiles every stable section with complete sources and teaching checkpoints', async () => {
    for (const [moduleId, expectedIds] of Object.entries(batch2Sections)) {
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
        expect(recall[0].answers.every((answer) => !answer.endsWith('---'))).toBe(true);
      });
    }
  });

  it('retains the Tissue scope boundary, qualifications and the Ocular course corrections', async () => {
    const tissueModule = moduleMap.get('tissue-foundations');
    const ocularModule = moduleMap.get('ocular-adnexa');
    if (!tissueModule || !ocularModule) throw new Error('Batch 2 modules are missing');
    const [tissue, ocular] = await Promise.all([
      loadNotes(tissueModule),
      loadNotes(ocularModule),
    ]);
    if (tissue.kind !== 'v3' || ocular.kind !== 'v3') throw new Error('Batch 2 Notes V3 failed to load');

    const tissueText = JSON.stringify(tissue.content).toLowerCase();
    expect(tissueText).toContain('glia outnumber neurons');
    expect(tissueText).toContain('teaching approximation');
    expect(tissueText).toContain('no protein synthesis in axon');
    expect(tissueText).toContain('macrophage lineage');
    expect(tissueText).toContain('markedly limited axonal regeneration');
    expect(tissueText).toContain('vascularity varies widely');
    expect(tissueText).toContain('specialised cartilage and bone');

    const ocularText = JSON.stringify(ocular.content).toLowerCase();
    expect(ocularText).toContain('parasympathetic secretomotor activity is the dominant driver');
    expect(ocularText).toContain('greater petrosal nerve carries parasympathetic fibres');
    expect(ocularText).toContain('deep petrosal');
    expect(ocularText).toContain('sympathetic component');
    expect(ocularText).toContain('afferent sensory limb');
    expect(ocularText).toContain('efferent parasympathetic limb');
  });

  it('preserves completion percentages and unknown historical IDs without migration', async () => {
    for (const [moduleId, sectionIds] of Object.entries(batch2Sections)) {
      const studyModule = moduleMap.get(moduleId);
      if (!studyModule) throw new Error(`Missing module: ${moduleId}`);
      const resolution = await loadNotes(studyModule);
      if (resolution.kind !== 'v3') throw new Error(`Notes V3 missing: ${moduleId}`);
      const read = [...sectionIds, 'unknown-historical-id'];
      const original = [...read];
      expect(notesReadingPercentage(resolution.content, read)).toBe(100);
      expect(read).toEqual(original);
    }
  });

  it('falls back to Notes V2 when a route-specific authored loader fails', async () => {
    const studyModule = moduleMap.get('tissue-foundations');
    if (!studyModule) throw new Error('Tissue Foundations module missing');
    const resolution = await loadNotes(studyModule, async () => {
      throw new Error('Synthetic chunk failure');
    });
    expect(resolution.kind).toBe('v2');
    if (resolution.kind === 'v2') expect(resolution.reason).toMatch(/could not be loaded/i);
  });

  it('keeps each authored manuscript behind its own answer-free dynamic module', () => {
    const root = join(process.cwd(), 'content', 'notes-v3');
    const catalog = readFileSync(join(root, 'catalog.ts'), 'utf8');
    expect(catalog).not.toContain('?raw');
    for (const moduleId of [
      'environmental-vision',
      'autonomic-pharmacology',
      'tissue-foundations',
      'ocular-adnexa',
    ]) {
      expect(catalog).toContain(`import('@/content/notes-v3/modules/${moduleId}')`);
      const adapter = readFileSync(join(root, 'modules', `${moduleId}.ts`), 'utf8');
      expect(adapter).toContain(`/sources/${moduleId}.md?raw`);
      expect(adapter).not.toMatch(/question-bank|CandidateBank|correctOptionId|answerRationale|acceptedAnswers/);
    }
  });
});
