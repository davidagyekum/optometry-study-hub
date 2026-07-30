import { modules } from '@/content/legacy/moduleCatalog';
import { studyModuleContentV2Schema } from '@/content/notes-v2/schema';
import type {
  NotesV2Resolution,
  StudyBlock,
  StudyModuleContentV2,
  StudySectionV2,
} from '@/content/notes-v2/types';
import type { Module, Section } from '@/lib/legacy/types';

const PROCESS_SECTIONS = new Set([
  'hvp-retina',
  'hvp-lgn',
  'env-task',
  'env-protection',
  'tissue-nervous',
  'tears',
  'production',
  'flow',
  'retinal',
  'microcirculation',
  'pharm-adrenergic',
  'pharm-cholinergic',
  'path-cardio',
  'path-endocrine',
  'path-renal',
]);

const MECHANISM_SECTIONS = new Set([
  'hvp-retina',
  'hvp-lgn',
  'production',
  'flow',
  'barriers',
  'pharm-adrenergic',
  'pharm-cholinergic',
  'path-cardio',
  'path-endocrine',
  'path-renal',
]);

const MISCONCEPTIONS: Record<string, { claim: string; correction: string }> = {
  'hvp-foundations': {
    claim: 'Perception is a passive copy of the retinal image.',
    correction: 'Perception actively selects, organises and interprets sensory signals using context and prior knowledge.',
  },
  'env-protection': {
    claim: 'The protector with the greatest coverage is automatically the correct choice.',
    correction: 'Protection must match the identified impact, splash, dust, heat or radiation hazard and complement higher-level controls.',
  },
  'tissue-nervous': {
    claim: 'Central and peripheral axons regenerate in the same way.',
    correction: 'Peripheral nerves have substantially greater regenerative support; central repair is limited by the injury environment and glial response.',
  },
  tears: {
    claim: 'Normal lacrimal secretion is primarily sympathetic.',
    correction: 'Parasympathetic secretomotor control carried from CN VII is the dominant driver of normal lacrimal secretion.',
  },
  iop: {
    claim: 'An elevated intraocular-pressure reading by itself defines glaucoma.',
    correction: 'Glaucoma is an optic neuropathy; pressure is an important risk factor and treatment target, not the sole definition.',
  },
  retinal: {
    claim: 'The central retinal artery supplies every retinal layer.',
    correction: 'Retinal vessels mainly support the inner retina, while the outer retina and photoreceptors depend largely on choroidal diffusion.',
  },
  'pharm-adrenergic': {
    claim: 'Phenylephrine produces cycloplegia because it dilates the pupil.',
    correction: 'Alpha-1 stimulation contracts the iris dilator and causes mydriasis without paralysing the ciliary muscle.',
  },
  'path-renal': {
    claim: 'Nephritic and nephrotic syndromes describe the same glomerular pattern.',
    correction: 'Nephritic disease is inflammatory and haematuric; nephrotic disease is dominated by heavy protein loss and its systemic consequences.',
  },
};

const WARNINGS: Record<string, { title: string; text: string }> = {
  'env-protection': {
    title: 'Safety priority',
    text: 'Personal protective equipment is the final layer of control. Eliminate, substitute or engineer out the hazard whenever feasible.',
  },
  iop: {
    title: 'Urgent clinical pattern',
    text: 'A painful red eye with reduced vision, corneal haze, headache or nausea requires urgent assessment for acute angle closure.',
  },
  'pharm-adrenergic': {
    title: 'Prescribing caution',
    text: 'Check cardiovascular disease, interacting medicines and concentration before using a topical sympathomimetic.',
  },
  'path-endocrine': {
    title: 'Urgent metabolic pattern',
    text: 'Altered consciousness, dehydration or rapid breathing in diabetes may signal acute metabolic decompensation and needs urgent care.',
  },
};

