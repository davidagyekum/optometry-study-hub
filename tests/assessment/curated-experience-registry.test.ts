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
  it('contains safe discovery metadata for every production adapter', () => {
    expect(curatedExperienceRegistry).toHaveLength(13);
    expect(curatedExperienceSummaries()).toEqual(expect.arrayContaining([
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
      expect.objectContaining({
        experienceId: 'opt376-tissue-foundations-curated-v1',
        courseId: 'neuro-anatomy',
        moduleId: 'tissue-foundations',
        routeSegment: 'tissue-foundations-curated',
        blueprintIds: [
          'opt376-tissue-foundations-curated-blueprint-v1',
          'opt376-tissue-foundations-written-v1',
        ],
        enabled: false,
      }),
      expect.objectContaining({
        experienceId: 'ocular-adnexa',
        courseId: 'neuro-anatomy',
        moduleId: 'ocular-adnexa',
        routeSegment: 'ocular-adnexa-curated',
        blueprintIds: [
          'opt376-ocular-adnexa-curated-v1',
          'opt376-ocular-adnexa-written-v1',
        ],
        enabled: false,
      }),
      expect.objectContaining({
        experienceId: 'aqueous-vitreous-curated',
        courseId: 'neuro-anatomy',
        moduleId: 'aqueous-vitreous',
        routeSegment: 'aqueous-vitreous-curated',
        blueprintIds: [
          'opt376-aqueous-vitreous-curated-v1',
          'opt376-aqueous-vitreous-written-v1',
        ],
        enabled: false,
      }),
      expect.objectContaining({
        experienceId: 'blood-supply',
        courseId: 'neuro-anatomy',
        moduleId: 'blood-supply',
        routeSegment: 'blood-supply-curated',
        blueprintIds: [
          'opt376-blood-supply-curated-v1',
          'opt376-blood-supply-written-v1',
        ],
        enabled: false,
      }),
      expect.objectContaining({
        experienceId: 'environmental-vision',
        courseId: 'environmental-vision',
        moduleId: 'environmental-vision',
        routeSegment: 'environmental-vision-curated',
        blueprintIds: [
          'opt508-environmental-vision-curated-v1',
          'opt508-environmental-vision-written-v1',
        ],
        enabled: false,
      }),
      expect.objectContaining({
        experienceId: 'autonomic-pharmacology',
        courseId: 'pharmacology',
        moduleId: 'autonomic-pharmacology',
        routeSegment: 'autonomic-pharmacology-curated',
        blueprintIds: [
          'autonomic-pharmacology-curated-v1',
          'autonomic-pharmacology-written-v1',
        ],
        enabled: false,
      }),
      expect.objectContaining({
        experienceId: 'systemic-pathology',
        courseId: 'systemic-pathology',
        moduleId: 'systemic-pathology',
        routeSegment: 'systemic-pathology-curated',
        blueprintIds: [
          'systemic-pathology-curated-v1',
          'systemic-pathology-written-v1',
        ],
        enabled: false,
      }),
    ]));
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
    expect(curatedExperienceRegistry).toHaveLength(13);
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
