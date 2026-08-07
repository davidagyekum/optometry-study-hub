import pdAndDispensingMarkdown from '@/content/notes-v3/sources/pd-and-dispensing.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('pd-and-dispensing');
if (!studyModule) throw new Error('Interpupillary Distance and Dispensing Quality module is not registered.');

const sources: StudySource[] = [
  {
    id: 'opt370-non-optical-considerations',
    title: 'NON OPTICAL CONSIDERATION',
    citation: 'Slides 1-71: dispensing mistakes, PD concepts and measurement, pupillometer, near PD and unwanted prism',
  },
];
const sourceIds = sources.map((source) => source.id);

export const pdAndDispensingNotesV3 = compileAuthoredNotesV3({
  markdown: pdAndDispensingMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'quality-mistakes': sourceIds,
    'pd-concepts': sourceIds,
    'pd-rule-methods': sourceIds,
    'pupillometer': sourceIds,
    'near-pd': sourceIds,
    'pd-prism': sourceIds,
    'final-dispensing': sourceIds,
  },
});
