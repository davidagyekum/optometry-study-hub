import progressiveAdditionLensesMarkdown from '@/content/notes-v3/sources/progressive-addition-lenses.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('progressive-addition-lenses');
if (!studyModule) throw new Error('Progressive Addition Lenses module is not registered.');

const sources: StudySource[] = [
  {
    id: 'opt370-multifocals-2021',
    title: 'OPT 370 Multifocals 2021',
    citation: 'Slides 1-133: presbyopia, bifocal construction and optics, fitting, trifocals and PAL introduction',
  },
  {
    id: 'opt370-progressive-lens-fitting',
    title: 'Progressive lens fitting',
    citation: 'Slides 1-53: PAL selection, frame adjustment, measurements, delivery and troubleshooting',
  },
  {
    id: 'opt370-progressive-fitting-cross',
    title: 'Progressive fitting cross',
    citation: 'Pages 1-2: progressive reference points and influence of cylinder on peripheral distortion',
  },
];
const sourceIds = sources.map((source) => source.id);

export const progressiveAdditionLensesNotesV3 = compileAuthoredNotesV3({
  markdown: progressiveAdditionLensesMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'pal-principles': sourceIds,
    'pal-designs': sourceIds,
    'reference-markings': sourceIds,
    'patient-frame': sourceIds,
    'measure-order': sourceIds,
    'verification-delivery': sourceIds,
    'pal-troubleshooting': sourceIds,
  },
});
