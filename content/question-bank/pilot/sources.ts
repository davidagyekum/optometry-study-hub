import type { SourceReference } from '@/lib/assessment/types';

export const aqueousLectureSource: SourceReference = {
  id: 'opt376-aqueous-vitreous-lecture',
  title: 'OPT 376 Aqueous Humour and Vitreous Body lecture deck',
  locator: 'Aqueous flow, intraocular pressure, and vitreous sections',
  kind: 'lecture',
};

export const openStaxVisionSource: SourceReference = {
  id: 'openstax-biology-2e-vision',
  title: 'OpenStax Biology 2e: Vision',
  locator: 'Section 36.5, anatomy of the eye',
  url: 'https://openstax.org/books/biology-2e/pages/36-5-vision',
  kind: 'textbook',
};

export const pilotSources: SourceReference[] = [
  aqueousLectureSource,
  openStaxVisionSource,
];
