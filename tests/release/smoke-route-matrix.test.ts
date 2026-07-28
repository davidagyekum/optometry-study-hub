import { describe, expect, it } from 'vitest';
import { parseClientRoute } from '@/lib/navigation/clientRoute';
import {
  RELEASE_CONTROLLED_ROUTES,
  RELEASE_PUBLIC_ROUTES,
} from '@/lib/release/manifest';

const concreteRoutes = [
  '/',
  '/practice',
  '/progress',
  '/progress/human-visual-perception',
  '/course/human-visual-perception',
  '/study/human-visual-perception',
  '/quiz/human-visual-perception',
  '/results/human-visual-perception',
  '/practice/human-visual-perception-curated',
  '/assessment/attempt-release-smoke',
  '/assessment-result/result-release-smoke',
  '/pilot/aqueous-vitreous',
];

describe('release smoke route matrix', () => {
  it('declares every public and controlled release route', () => {
    expect(RELEASE_PUBLIC_ROUTES).toEqual([
      '/',
      '/practice',
      '/progress',
      '/progress/:moduleId',
      '/course/:courseId',
      '/study/:moduleId',
      '/quiz/:moduleId',
      '/results/:moduleId',
    ]);
    expect(RELEASE_CONTROLLED_ROUTES).toEqual([
      '/practice/:experienceId',
      '/assessment/:attemptId',
      '/assessment-result/:resultId',
      '/pilot/aqueous-vitreous',
    ]);
  });

  it.each(concreteRoutes)('resolves %s without falling through to not-found', (path) => {
    expect(parseClientRoute(path).view).not.toBe('not-found');
  });

  it('uses an explicit not-found identity for unknown routes', () => {
    expect(parseClientRoute('/release/unknown')).toEqual({
      view: 'not-found',
      moduleId: '',
    });
  });
});
