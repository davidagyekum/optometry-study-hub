import humanVisualPerceptionMarkdown from '@/content/notes-v3/sources/human-visual-perception.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('human-visual-perception');
if (!studyModule) throw new Error('Human Visual Perception module is not registered.');

const sources: StudySource[] = [
  {
    id: 'hvp-intro-2025',
    title: 'Introduction and outline',
    citation: 'Supplied OPT 374 Human Visual Perception teaching presentation, 2025/2026.',
  },
  {
    id: 'hvp-retina-2025',
    title: 'Components of the visual system: Retina',
    citation: 'Supplied OPT 374 retina teaching presentation, 2025/2026.',
  },
  {
    id: 'hvp-lgn-v1-2025',
    title: 'Components of the visual system: LGN and visual cortex',
    citation: 'Supplied OPT 374 LGN and visual-cortex teaching presentation, 2025/2026.',
  },
  {
    id: 'hvp-extrastriate-2025',
    title: 'Components of the visual system: Extrastriate visual areas',
    citation: 'Supplied OPT 374 extrastriate visual-areas teaching presentation, 2025/2026.',
  },
  {
    id: 'hvp-content-audit',
    title: 'OPT 374 content audit and blueprint',
    citation: 'Repository content audit and blueprint used to preserve course scope and qualification boundaries; no assessment-bank data imported.',
  },
];

export const humanVisualPerceptionNotesV3 = compileAuthoredNotesV3({
  markdown: humanVisualPerceptionMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'hvp-foundations': ['hvp-intro-2025', 'hvp-content-audit'],
    'hvp-retina': ['hvp-retina-2025', 'hvp-content-audit'],
    'hvp-lgn': ['hvp-lgn-v1-2025', 'hvp-content-audit'],
    'hvp-extrastriate': ['hvp-extrastriate-2025', 'hvp-content-audit'],
  },
});
