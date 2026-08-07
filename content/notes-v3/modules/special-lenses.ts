import specialLensesMarkdown from '@/content/notes-v3/sources/special-lenses.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('special-lenses');
if (!studyModule) throw new Error('Special Ophthalmic Lenses module is not registered.');

const sources: StudySource[] = [
  {
    id: 'opt370-special-lenses',
    title: 'Special lenses',
    citation: 'Slides 1-140: lenticular, iseikonic, safety/filter, Fresnel prism and slab-off lenses',
  },
];
const sourceIds = sources.map((source) => source.id);

export const specialLensesNotesV3 = compileAuthoredNotesV3({
  markdown: specialLensesMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'lenticular-aspheric': sourceIds,
    'aniseikonia': sourceIds,
    'spectacle-magnification': sourceIds,
    'safety-filters': sourceIds,
    'fresnel-prism': sourceIds,
    'slab-off': sourceIds,
  },
});
