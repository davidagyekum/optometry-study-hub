import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);

const richNodeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: nonEmpty }).strict(),
  z.object({ type: z.literal('subheading'), level: z.union([z.literal(3), z.literal(4)]), text: nonEmpty }).strict(),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(nonEmpty).min(1) }).strict(),
  z.object({ type: z.literal('table'), columns: z.array(nonEmpty).min(2), rows: z.array(z.array(nonEmpty).min(2)).min(1) }).strict(),
  z.object({ type: z.literal('sequence'), lines: z.array(nonEmpty).min(1) }).strict(),
]);

const titledNodes = {
  title: nonEmpty,
  nodes: z.array(richNodeSchema).min(1),
};

export const studyBlockV3Schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('focus-map'),
    groups: z.array(z.object({
      priority: z.enum(['must', 'should', 'useful']),
      label: nonEmpty,
      items: z.array(nonEmpty).min(1),
    }).strict()).length(3),
  }).strict(),
  z.object({ type: z.literal('rich-explanation'), ...titledNodes }).strict(),
  z.object({ type: z.literal('cause-effect-chain'), title: nonEmpty, steps: z.array(nonEmpty).min(2) }).strict(),
  z.object({ type: z.literal('memory-hook'), ...titledNodes }).strict(),
  z.object({ type: z.literal('exam-trap'), ...titledNodes }).strict(),
  z.object({ type: z.literal('worked-example'), ...titledNodes }).strict(),
  z.object({
    type: z.literal('active-recall'),
    title: nonEmpty,
    questions: z.array(nonEmpty).min(1),
    answers: z.array(nonEmpty).min(1),
  }).strict().refine((value) => value.questions.length === value.answers.length, {
    message: 'Active-recall questions and answers must have equal length.',
  }),
  z.object({ type: z.literal('one-minute-summary'), items: z.array(nonEmpty).min(1) }).strict(),
  z.object({
    type: z.literal('definition-list'),
    entries: z.array(z.object({ term: nonEmpty, definition: nonEmpty }).strict()).min(1),
  }).strict(),
]);

const figureSchema = z.object({
  src: nonEmpty,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: nonEmpty,
  caption: nonEmpty,
  credit: nonEmpty,
  sourceUrl: z.string().url().optional(),
}).strict();

export const studyModuleContentV3Schema = z.object({
  schemaVersion: z.literal(3),
  moduleId: nonEmpty,
  courseId: nonEmpty,
  title: nonEmpty,
  description: nonEmpty,
  learningObjectives: z.array(nonEmpty).min(1),
  sections: z.array(z.object({
    id: nonEmpty,
    title: nonEmpty,
    overview: nonEmpty,
    blocks: z.array(studyBlockV3Schema).min(1),
    figure: figureSchema.optional(),
    sourceIds: z.array(nonEmpty).min(1),
  }).strict()).min(1),
  sources: z.array(z.object({
    id: nonEmpty,
    title: nonEmpty,
    citation: nonEmpty,
    url: z.string().url().optional(),
  }).strict()).min(1),
}).strict().superRefine((content, context) => {
  const sourceIds = new Set(content.sources.map((source) => source.id));
  const sectionIds = new Set<string>();
  for (const section of content.sections) {
    if (sectionIds.has(section.id)) {
      context.addIssue({ code: 'custom', path: ['sections'], message: `Duplicate section ID: ${section.id}` });
    }
    sectionIds.add(section.id);
    for (const sourceId of section.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        context.addIssue({ code: 'custom', path: ['sections', section.id, 'sourceIds'], message: `Unknown source ID: ${sourceId}` });
      }
    }
  }
});
