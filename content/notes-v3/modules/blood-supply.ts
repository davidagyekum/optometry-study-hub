import bloodSupplyMarkdown from '@/content/notes-v3/sources/blood-supply.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('blood-supply');
if (!studyModule) throw new Error('Blood Supply module is not registered.');

const sources: StudySource[] = [
  {
    id: 'blood-supply-lecture',
    title: 'Blood vessels of the head: Blood supply to the eyes',
    citation: 'Supplied OPT 376 teaching presentation.',
  },
  {
    id: 'blood-supply-curated-coverage',
    title: 'Repository-aligned six-section Blood Supply coverage',
    citation: 'The existing six-section curated blueprint is cited only as an answer-free coverage boundary.',
  },
];

const sourceIds = ['blood-supply-lecture', 'blood-supply-curated-coverage'];

export const bloodSupplyNotesV3 = compileAuthoredNotesV3({
  markdown: bloodSupplyMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'arterial-origins': sourceIds,
    ciliary: sourceIds,
    retinal: sourceIds,
    barriers: sourceIds,
    microcirculation: sourceIds,
    'clinical-blood': sourceIds,
  },
});
