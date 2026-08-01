import type { Figure } from '@/lib/legacy/types';
import type { StudyModuleContentV2, StudySectionV2, StudySource } from '@/content/notes-v2/types';

export type NotesPriority = 'must' | 'should' | 'useful';

export type RichNoteNode =
  | { type: 'paragraph'; text: string }
  | { type: 'subheading'; level: 3 | 4; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'sequence'; lines: string[] };

export type StudyBlockV3 =
  | {
      type: 'focus-map';
      groups: Array<{ priority: NotesPriority; label: string; items: string[] }>;
    }
  | { type: 'rich-explanation'; title: string; nodes: RichNoteNode[] }
  | { type: 'cause-effect-chain'; title: string; steps: string[] }
  | { type: 'memory-hook'; title: string; nodes: RichNoteNode[] }
  | { type: 'exam-trap'; title: string; nodes: RichNoteNode[] }
  | { type: 'worked-example'; title: string; nodes: RichNoteNode[] }
  | { type: 'active-recall'; title: string; questions: string[]; answers: string[] }
  | { type: 'one-minute-summary'; items: string[] }
  | { type: 'definition-list'; entries: Array<{ term: string; definition: string }> };

export type StudySectionV3 = {
  id: string;
  title: string;
  overview: string;
  blocks: StudyBlockV3[];
  figure?: Figure;
  sourceIds: string[];
};

export type StudyModuleContentV3 = {
  schemaVersion: 3;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  learningObjectives: string[];
  sections: StudySectionV3[];
  legacySupplementalSections?: StudySectionV2[];
  sources: StudySource[];
};

export type NotesResolution =
  | { kind: 'v3'; content: StudyModuleContentV3 }
  | { kind: 'v2'; content: StudyModuleContentV2; reason?: string }
  | { kind: 'legacy'; reason: string };
