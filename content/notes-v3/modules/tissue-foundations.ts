import tissueFoundationsMarkdown from '@/content/notes-v3/sources/tissue-foundations.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('tissue-foundations');
if (!studyModule) throw new Error('Tissue Foundations module is not registered.');

const sources: StudySource[] = [
  {
    id: 'tissue-nervous-deck',
    title: 'Nervous System — Overview of Nervous Tissue',
    citation: 'Supplied nervous-tissue teaching presentation.',
  },
  {
    id: 'tissue-connective-deck',
    title: 'Connective Tissue',
    citation: 'Supplied connective-tissue teaching presentation.',
  },
  {
    id: 'tissue-epithelium-deck',
    title: 'Overview of Epithelium',
    citation: 'Supplied epithelium teaching presentation.',
  },
];

export const tissueFoundationsNotesV3 = compileAuthoredNotesV3({
  markdown: tissueFoundationsMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'tissue-nervous': ['tissue-nervous-deck'],
    'tissue-connective': ['tissue-connective-deck', 'tissue-epithelium-deck'],
    'tissue-epithelium': ['tissue-epithelium-deck'],
  },
});
