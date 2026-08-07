import multifocalFoundationsMarkdown from '@/content/notes-v3/sources/multifocal-foundations.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('multifocal-foundations');
if (!studyModule) throw new Error('Presbyopia, Bifocals and Trifocals module is not registered.');

const sources: StudySource[] = [
  {
    id: 'opt370-multifocals-2021',
    title: 'OPT 370 Multifocals 2021',
    citation: 'Slides 1-133: presbyopia, bifocal construction and optics, fitting, trifocals and PAL introduction',
  },
  {
    id: 'opt370-bifocal-lenses-1',
    title: 'Bifocal lenses 1',
    citation: 'Slides 1-36: bifocal types, segment shapes, fitting and marking',
  },
  {
    id: 'opt370-bifocal-lenses-2',
    title: 'Bifocal lenses 2',
    citation: 'Slides 1-50: segment terminology, designs, construction, test items and measurement',
  },
];
const sourceIds = sources.map((source) => source.id);

export const multifocalFoundationsNotesV3 = compileAuthoredNotesV3({
  markdown: multifocalFoundationsMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'presbyopia-add': sourceIds,
    'construction-types': sourceIds,
    'segment-designs': sourceIds,
    'nvp-prism': sourceIds,
    'jump-tca': sourceIds,
    'bifocal-fitting': sourceIds,
    'trifocals': sourceIds,
  },
});
