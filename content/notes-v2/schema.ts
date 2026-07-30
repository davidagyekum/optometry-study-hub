import { z } from 'zod';

const nonemptyString = z.string().trim().min(1);

export const figureSchema = z.strictObject({
  src: z.string().startsWith('/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: nonemptyString,
  caption: nonemptyString,
  credit: nonemptyString,
  sourceUrl: z.url().optional(),
});

const studyBlockSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('paragraph'), text: nonemptyString }),
  z.strictObject({
    type: z.literal('key-points'),
    title: nonemptyString,
    items: z.array(nonemptyString).min(1),
  }),
  z.strictObject({
    type: z.literal('ordered-process'),
    title: nonemptyString,
    steps: z.array(nonemptyString).min(2),
  }),
  z.strictObject({
    type: z.literal('mechanism'),
    title: nonemptyString,
    steps: z.array(nonemptyString).min(2),
  }),
  z.strictObject({
    type: z.literal('comparison-table'),
    title: nonemptyString,
    columns: z.array(nonemptyString).min(2),
    rows: z.array(z.array(nonemptyString).min(2)).min(1),
  }),
  z.strictObject({
    type: z.literal('clinical-vignette'),
    title: nonemptyString,
    text: nonemptyString,
  }),
  z.strictObject({
    type: z.literal('warning'),
    title: nonemptyString,
    text: nonemptyString,
  }),
  z.strictObject({
    type: z.literal('formula-or-relationship'),
    title: nonemptyString,
    expression: nonemptyString,
    note: nonemptyString,
  }),
  z.strictObject({ type: z.literal('figure'), figure: figureSchema }),
  z.strictObject({
    type: z.literal('callout'),
    title: nonemptyString,
    text: nonemptyString,
  }),
  z.strictObject({
    type: z.literal('glossary'),
    entries: z.array(z.strictObject({
      term: nonemptyString,
      definition: nonemptyString,
    })).min(1),
  }),
  z.strictObject({
    type: z.literal('source-note'),
    text: nonemptyString,
    sourceIds: z.array(nonemptyString).min(1),
  }),
]);

export const studySectionV2Schema = z.strictObject({
  id: nonemptyString,
  title: nonemptyString,
  overview: nonemptyString,
  learningOutcomes: z.array(nonemptyString).min(1).optional(),
  blocks: z.array(studyBlockSchema).min(1),
  keyTerms: z.array(z.strictObject({
    term: nonemptyString,
    definition: nonemptyString,
  })).min(1).optional(),
  clinicalPearls: z.array(nonemptyString).min(1).optional(),
  misconceptions: z.array(z.strictObject({
    claim: nonemptyString,
    correction: nonemptyString,
  })).min(1).optional(),
  figure: figureSchema.optional(),
  sourceIds: z.array(nonemptyString).min(1),
});

export const studyModuleContentV2Schema = z.strictObject({
  schemaVersion: z.literal(2),
  moduleId: nonemptyString,
  courseId: nonemptyString,
  title: nonemptyString,
  description: nonemptyString,
  learningObjectives: z.array(nonemptyString).min(1),
  sections: z.array(studySectionV2Schema).min(1),
  sources: z.array(z.strictObject({
    id: nonemptyString,
    title: nonemptyString,
    citation: nonemptyString,
    url: z.url().optional(),
  })).min(1),
  legacySupplementalSections: z.array(studySectionV2Schema).min(1).optional(),
}).superRefine((module, context) => {
  const sections = [...module.sections, ...(module.legacySupplementalSections ?? [])];
  const sectionIds = new Set<string>();
  const sourceIds = new Set(module.sources.map((source) => source.id));

  for (const [sectionIndex, section] of sections.entries()) {
    if (sectionIds.has(section.id)) {
      context.addIssue({
        code: 'custom',
        path: ['sections', sectionIndex, 'id'],
        message: `Duplicate study-section ID: ${section.id}`,
      });
    }
    sectionIds.add(section.id);
    for (const sourceId of section.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        context.addIssue({
          code: 'custom',
          path: ['sections', sectionIndex, 'sourceIds'],
          message: `Unknown study source: ${sourceId}`,
        });
      }
    }
    for (const [blockIndex, block] of section.blocks.entries()) {
      if (block.type === 'source-note') {
        for (const sourceId of block.sourceIds) {
          if (!sourceIds.has(sourceId)) {
            context.addIssue({
              code: 'custom',
              path: ['sections', sectionIndex, 'blocks', blockIndex, 'sourceIds'],
              message: `Unknown study source: ${sourceId}`,
            });
          }
        }
      }
      if (block.type === 'comparison-table') {
        for (const [rowIndex, row] of block.rows.entries()) {
          if (row.length !== block.columns.length) {
            context.addIssue({
              code: 'custom',
              path: ['sections', sectionIndex, 'blocks', blockIndex, 'rows', rowIndex],
              message: 'Comparison-table rows must match the column count.',
            });
          }
        }
      }
    }
  }
});