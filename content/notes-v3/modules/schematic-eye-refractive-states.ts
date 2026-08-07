import schematicEyeRefractiveStatesMarkdown from '@/content/notes-v3/sources/schematic-eye-refractive-states.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('schematic-eye-refractive-states');
if (!studyModule) throw new Error('Schematic Eye and Refractive States module is not registered.');

const sources: StudySource[] = [
  {
    id: 'opt370-schematic-eye-lecture',
    title: 'The schematic eye - unaccommodated',
    citation: 'Slides 1-63: vergence, schematic-eye models, emmetropia, myopia, hyperopia, far point and axial length',
  },
];
const sourceIds = sources.map((source) => source.id);

export const schematicEyeRefractiveStatesNotesV3 = compileAuthoredNotesV3({
  markdown: schematicEyeRefractiveStatesMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'vergence-paraxial': sourceIds,
    'schematic-models': sourceIds,
    'emmetropia': sourceIds,
    'myopia': sourceIds,
    'hyperopia': sourceIds,
    'far-point-axial': sourceIds,
  },
});
