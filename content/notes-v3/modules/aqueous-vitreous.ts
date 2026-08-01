import aqueousVitreousMarkdown from '@/content/notes-v3/sources/aqueous-vitreous.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('aqueous-vitreous');
if (!studyModule) throw new Error('Aqueous and Vitreous module is not registered.');

const sources: StudySource[] = [
  {
    id: 'aqueous-vitreous-lecture',
    title: 'OPT 376: The Internal Transparent Media of the Eye',
    citation: 'Supplied OPT 376 teaching presentation.',
  },
  {
    id: 'aqueous-vitreous-source-audit',
    title: 'Repository-aligned Aqueous and Vitreous source audit',
    citation: 'docs/AQUEOUS_VITREOUS_SOURCE_AUDIT.md; course values and terminology are retained with labelled qualifications.',
  },
];

const sourceIds = ['aqueous-vitreous-lecture', 'aqueous-vitreous-source-audit'];

export const aqueousVitreousNotesV3 = compileAuthoredNotesV3({
  markdown: aqueousVitreousMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'media-chambers': sourceIds,
    production: sourceIds,
    flow: sourceIds,
    iop: sourceIds,
    'vitreous-anatomy': sourceIds,
    'vitreous-clinical': sourceIds,
  },
});
