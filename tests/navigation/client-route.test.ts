import { describe, expect, it } from 'vitest';
import { buildClientPath, parseClientRoute } from '@/lib/navigation/clientRoute';

describe('client route helpers', () => {
  it.each([
    ['/', { view: 'home', moduleId: '' }],
    ['/course/neuro-anatomy', { view: 'course', moduleId: 'neuro-anatomy' }],
    ['/study/ocular-adnexa', { view: 'study', moduleId: 'ocular-adnexa' }],
    ['/quiz/aqueous-vitreous', { view: 'quiz', moduleId: 'aqueous-vitreous' }],
    ['/results/blood-supply', { view: 'results', moduleId: 'blood-supply' }],
    ['/study', { view: 'study', moduleId: '' }],
    ['/pilot/aqueous-vitreous', { view: 'pilot', moduleId: 'aqueous-vitreous' }],
    ['/assessment/attempt-pilot', { view: 'assessment', moduleId: 'attempt-pilot' }],
    ['/assessment-result/result-pilot', {
      view: 'assessment-result', moduleId: 'result-pilot',
    }],
    ['/assessment/attempt-pilot?from=notes#question', {
      view: 'assessment', moduleId: 'attempt-pilot',
    }],
    ['/pilot/unknown', { view: 'pilot', moduleId: 'unknown' }],
    ['/unknown/value', { view: 'home', moduleId: '' }],
    ['/quiz/aqueous-vitreous?attempt=1#current', {
      view: 'quiz', moduleId: 'aqueous-vitreous',
    }],
  ])('parses %s', (path, expected) => {
    expect(parseClientRoute(path)).toEqual(expected);
  });

  it.each([
    [{ view: 'home', moduleId: '' } as const, '/'],
    [{ view: 'course', moduleId: 'neuro-anatomy' } as const, '/course/neuro-anatomy'],
    [{ view: 'study', moduleId: 'ocular-adnexa' } as const, '/study/ocular-adnexa'],
    [{ view: 'quiz', moduleId: 'aqueous-vitreous' } as const, '/quiz/aqueous-vitreous'],
    [{ view: 'results', moduleId: 'blood-supply' } as const, '/results/blood-supply'],
    [{ view: 'pilot', moduleId: 'aqueous-vitreous' } as const, '/pilot/aqueous-vitreous'],
    [{ view: 'assessment', moduleId: 'attempt-pilot' } as const, '/assessment/attempt-pilot'],
    [{ view: 'assessment-result', moduleId: 'result-pilot' } as const,
      '/assessment-result/result-pilot'],
  ])('builds $expected', (route, expected) => {
    expect(buildClientPath(route)).toBe(expected);
  });
});
