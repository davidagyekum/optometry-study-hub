import { describe, expect, it } from 'vitest';
import { courses } from '@/content/legacy/courseCatalog';
import type { CuratedPracticeDefinition } from '@/lib/assessment/curated/definition';
import {
  curatedExperienceRegistry,
  curatedExperienceSummaries,
} from '@/lib/assessment/curated/experienceRegistry';
import {
  resolveCuratedExperienceByBlueprint,
  resolveCuratedExperienceByRoute,
} from '@/lib/assessment/curated/resolveExperience';
import { aqueousVitreousCuratedPracticeDefinition } from '@/lib/assessment/aqueous-vitreous-curated/definition';
import { bloodSupplyPracticeDefinition } from '@/lib/assessment/blood-supply/definition';
import { ocularAdnexaPracticeDefinition } from '@/lib/assessment/ocular-adnexa/definition';
import { tissuePracticeDefinition } from '@/lib/assessment/tissue-foundations/definition';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { updateAttemptDraftResponse } from '@/lib/assessment/session/draftResponses';
import { controlledExperienceKind } from '@/lib/assessment/routing/controlledExperience';
import { parseClientRoute } from '@/lib/navigation/clientRoute';
import { resetCourseStudyData } from '@/lib/storage/assessmentReset';
import {
  finalizeAssessmentStore,
  putActiveAssessmentAttempt,
} from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';
import { hvpPracticeDefinition } from '@/lib/assessment/hvp/definition';
import { makeAttempt, makeResult } from '@/tests/fixtures/session-engine';

const neuroDefinitions: Array<{
  moduleId: string;
  routeSegment: string;
  definition: CuratedPracticeDefinition;
}> = [
  {
    moduleId: 'tissue-foundations',
    routeSegment: 'tissue-foundations-curated',
    definition: tissuePracticeDefinition,
  },
  {
    moduleId: 'ocular-adnexa',
    routeSegment: 'ocular-adnexa-curated',
    definition: ocularAdnexaPracticeDefinition,
  },
  {
    moduleId: 'aqueous-vitreous',
    routeSegment: 'aqueous-vitreous-curated',
    definition: aqueousVitreousCuratedPracticeDefinition,
  },
  {
    moduleId: 'blood-supply',
    routeSegment: 'blood-supply-curated',
    definition: bloodSupplyPracticeDefinition,
  },
];

function registryFor(definition: CuratedPracticeDefinition) {
  if (!definition.registryResult.ok) {
    throw new Error(`${definition.summary.shortTitle} registry should build.`);
  }
  return definition.registryResult.value;
}

function addScoredQuickResult(
  store: StoreV2,
  fixture: (typeof neuroDefinitions)[number],
  correctAnswerCount: number,
): StoreV2 {
  const registry = registryFor(fixture.definition);
  const created = fixture.definition.createAttempt({
    profileId: 'quick',
    strategy: 'mixed',
    requestedCount: 10,
    seed: `neuro-integration-${fixture.moduleId}`,
  }, store, registry);
  if (!created.ok) throw new Error(`${fixture.moduleId} Quick practice failed.`);

  let attempt = created.value;
  const singleBestIds = attempt.orderedQuestionIds.filter((questionId) => (
    registry.get(questionId)?.format === 'single_best_answer'
  ));
  expect(singleBestIds.length).toBeGreaterThanOrEqual(correctAnswerCount);
  for (const questionId of singleBestIds.slice(0, correctAnswerCount)) {
    const question = registry.get(questionId);
    if (!question || question.format !== 'single_best_answer') {
      throw new Error('Expected a single-best-answer integration fixture.');
    }
    const updated = updateAttemptDraftResponse({
      attempt,
      registry,
      questionId,
      draft: {
        format: 'single_best_answer',
        optionId: question.correctOptionId,
      },
    });
    if (!updated.ok) throw new Error(`Could not answer ${questionId}.`);
    attempt = updated.value;
  }

  const finalized = finalizeGradedAssessmentAttempt({
    attempt,
    registry,
    now: () => new Date(`2026-07-30T1${correctAnswerCount}:00:00.000Z`),
    idFactory: () => `result-${fixture.moduleId}`,
  });
  if (!finalized.ok) throw new Error(`${fixture.moduleId} grading failed.`);
  const active = putActiveAssessmentAttempt(
    store,
    finalized.value.lockedAttempt.id,
    finalized.value.lockedAttempt,
  );
  if (!active.ok) throw new Error(`${fixture.moduleId} persistence failed.`);
  const stored = finalizeAssessmentStore(
    active.value,
    finalized.value.lockedAttempt.id,
    finalized.value.result.id,
    finalized.value.result,
    {
      historyPolicy: fixture.definition.historyPolicy(
        finalized.value.lockedAttempt,
      ),
      registry,
    },
  );
  if (!stored.ok) throw new Error(`${fixture.moduleId} finalization failed.`);
  return stored.value;
}

