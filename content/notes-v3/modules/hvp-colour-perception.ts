import colourPerceptionMarkdown from '@/content/notes-v3/sources/hvp-colour-perception.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('hvp-colour-perception');
if (!studyModule) throw new Error('Colour Perception module is not registered.');

const sources: StudySource[] = [{
  id: 'hvp-colour-perception-lecture',
  title: '5.1- Colour Perception',
  citation:
    'Supplied 44-slide Colour Perception teaching presentation; course-code ambiguity is preserved in the source log.',
}];
const sourceIds = sources.map((source) => source.id);

export const hvpColourPerceptionNotesV3 = compileAuthoredNotesV3({
  markdown: colourPerceptionMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: Object.fromEntries(
    studyModule.sections.map((section) => [section.id, sourceIds]),
  ),
});