const MEMORY_AIDS: Record<string, { title: string; text: string }> = {
  'hvp-lgn': {
    title: 'Pathway cue',
    text: 'Retina to LGN to primary visual cortex: keep eye-of-origin and visual-field representation distinct.',
  },
  flow: {
    title: 'Flow cue',
    text: 'Posterior chamber, pupil, anterior chamber, then conventional or uveoscleral outflow.',
  },
  retinal: {
    title: 'Supply cue',
    text: 'Central retinal circulation supports inner retina; choroidal circulation supports outer retina.',
  },
  'path-cardio': {
    title: 'Mechanism cue',
    text: 'Vessel injury, perfusion failure and embolic spread connect systemic cardiovascular disease to ocular signs.',
  },
};
const RELATIONSHIPS: Record<string, { title: string; expression: string; note: string }> = {
  'env-lighting': {
    title: 'Illuminance relationship',
    expression: '1 lux = 1 lumen per square metre',
    note: 'Required task illuminance rises as critical detail becomes smaller or contrast falls.',
  },
  iop: {
    title: 'Pressure relationship',
    expression: 'IOP depends on aqueous production, outflow resistance and episcleral venous pressure',
    note: 'A change in any determinant can alter the measured pressure.',
  },
  'path-renal': {
    title: 'Syndrome relationship',
    expression: 'Glomerular injury pattern → urine findings → systemic consequences',
    note: 'Use haematuria, protein loss, filtration and blood pressure together to classify the syndrome.',
  },
};

function splitTerm(value: string): { term: string; definition: string } {
  const separator = [' — ', ' – ', ' - '].find((item) => value.includes(item));
  if (!separator) return { term: value, definition: 'See the section explanation.' };
  const [term, ...rest] = value.split(separator);
  return { term: term.trim(), definition: rest.join(separator).trim() };
}

function sourceId(module: Module): string {
  return `${module.id}-lecture-source`;
}

function sectionToV2(module: Module, section: Section): StudySectionV2 {
  const terms = section.terms.map(splitTerm);
  const blocks: StudyBlock[] = [
    { type: 'paragraph', text: section.summary },
    PROCESS_SECTIONS.has(section.id)
      ? {
          type: MECHANISM_SECTIONS.has(section.id) ? 'mechanism' : 'ordered-process',
          title: MECHANISM_SECTIONS.has(section.id) ? 'Mechanism and sequence' : 'Study sequence',
          steps: section.bullets,
        }
      : { type: 'key-points', title: 'Core concepts', items: section.bullets },
    {
      type: 'comparison-table',
      title: 'Terms to distinguish',
      columns: ['Concept', 'Meaning'],
      rows: terms.map((entry) => [entry.term, entry.definition]),
    },
    { type: 'clinical-vignette', title: 'Clinical application', text: section.clinical },
    {
      type: 'source-note',
      text: module.sourceNote ?? `Structured from the ${module.title} teaching material.`,
      sourceIds: [sourceId(module)],
    },
  ];
  const relationship = RELATIONSHIPS[section.id];
  if (relationship) {
    blocks.splice(3, 0, { type: 'formula-or-relationship', ...relationship });
  }
  const warning = WARNINGS[section.id];
  if (warning) {
    blocks.splice(-1, 0, { type: 'warning', ...warning });
  }
  const memoryAid = MEMORY_AIDS[section.id];
  if (memoryAid) {
    blocks.splice(-1, 0, { type: 'callout', ...memoryAid });
  }
  return {
    id: section.id,
    title: section.title,
    overview: section.summary,
    learningOutcomes: [
      `Explain the principal concepts and relationships in ${section.title}.`,
      `Apply ${section.title.toLowerCase()} to a relevant clinical or practical scenario.`,
    ],
    blocks,
    keyTerms: terms,
    clinicalPearls: [section.clinical],
    misconceptions: MISCONCEPTIONS[section.id]
      ? [MISCONCEPTIONS[section.id]]
      : undefined,
    figure: section.image,
    sourceIds: [sourceId(module)],
  };
}