describe('complete Neuro Anatomy curated integration', () => {
  it('binds all four stable routes, modules and blueprint identities', () => {
    const summaries = curatedExperienceSummaries().filter(
      (summary) => summary.courseId === 'neuro-anatomy',
    );
    expect(summaries.map((summary) => summary.moduleId)).toEqual(
      neuroDefinitions.map((fixture) => fixture.moduleId),
    );
    expect(summaries.map((summary) => summary.routeSegment)).toEqual(
      neuroDefinitions.map((fixture) => fixture.routeSegment),
    );
    for (const fixture of neuroDefinitions) {
      const route = parseClientRoute(`/practice/${fixture.routeSegment}`);
      expect(route).toEqual({
        view: 'practice',
        moduleId: fixture.routeSegment,
      });
      expect(resolveCuratedExperienceByRoute(fixture.routeSegment)?.summary)
        .toMatchObject({
          courseId: 'neuro-anatomy',
          moduleId: fixture.moduleId,
        });
      for (const blueprintId of fixture.definition.summary.blueprintIds) {
        expect(resolveCuratedExperienceByBlueprint(blueprintId)?.summary.moduleId)
          .toBe(fixture.moduleId);
      }
    }
  });

  it('keeps attempts, results, scores and current-version history isolated', () => {
    let store = createEmptyStoreV2();
    neuroDefinitions.forEach((fixture, index) => {
      store = addScoredQuickResult(store, fixture, index + 1);
    });

    expect(Object.values(store.assessment.activeAttempts)).toEqual([]);
    const results = Object.values(store.assessment.results);
    expect(results).toHaveLength(4);
    expect(Object.fromEntries(results.map((result) => [
      result.moduleId,
      result.score,
    ]))).toEqual({
      'tissue-foundations': 1,
      'ocular-adnexa': 2,
      'aqueous-vitreous': 3,
      'blood-supply': 4,
    });

    const questionIdsByModule = neuroDefinitions.map((fixture) => {
      const result = store.assessment.results[`result-${fixture.moduleId}`];
      expect(result.courseId).toBe('neuro-anatomy');
      expect(result.moduleId).toBe(fixture.moduleId);
      expect(fixture.definition.validateResult(
        result,
        registryFor(fixture.definition),
      ).ok).toBe(true);
      result.orderedQuestionIds.forEach((questionId) => {
        expect(store.assessment.questionHistory[questionId]?.questionId)
          .toBe(questionId);
        expect(registryFor(fixture.definition).get(questionId)).toBeDefined();
      });
      return new Set(result.orderedQuestionIds);
    });
    questionIdsByModule.forEach((ids, index) => {
      questionIdsByModule.forEach((otherIds, otherIndex) => {
        if (index === otherIndex) return;
        expect([...ids].some((questionId) => otherIds.has(questionId))).toBe(false);
      });
    });
  });

  it('resets only Neuro Anatomy data and retains question history plus HVP data', () => {
    let store = createEmptyStoreV2();
    neuroDefinitions.forEach((fixture, index) => {
      store = addScoredQuickResult(store, fixture, index + 1);
    });
    const historyBefore = structuredClone(store.assessment.questionHistory);
    const hvpAttempt = {
      ...makeAttempt(undefined, { idFactory: () => 'attempt-hvp-preserved' }),
      courseId: 'human-visual-perception',
      moduleId: 'human-visual-perception',
    };
    const hvpResult = {
      ...makeResult(hvpAttempt),
      id: 'result-hvp-preserved',
      attemptId: hvpAttempt.id,
    };
    store.assessment.activeAttempts[hvpAttempt.id] = hvpAttempt;
    store.assessment.results[hvpResult.id] = hvpResult;
    store.read = {
      ...store.read,
      'tissue-foundations': ['tissue-nervous'],
      'ocular-adnexa': ['landmarks'],
      'aqueous-vitreous': ['flow'],
      'blood-supply': ['retinal'],
      'human-visual-perception': ['hvp-foundations'],
    };

    const neuroCourse = courses.find((course) => course.id === 'neuro-anatomy');
    if (!neuroCourse) throw new Error('Neuro Anatomy course is missing.');
    const reset = resetCourseStudyData(
      store,
      neuroCourse.id,
      neuroCourse.moduleIds,
    );

    neuroCourse.moduleIds.forEach((moduleId) => {
      expect(reset.read[moduleId]).toEqual([]);
      expect(Object.values(reset.assessment.results).some(
        (result) => result.moduleId === moduleId,
      )).toBe(false);
      expect(Object.values(reset.assessment.activeAttempts).some(
        (attempt) => attempt.moduleId === moduleId,
      )).toBe(false);
    });
    expect(reset.read['human-visual-perception']).toEqual(['hvp-foundations']);
    expect(reset.assessment.activeAttempts[hvpAttempt.id]).toEqual(hvpAttempt);
    expect(reset.assessment.results[hvpResult.id]).toEqual(hvpResult);
    expect(reset.assessment.questionHistory).toEqual(historyBefore);
  });

  it('keeps HVP compatible and the engineering pilot disabled and distinct', () => {
    const store = createEmptyStoreV2();
    const hvpRegistry = registryFor(hvpPracticeDefinition);
    const hvp = hvpPracticeDefinition.createAttempt({
      profileId: 'quick',
      strategy: 'mixed',
      requestedCount: 10,
      seed: 'neuro-integration-hvp-compatibility',
    }, store, hvpRegistry);
    expect(hvp.ok).toBe(true);
    if (hvp.ok) {
      expect(hvpPracticeDefinition.validateAttempt(hvp.value, hvpRegistry).ok)
        .toBe(true);
    }

    expect(resolveCuratedExperienceByBlueprint('aqueous-vitreous-pilot-v1'))
      .toBeUndefined();
    expect(controlledExperienceKind(
      'assessment',
      'aqueous-vitreous-pilot-v1',
      'pilot-attempt',
    )).toBe('aqueous');
    expect(controlledExperienceKind(
      'assessment',
      'opt376-aqueous-vitreous-curated-v1',
      'curated-attempt',
    )).toBe('curated');
    expect(curatedExperienceRegistry).toHaveLength(6);
  });
});
