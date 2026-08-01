import environmentalMarkdown from '@/content/notes-v3/sources/environmental-vision.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('environmental-vision');
if (!studyModule) throw new Error('Environmental Vision module is not registered.');

const sources: StudySource[] = [
  { id: 'env-optics-deck', title: 'Environmental Vision: Physical Optics', citation: 'Supplied ENVIRONMENTAL VISION_Physical Optics.pptx.' },
  { id: 'env-task-deck', title: 'Visual Task Analysis', citation: 'Supplied OPT 508 Visual Task Analysis lecture deck.' },
  { id: 'env-ergonomics-deck', title: 'Visual Ergonomics', citation: 'Supplied OPT 508 Visual Ergonomics lecture deck.' },
  { id: 'env-hazards-deck', title: 'Eye Hazards', citation: 'Supplied OPT 504/508 Eye Hazards lecture deck.' },
  { id: 'env-protection-deck', title: 'Eye and Face Protection', citation: 'Supplied Eye and Face Protection and PPE Requirements lecture decks.' },
  { id: 'env-lighting-deck', title: 'Lighting at the Workplace', citation: 'Supplied OPT 508 Lighting at the Workplace lecture deck.' },
];

export const environmentalVisionNotesV3 = compileAuthoredNotesV3({
  markdown: environmentalMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'env-optics': ['env-optics-deck'],
    'env-task': ['env-task-deck'],
    'env-ergonomics': ['env-ergonomics-deck'],
    'env-hazards': ['env-hazards-deck'],
    'env-protection': ['env-protection-deck'],
    'env-lighting': ['env-lighting-deck'],
  },
});
