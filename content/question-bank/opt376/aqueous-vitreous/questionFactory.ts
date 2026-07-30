import type { AssessmentQuestion, BloomLevel, Difficulty, SourceReference, StimulusType } from '@/lib/assessment/types';

type Meta = {
  id: string;
  familyId: string;
  sectionId: string;
  objectiveId: string;
  stimulusType: StimulusType;
  bloomLevel: BloomLevel;
  difficulty: Difficulty;
  stem: string;
  explanation: string;
  sources: SourceReference[];
  misconceptionTags?: string[];
  table?: AssessmentQuestion['table'];
};

type Entry = [id: string, text: string, rationale: string, misconceptionTag?: string];

const base = (meta: Meta) => ({
  schemaVersion: 1 as const,
  ...meta,
  courseId: 'neuro-anatomy',
  moduleId: 'aqueous-vitreous',
  noteAnchor: meta.sectionId,
  misconceptionTags: meta.misconceptionTags ?? [],
  author: 'Optometry Study Hub candidate-bank team',
  reviewStatus: 'draft' as const,
  version: 1,
});

const entries = (values: Entry[]) => values.map(([id, text, rationale, misconceptionTag]) => ({ id, text, rationale, ...(misconceptionTag ? { misconceptionTag } : {}) }));

export const sba = (meta: Meta, values: Entry[], correctOptionId: string): AssessmentQuestion => ({ ...base(meta), format: 'single_best_answer', options: entries(values), correctOptionId });
export const trueFalse = (meta: Meta, correctAnswer: boolean): AssessmentQuestion => ({ ...base(meta), format: 'true_false', correctAnswer });
export const mr = (meta: Meta, values: Entry[], correctOptionIds: string[]): AssessmentQuestion => ({ ...base(meta), format: 'multiple_response', options: entries(values), correctOptionIds, minimumSelections: correctOptionIds.length, maximumSelections: correctOptionIds.length });
export const ordering = (meta: Meta, values: Entry[], correctOrder: string[]): AssessmentQuestion => ({ ...base(meta), format: 'ordering', items: entries(values), correctOrder });
export const matching = (meta: Meta, prompts: [string, string][], choices: Entry[], correctMatches: Record<string, string>): AssessmentQuestion => ({ ...base(meta), format: 'matching', prompts: prompts.map(([id, text]) => ({ id, text })), choices: entries(choices), correctMatches });
export const extended = (meta: Meta, stems: [string, string][], options: Entry[], correctAnswers: Record<string, string>, reuseOptions?: boolean): AssessmentQuestion => ({ ...base(meta), format: 'extended_matching', stems: stems.map(([id, text]) => ({ id, text })), options: entries(options), correctAnswers, ...(reuseOptions === undefined ? {} : { reuseOptions }) });
export const hotspot = (meta: Meta, image: { src: string; alt: string; width: number; height: number }, regions: { id: string; label: string; interactionLabel: string; marker: string; x: number; y: number; width: number; height: number }[], correctRegionIds: string[]): AssessmentQuestion => ({ ...base(meta), format: 'image_hotspot', image, regions, correctRegionIds });
export const label = (meta: Meta, image: { src: string; alt: string; width: number; height: number }, targets: { id: string; label: string; x: number; y: number }[], labels: Entry[], correctLabels: Record<string, string>): AssessmentQuestion => ({ ...base(meta), format: 'image_label', image, targets, labels: entries(labels), correctLabels });
export const short = (meta: Meta, acceptedAnswers: string[]): AssessmentQuestion => ({ ...base(meta), format: 'short_answer', acceptedAnswers, normalization: { trim: true, caseInsensitive: true, collapseWhitespace: true, ignoreTerminalPunctuation: true } });
export const open = (meta: Meta, sampleAnswer: string, rubric: string[]): AssessmentQuestion => ({ ...base(meta), format: 'open_response', sampleAnswer, rubric, autoGraded: false });
