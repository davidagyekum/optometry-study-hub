import depthPerceptionMarkdown from '@/content/notes-v3/sources/hvp-depth-perception.md?raw';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { StudySource } from '@/content/notes-v2/types';

const studyModule = moduleMap.get('hvp-depth-perception');
if (!studyModule) throw new Error('Depth Perception module is not registered.');

const sources: StudySource[] = [{
  id: 'hvp-depth-perception-lecture',
  title: '4. Depth Perception',
  citation:
    'Supplied 77-slide Depth Perception teaching presentation; course-code ambiguity is preserved in the source log.',
}];
const sourceIds = sources.map((source) => source.id);

export const hvpDepthPerceptionNotesV3 = compileAuthoredNotesV3({
  markdown: depthPerceptionMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: Object.fromEntries(
    studyModule.sections.map((section) => [section.id, sourceIds]),
  ),
});
