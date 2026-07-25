export type Figure = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl?: string;
};

export type CoverImage = {
  src: string;
  width: number;
  height: number;
};

export type Section = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  terms: string[];
  clinical: string;
  image: Figure;
};

export type Fact = {
  q: string;
  a: string;
  section: string;
  group?: string;
};

export type Module = {
  id: string;
  courseId: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  tone: string;
  lecturer?: string;
  sourceNote?: string;
  coverImage: CoverImage;
  objectives: string[];
  sections: Section[];
  facts: Fact[];
};

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct: string;
  explanation: string;
  sectionId: string;
};

export type Attempt = {
  id: string;
  moduleId: string;
  startedAt: string;
  order: string[];
  optionOrder: Record<string, string[]>;
  answers: Record<string, string>;
  flags: string[];
  current: number;
};

export type Result = Attempt & {
  submittedAt: string;
  score: number;
  total: number;
};

export type Store = {
  version: 1;
  read: Record<string, string[]>;
  active: Record<string, Attempt | undefined>;
  results: Record<string, Result[]>;
};

export type CourseSummary = {
  id: string;
  code: string;
  title: string;
  description: string;
  lecturers: string[];
  moduleIds: string[];
  tone: string;
  coverImage: CoverImage;
};
