import { describe, expect, it, vi } from 'vitest';
import {
  createCuratedExperienceRegistry,
  curatedExperienceRegistry,
  curatedExperienceSummaries,
} from '@/lib/assessment/curated/experienceRegistry';
import {
  resolveCuratedExperienceByBlueprint,
  resolveCuratedExperienceByModule,
  resolveCuratedExperienceByRoute,
  resolveCuratedExperienceForControlledRoute,
  summaryForModule,
} from '@/lib/assessment/curated/resolveExperience';
import {
  dummyCuratedSummary,
  makeDummyCuratedExperience,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

describe('curated-experience registry', () => {
  it('contains only the production HVP adapter and safe discovery metadata', () => {
    expect(curatedExperienceRegistry).toHaveLength(1);
    expect(curatedExperienceSummaries()).toEqual([
      expect.objectContaining({
        experienceId: 'human-visual-perception',
        courseId: 'human-visual-perception',
        moduleId: 'human-visual-perception',
        routeSegment: 'human-visual-perception-curated',
        blueprintIds: [
          'opt374-hvp-curated-v1',
          'opt374-hvp-written-v1',
        ],
      }),
    ]);
  });

  it.each([
    ['experience', { experienceId: dummyCuratedSummary.experienceId }],
    ['route', { routeSegment: dummyCuratedSummary.routeSegment }],
    ['module binding', {
      courseId: dummyCuratedSummary.courseId,
      moduleId: dummyCuratedSummary.moduleId,
    }],
    ['blueprint', { blueprintIds: [dummyCuratedSummary.blueprintIds[0]] }],
  ])('rejects duplicate %s registrations', (_label, duplicate) => {
    const first = makeDummyCuratedExperience();
    const second = makeDummyCuratedExperience();
    second.summary = { ...second.summary, ...duplicate };
    expect(() => createCuratedExperienceRegistry([first, second])).toThrow(
      /CURATED_DUPLICATE_/,
    );
  });

  it('allows multiple distinct modules in one course for future-safe discovery', () => {
    const first = makeDummyCuratedExperience();
    const second = makeDummyCuratedExperience();
    second.summary = {
      ...second.summary,
      experienceId: 'dummy-curated-two',
      moduleId: 'dummy-module-two',
      routeSegment: 'dummy-curated-two',
      blueprintIds: ['dummy-two-v1'],
    };
    expect(createCuratedExperienceRegistry([first, second])).toHaveLength(2);
  });

  it('rejects a repeated module identity even if the claimed course differs', () => {
    const first = makeDummyCuratedExperience();
    const second = makeDummyCuratedExperience();
    second.summary = {
      ...second.summary,
      experienceId: 'dummy-curated-two',
      courseId: 'other-dummy-course',
      routeSegment: 'dummy-curated-two',
      blueprintIds: ['dummy-two-v1'],
    };
    expect(() => createCuratedExperienceRegistry([first, second])).toThrow(
      /CURATED_DUPLICATE_MODULE/,
    );
  });

  it('resolves a second synthetic experience without putting it in production', () => {
    const dummy = makeDummyCuratedExperience();
    const registry = createCuratedExperienceRegistry([dummy]);
    expect(resolveCuratedExperienceByRoute('dummy-curated', registry)).toBe(
      registry[0],
    );
    expect(resolveCuratedExperienceByBlueprint('dummy-written-v1', registry)).toBe(
      registry[0],
    );
    expect(resolveCuratedExperienceByModule('dummy-module', registry)).toBe(
      registry[0],
    );
    expect(resolveCuratedExperienceForControlledRoute(
      'practice',
      'dummy-curated',
      undefined,
      registry,
    )).toBe(registry[0]);
    expect(summaryForModule('dummy-module', [dummyCuratedSummary])).toEqual(
      dummyCuratedSummary,
    );
    expect(curatedExperienceRegistry).toHaveLength(1);
  });

  it('does not invoke answer-bearing loaders during registry discovery', () => {
    const onPracticeLoad = vi.fn();
    const onProgressLoad = vi.fn();
    const registry = createCuratedExperienceRegistry([
      makeDummyCuratedExperience({
        enabled: false,
        onPracticeLoad,
        onProgressLoad,
      }),
    ]);
    expect(registry[0].summary.enabled).toBe(false);
    expect(onPracticeLoad).not.toHaveBeenCalled();
    expect(onProgressLoad).not.toHaveBeenCalled();
  });

  it('fails closed for unknown routes and blueprints', () => {
    expect(resolveCuratedExperienceByRoute('unknown')).toBeUndefined();
    expect(resolveCuratedExperienceByBlueprint('unknown')).toBeUndefined();
    expect(resolveCuratedExperienceForControlledRoute(
      'assessment',
      'missing',
      'unknown',
    )).toBeUndefined();
  });

  it.each([
    ['experienceId', 'Bad Experience'],
    ['courseId', 'bad/course'],
    ['moduleId', 'bad_module'],
    ['routeSegment', 'BadRoute'],
  ])('rejects a non-stable %s identity', (field, invalid) => {
    const adapter = makeDummyCuratedExperience();
    adapter.summary = { ...adapter.summary, [field]: invalid };
    expect(() => createCuratedExperienceRegistry([adapter])).toThrow();
  });

  it('defensively clones and deeply freezes registry identities', () => {
    const adapter = makeDummyCuratedExperience();
    const sourceBlueprints = adapter.summary.blueprintIds;
    const registry = createCuratedExperienceRegistry([adapter]);
    adapter.summary.routeSegment = 'mutated-after-registration';
    sourceBlueprints.push('mutated-blueprint');
    expect(registry[0].summary.routeSegment).toBe('dummy-curated');
    expect(registry[0].summary.blueprintIds).toEqual([
      'dummy-automatic-v1',
      'dummy-written-v1',
    ]);
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry[0])).toBe(true);
    expect(Object.isFrozen(registry[0].summary)).toBe(true);
    expect(Object.isFrozen(registry[0].summary.blueprintIds)).toBe(true);
    expect(() => {
      (registry[0].summary.blueprintIds as string[]).push('forbidden');
    }).toThrow();
  });
});
