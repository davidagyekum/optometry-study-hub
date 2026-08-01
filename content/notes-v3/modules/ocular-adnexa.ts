import ocularAdnexaMarkdown from '@/content/notes-v3/sources/ocular-adnexa.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('ocular-adnexa');
if (!studyModule) throw new Error('Ocular Adnexa module is not registered.');

const sources: StudySource[] = [
  {
    id: 'ocular-adnexa-deck',
    title: 'Ocular Anatomy and Physiology — The Ocular Adnexa and Lacrimal Apparatus',
    citation: 'Supplied Brien Holden Vision Institute teaching material.',
  },
  {
    id: 'ocular-adnexa-curated-audit',
    title: 'Repository-aligned lacrimal pathway corrections',
    citation: 'Course correction audit for parasympathetic secretion and greater/deep petrosal routing.',
  },
];

export const ocularAdnexaNotesV3 = compileAuthoredNotesV3({
  markdown: ocularAdnexaMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    landmarks: ['ocular-adnexa-deck'],
    muscles: ['ocular-adnexa-deck'],
    'tarsus-glands': ['ocular-adnexa-deck'],
    'lower-lid-blood': ['ocular-adnexa-deck'],
    'lacrimal-gland': ['ocular-adnexa-deck', 'ocular-adnexa-curated-audit'],
    tears: ['ocular-adnexa-deck', 'ocular-adnexa-curated-audit'],
  },
});
