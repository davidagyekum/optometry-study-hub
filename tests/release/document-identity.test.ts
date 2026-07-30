import { describe, expect, it } from 'vitest';
import { documentTitleForRoute } from '@/lib/navigation/documentIdentity';
import { dummyCuratedSummary } from '@/tests/fixtures/assessment/dummyCuratedExperience';

const hvpSummary = {
  ...dummyCuratedSummary,
  documentTitles: {
    landing: 'HVP Curated Practice',
    session: 'HVP Practice Session',
    result: 'HVP Practice Result',
    unavailable: 'Curated Practice Unavailable',
  },
};

describe('route-aware document identity', () => {
  it.each([
    [{ view: 'home', moduleId: '' } as const, {}, 'Optometry Study Hub'],
    [{ view: 'practice-hub', moduleId: '' } as const, {}, 'Practice Hub | Optometry Study Hub'],
    [{ view: 'progress', moduleId: '' } as const, {}, 'Progress Hub | Optometry Study Hub'],
    [{ view: 'progress', moduleId: 'human-visual-perception' } as const,
      { moduleTitle: 'Human Visual Perception' },
      'Human Visual Perception Progress | Optometry Study Hub'],
    [{ view: 'course', moduleId: 'human-visual-perception' } as const,
      { courseTitle: 'Human Visual Perception' },
      'Human Visual Perception | Optometry Study Hub'],
    [{ view: 'study', moduleId: 'human-visual-perception' } as const,
      { moduleTitle: 'Human Visual Perception' },
      'Human Visual Perception Notes | Optometry Study Hub'],
    [{ view: 'quiz', moduleId: 'human-visual-perception' } as const,
      { moduleTitle: 'Human Visual Perception' },
      'Human Visual Perception Legacy Quiz | Optometry Study Hub'],
    [{ view: 'results', moduleId: 'human-visual-perception' } as const,
      { moduleTitle: 'Human Visual Perception' },
      'Human Visual Perception Legacy Results | Optometry Study Hub'],
    [{ view: 'practice', moduleId: 'human-visual-perception-curated' } as const,
      { controlledKind: 'curated' as const, curatedSummary: hvpSummary, available: true },
      'HVP Curated Practice | Optometry Study Hub'],
    [{ view: 'assessment', moduleId: 'attempt-one' } as const,
      { controlledKind: 'curated' as const, curatedSummary: hvpSummary, available: true },
      'HVP Practice Session | Optometry Study Hub'],
    [{ view: 'assessment-result', moduleId: 'result-one' } as const,
      { controlledKind: 'curated' as const, resultAvailable: false },
      'Assessment Recovery | Optometry Study Hub'],
    [{ view: 'pilot', moduleId: 'aqueous-vitreous' } as const,
      { controlledKind: 'aqueous' as const, available: false },
      'Aqueous Pilot Unavailable | Optometry Study Hub'],
    [{ view: 'not-found', moduleId: '' } as const, {}, 'Page not found | Optometry Study Hub'],
  ])('creates a meaningful title for $0', (route, context, expected) => {
    expect(documentTitleForRoute(route, context)).toBe(expected);
  });

  it('never places attempt or result identifiers in a title', () => {
    expect(documentTitleForRoute(
      { view: 'assessment', moduleId: 'student-attempt-secret' },
      { controlledKind: 'curated', curatedSummary: hvpSummary, available: true },
    )).not.toContain('student-attempt-secret');
  });

  it('uses registered titles for a second and disabled curated experience', () => {
    expect(documentTitleForRoute(
      { view: 'practice', moduleId: dummyCuratedSummary.routeSegment },
      { controlledKind: 'curated', curatedSummary: dummyCuratedSummary, available: true },
    )).toBe('Dummy Curated Practice | Optometry Study Hub');
    expect(documentTitleForRoute(
      { view: 'assessment', moduleId: 'dummy-attempt' },
      { controlledKind: 'curated', curatedSummary: dummyCuratedSummary, available: true },
    )).toBe('Dummy Practice Session | Optometry Study Hub');
    expect(documentTitleForRoute(
      { view: 'assessment-result', moduleId: 'dummy-result' },
      {
        controlledKind: 'curated',
        curatedSummary: dummyCuratedSummary,
        available: true,
        resultAvailable: true,
      },
    )).toBe('Dummy Practice Result | Optometry Study Hub');
    expect(documentTitleForRoute(
      { view: 'practice', moduleId: dummyCuratedSummary.routeSegment },
      { controlledKind: 'curated', curatedSummary: dummyCuratedSummary, available: false },
    )).toBe('Dummy Practice Unavailable | Optometry Study Hub');
  });

  it('fails closed with generic titles when no summary resolves', () => {
    expect(documentTitleForRoute(
      { view: 'practice', moduleId: 'unknown-curated' },
      { controlledKind: 'unknown', available: false },
    )).toBe('Curated Practice Unavailable | Optometry Study Hub');
    expect(documentTitleForRoute(
      { view: 'assessment', moduleId: 'unknown-attempt' },
      { controlledKind: 'unknown', available: true },
    )).toBe('Assessment Session | Optometry Study Hub');
  });

  it.each([
    [
      'enabled HVP result',
      hvpSummary,
      true,
      true,
      'HVP Practice Result | Optometry Study Hub',
    ],
    [
      'disabled HVP result with saved data',
      hvpSummary,
      false,
      true,
      'Curated Practice Unavailable | Optometry Study Hub',
    ],
    [
      'enabled second-module result',
      dummyCuratedSummary,
      true,
      true,
      'Dummy Practice Result | Optometry Study Hub',
    ],
    [
      'disabled second-module result with saved data',
      dummyCuratedSummary,
      false,
      true,
      'Dummy Practice Unavailable | Optometry Study Hub',
    ],
  ])('uses the correct title for %s', (
    _case,
    summary,
    available,
    resultAvailable,
    expected,
  ) => {
    expect(documentTitleForRoute(
      { view: 'assessment-result', moduleId: 'saved-result' },
      {
        controlledKind: 'curated',
        curatedSummary: summary,
        available,
        resultAvailable,
      },
    )).toBe(expected);
  });

  it('uses recovery identity when a result is missing', () => {
    expect(documentTitleForRoute(
      { view: 'assessment-result', moduleId: 'missing-result' },
      {
        controlledKind: 'curated',
        curatedSummary: hvpSummary,
        available: true,
        resultAvailable: false,
      },
    )).toBe('Assessment Recovery | Optometry Study Hub');
  });

});
