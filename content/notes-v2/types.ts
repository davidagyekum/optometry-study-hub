import type { Figure } from '@/lib/legacy/types';

export type StudySource = {
  id: string;
  title: string;
  citation: string;
  url?: string;
};

export type StudyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'key-points'; title: string; items: string[] }
  | { type: 'ordered-process'; title: string; steps: string[] }
  | { type: 'mechanism'; title: string; steps: string[] }
  | {
      type: 'comparison-table';
      title: string;
      columns: string[];
      rows: string[][];
    }
  | { type: 'clinical-vignette'; title: string; text: string }
  | { type: 'warning'; title: string; text: string }
  | { type: 'formula-or-relationship'; title: string; expression: string; note: string }
  | { type: 'figure'; figure: Figure }
  | { type: 'callout'; title: string; text: string }
  | { type: 'glossary'; entries: Array<{ term: string; definition: string }> }
  | { type: 'source-note'; text: string; sourceIds: string[] };

export type StudySectionV2 = {
  id: string;
  title: string;
  overview: string;
  learningOutcomes?: string[];
  blocks: StudyBlock[];
  keyTerms?: Array<{ term: string; definition: string }>;
  clinicalPearls?: string[];
  misconceptions?: Array<{ claim: string; correction: string }>;
  figure?: Figure;
  sourceIds: string[];
};

export type StudyModuleContentV2 = {
  schemaVersion: 2;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  learningObjectives: string[];
  sections: StudySectionV2[];
  sources: StudySource[];
  legacySupplementalSections?: StudySectionV2[];
};

export type NotesV2Resolution =
  | { kind: 'v2'; content: StudyModuleContentV2 }
  | { kind: 'legacy'; reason: string };
