import pharmacologyMarkdown from '@/content/notes-v3/sources/autonomic-pharmacology.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('autonomic-pharmacology');
if (!studyModule) throw new Error('Autonomic Pharmacology module is not registered.');

const sources: StudySource[] = [
  { id: 'pharm-adrenergic-source', title: 'Adrenergic Pharmacology', citation: 'Supplied Adrenergic.Pharmacology_OPTIII.pdf.' },
  { id: 'pharm-cholinergic-source', title: 'Cholinergic Pharmacology 2026', citation: 'Supplied cholinergic pharmacology 2026.pptx.' },
];

export const autonomicPharmacologyNotesV3 = compileAuthoredNotesV3({
  markdown: pharmacologyMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'pharm-adrenergic': ['pharm-adrenergic-source'],
    'pharm-cholinergic': ['pharm-cholinergic-source'],
  },
});