const SYSTEMIC_ENDOCRINE_SECTION: Section = {
  id: 'path-endocrine',
  title: 'Endocrine pathology',
  summary:
    'Endocrine disease reflects hormone excess, deficiency, target-organ resistance or mass effects. Feedback loops help localise primary and secondary disorders.',
  bullets: [
    'Pituitary, thyroid, parathyroid, adrenal and pancreatic disease should be interpreted through the relevant feedback axis.',
    'Graves disease causes stimulatory TSH-receptor autoantibodies, while Hashimoto thyroiditis is dominated by destructive autoimmunity.',
    'Diabetes mellitus produces acute metabolic disturbance and chronic microvascular and macrovascular complications.',
  ],
  terms: [
    'Feedback axis — linked hypothalamic, pituitary and target-gland regulation',
    'Primary endocrine disorder — abnormality originating in the target endocrine gland',
    'Hormone resistance — reduced target-tissue response despite hormone availability',
  ],
  clinical:
    'Interpret the hormone and trophic-hormone pattern together; a single abnormal value may not localise the affected level.',
  image: {
    src: '/images/courses/systemic-pathology/assessment/endocrine-axis.svg',
    width: 1200,
    height: 800,
    alt: 'Answer-neutral diagram of an endocrine feedback axis linking the hypothalamus, pituitary and target gland.',
    caption: 'Endocrine feedback axes help localise hormone excess and deficiency.',
    credit: 'Optometry Study Hub original assessment-neutral diagram',
  },
};

export function legacyModuleToNotesV2(module: Module): StudyModuleContentV2 {
  const legacySupplemental = module.id === 'systemic-pathology'
    ? module.sections.filter((section) => (
        section.id === 'path-lymph' || section.id === 'path-respiratory'
      ))
    : [];
  const primarySections = module.id === 'systemic-pathology'
    ? ['path-breast', 'path-cardio', 'path-endocrine', 'path-gi', 'path-renal']
        .map((sectionId) => (
          sectionId === SYSTEMIC_ENDOCRINE_SECTION.id
            ? SYSTEMIC_ENDOCRINE_SECTION
            : module.sections.find((section) => section.id === sectionId)
        ))
        .filter((section): section is Section => section !== undefined)
    : module.sections;
  return {
    schemaVersion: 2,
    moduleId: module.id,
    courseId: module.courseId,
    title: module.title,
    description: module.description,
    learningObjectives: module.objectives,
    sections: primarySections.map((section) => sectionToV2(module, section)),
    sources: [{
      id: sourceId(module),
      title: `${module.title} teaching sources`,
      citation: module.sourceNote ?? `Structured from the supplied ${module.title} teaching material.`,
    }],
    legacySupplementalSections: legacySupplemental.length > 0
      ? legacySupplemental.map((section) => sectionToV2(module, section))
      : undefined,
  };
}

export const notesV2Catalog = new Map<string, StudyModuleContentV2>(
  modules.map((module) => [module.id, legacyModuleToNotesV2(module)]),
);

export function resolveNotesV2(
  module: Module,
  candidate: unknown = notesV2Catalog.get(module.id),
): NotesV2Resolution {
  const parsed = studyModuleContentV2Schema.safeParse(candidate);
  if (!parsed.success) {
    return {
      kind: 'legacy',
      reason: 'Structured notes could not be validated. The original notes remain available.',
    };
  }
  if (parsed.data.moduleId !== module.id || parsed.data.courseId !== module.courseId) {
    return {
      kind: 'legacy',
      reason: 'Structured notes do not match this module. The original notes remain available.',
    };
  }
  return { kind: 'v2', content: parsed.data };
}

export function notesV2SectionIds(content: StudyModuleContentV2): string[] {
  return [
    ...content.sections,
    ...(content.legacySupplementalSections ?? []),
  ].map((section) => section.id);
}

export function notesV2ReadingPercentage(
  content: StudyModuleContentV2,
  read: readonly string[],
): number {
  const ids = notesV2SectionIds(content);
  const completed = ids.filter((id) => read.includes(id)).length;
  return ids.length === 0 ? 0 : Math.round((completed / ids.length) * 100);
}
