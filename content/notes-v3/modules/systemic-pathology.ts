import systemicPathologyMarkdown from '@/content/notes-v3/sources/systemic-pathology.md?raw';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { resolveNotesV2 } from '@/content/notes-v2/catalog';
import type { StudySectionV2, StudySource } from '@/content/notes-v2/types';
import { compileAuthoredNotesV3 } from '@/content/notes-v3/compiler';
import type { StudyModuleContentV3 } from '@/content/notes-v3/types';

const studyModule = moduleMap.get('systemic-pathology');
if (!studyModule) throw new Error('Systemic Pathology module is not registered.');

const notesV2 = resolveNotesV2(studyModule);
if (notesV2.kind !== 'v2') throw new Error('Systemic Pathology Notes V2 could not be resolved.');

const supplementalIds = ['path-lymph', 'path-respiratory'] as const;
const legacySupplementalSections = supplementalIds.map((sectionId) => {
  const section = notesV2.content.legacySupplementalSections?.find((candidate) => candidate.id === sectionId);
  if (!section) throw new Error(`Systemic Pathology supplemental section is missing: ${sectionId}`);
  return section;
}) satisfies StudySectionV2[];

const legacySource = notesV2.content.sources.find((source) => source.id === 'systemic-pathology-lecture-source');
if (!legacySource) throw new Error('Systemic Pathology supplemental source is missing.');

const sources: StudySource[] = [
  {
    id: 'systemic-breast-lecture',
    title: 'Breast Pathology',
    citation: 'Supplied Breast Pathology teaching presentation.',
  },
  {
    id: 'systemic-cardio-lecture',
    title: 'Cardiovascular Pathology',
    citation: 'Supplied Cardiovascular Pathology teaching presentation.',
  },
  {
    id: 'systemic-endocrine-source-package',
    title: 'Systemic Pathology endocrine source package',
    citation: 'The direct Endocrine Pathology deck was unavailable in Batch 4. This section is limited to the topics and slide locators documented by the reviewed Systemic Pathology source package.',
  },
  {
    id: 'systemic-gi-lecture',
    title: 'Gastrointestinal Pathology',
    citation: 'Supplied Gastrointestinal Pathology teaching presentation.',
  },
  {
    id: 'systemic-renal-lecture',
    title: 'Renal Pathology',
    citation: 'Supplied Renal Pathology teaching presentation.',
  },
  legacySource,
];

const compiled = compileAuthoredNotesV3({
  markdown: systemicPathologyMarkdown,
  module: studyModule,
  sources,
  sectionSourceIds: {
    'path-breast': ['systemic-breast-lecture'],
    'path-cardio': ['systemic-cardio-lecture'],
    'path-endocrine': ['systemic-endocrine-source-package'],
    'path-gi': ['systemic-gi-lecture'],
    'path-renal': ['systemic-renal-lecture'],
  },
});

const endocrineFigure = notesV2.content.sections.find((section) => section.id === 'path-endocrine')?.figure;
if (!endocrineFigure) throw new Error('Systemic Pathology endocrine figure is missing.');

export const systemicPathologyNotesV3: StudyModuleContentV3 = {
  ...compiled,
  learningObjectives: [
    'Relate normal organ structure to the mechanisms, morphology and presentation of disease in breast, cardiovascular, endocrine, gastrointestinal and renal systems.',
    'Distinguish inflammatory, vascular, obstructive, metabolic and neoplastic patterns using clinical and morphologic evidence.',
    'Use structure-function reasoning to localise disease and predict major complications without treating one sign as a complete diagnosis.',
  ],
  sections: compiled.sections.map((section) => (
    section.id === 'path-endocrine' ? { ...section, figure: endocrineFigure } : section
  )),
  legacySupplementalSections,
};
