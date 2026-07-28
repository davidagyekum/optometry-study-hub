import { describe, expect, it } from 'vitest';
import { documentTitleForRoute } from '@/lib/navigation/documentIdentity';

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
      { controlledKind: 'hvp' as const, available: true },
      'HVP Curated Practice | Optometry Study Hub'],
    [{ view: 'assessment', moduleId: 'attempt-one' } as const,
      { controlledKind: 'hvp' as const, available: true },
      'HVP Practice Session | Optometry Study Hub'],
    [{ view: 'assessment-result', moduleId: 'result-one' } as const,
      { controlledKind: 'hvp' as const, resultAvailable: false },
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
      { controlledKind: 'hvp', available: true },
    )).not.toContain('student-attempt-secret');
  });
});
