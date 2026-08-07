import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { loadNotes } from '@/content/notes-v3/catalog';
import { multifocalFoundationsQuestionBank } from '@/content/question-bank/opt370/multifocal-foundations/bank';
import { pdAndDispensingQuestionBank } from '@/content/question-bank/opt370/pd-and-dispensing/bank';
import { progressiveAdditionLensesQuestionBank } from '@/content/question-bank/opt370/progressive-addition-lenses/bank';
import { schematicEyeRefractiveStatesQuestionBank } from '@/content/question-bank/opt370/schematic-eye-refractive-states/bank';
import { specialLensesQuestionBank } from '@/content/question-bank/opt370/special-lenses/bank';
import { curatedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import type { Opt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import { OPT370_MODULE_CONFIGS } from '@/lib/assessment/opt370/config';
import { multifocalFoundationsExperience } from '@/lib/assessment/opt370/multifocal-foundations/definition';
import { pdAndDispensingExperience } from '@/lib/assessment/opt370/pd-and-dispensing/definition';
import { progressiveAdditionLensesExperience } from '@/lib/assessment/opt370/progressive-addition-lenses/definition';
import { schematicEyeRefractiveStatesExperience } from '@/lib/assessment/opt370/schematic-eye-refractive-states/definition';
import { specialLensesExperience } from '@/lib/assessment/opt370/special-lenses/definition';
import type { QuestionBank } from '@/lib/assessment/types';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

const EXPECTED_FORMATS = {
  single_best_answer: 26,
  true_false: 6,
  multiple_response: 10,
  matching: 9,
  extended_matching: 7,
  ordering: 7,
  image_hotspot: 5,
  image_label: 4,
  short_answer: 4,
  open_response: 2,
};

const fixtures: Array<{
  moduleId: keyof typeof OPT370_MODULE_CONFIGS;
  bank: QuestionBank;
  experience: Opt370PracticeExperience;
}> = [
  {
    moduleId: 'schematic-eye-refractive-states',
    bank: schematicEyeRefractiveStatesQuestionBank,
    experience: schematicEyeRefractiveStatesExperience,
  },
  {
    moduleId: 'multifocal-foundations',
    bank: multifocalFoundationsQuestionBank,
    experience: multifocalFoundationsExperience,
  },
  {
    moduleId: 'progressive-addition-lenses',
    bank: progressiveAdditionLensesQuestionBank,
    experience: progressiveAdditionLensesExperience,
  },
  {
    moduleId: 'pd-and-dispensing',
    bank: pdAndDispensingQuestionBank,
    experience: pdAndDispensingExperience,
  },
  {
    moduleId: 'special-lenses',
    bank: specialLensesQuestionBank,
    experience: specialLensesExperience,
  },
];

function counts(bank: QuestionBank, field: 'format' | 'sectionId') {
  return bank.questions.reduce<Record<string, number>>((result, question) => ({
    ...result,
    [question[field]]: (result[question[field]] ?? 0) + 1,
  }), {});
}

describe('OPT 370 Dispensing Optics II integration', () => {
  it('registers one course and five stable modules without lecturer ambiguity', () => {
    const course = courses.find((candidate) => candidate.id === 'dispensing-optics-ii');
    expect(course).toMatchObject({
      code: 'OPT 370',
      title: 'Dispensing Optics II',
      lecturers: [],
      moduleIds: fixtures.map(({ moduleId }) => moduleId),
    });
    fixtures.forEach(({ moduleId }) => {
      expect(moduleMap.get(moduleId)).toMatchObject({
        id: moduleId,
        courseId: 'dispensing-optics-ii',
      });
      expect(moduleMap.get(moduleId)?.lecturer).toBeUndefined();
    });
  });

  it('parses exactly 400 unique draft questions with the required format mix', () => {
    const questions = fixtures.flatMap(({ bank }) => bank.questions);
    const objectives = fixtures.flatMap(({ bank }) => bank.objectives);
    expect(questions).toHaveLength(400);
    expect(new Set(questions.map((question) => question.id)).size).toBe(400);
    expect(objectives).toHaveLength(66);
    expect(new Set(objectives.map((objective) => objective.id)).size).toBe(66);
    fixtures.forEach(({ moduleId, bank }) => {
      expect(bank.questions).toHaveLength(80);
      expect(counts(bank, 'format')).toEqual(EXPECTED_FORMATS);
      expect(new Set(bank.questions.map((question) => question.sectionId)))
        .toEqual(new Set(Object.keys(OPT370_MODULE_CONFIGS[moduleId].sectionLabels)));
      expect([...bank.questions, ...bank.objectives].every(
        (item) => item.reviewStatus === 'draft',
      )).toBe(true);
    });
  });

  it('keeps objective, source, note-anchor and image geometry references valid', () => {
    fixtures.forEach(({ moduleId, bank }) => {
      const objectiveMap = new Map(bank.objectives.map((objective) => [objective.id, objective]));
      const sourceIds = new Set(bank.sources.map((source) => source.id));
      const sectionIds = new Set(Object.keys(OPT370_MODULE_CONFIGS[moduleId].sectionLabels));
      bank.questions.forEach((question) => {
        expect(objectiveMap.get(question.objectiveId)).toMatchObject({
          moduleId,
          sectionId: question.sectionId,
        });
        expect(sectionIds).toContain(question.noteAnchor);
        question.sources.forEach((source) => expect(sourceIds).toContain(source.id));
        if (question.format === 'image_hotspot' || question.format === 'image_label') {
          const path = join(process.cwd(), 'public', question.image.src.replace(/^\//, ''));
          expect(existsSync(path), path).toBe(true);
          const svg = readFileSync(path, 'utf8');
          expect(svg).toMatch(/<svg[^>]+viewBox=/);
          expect(question.image).toMatchObject({ width: 1200, height: 675 });
        }
        if (question.format === 'image_hotspot') {
          question.regions.forEach((region) => {
            expect(region.x).toBeGreaterThanOrEqual(0);
            expect(region.y).toBeGreaterThanOrEqual(0);
            expect(region.x + region.width).toBeLessThanOrEqual(1);
            expect(region.y + region.height).toBeLessThanOrEqual(1);
          });
        }
        if (question.format === 'image_label') {
          question.targets.forEach((target) => {
            expect(target.x).toBeGreaterThanOrEqual(0);
            expect(target.x).toBeLessThanOrEqual(1);
            expect(target.y).toBeGreaterThanOrEqual(0);
            expect(target.y).toBeLessThanOrEqual(1);
          });
        }
      });
    });
  });

  it('compiles and resolves authored Notes V3 for every module', async () => {
    for (const { moduleId } of fixtures) {
      const courseModule = moduleMap.get(moduleId);
      if (!courseModule) throw new Error('Missing module ' + moduleId);
      const notes = await loadNotes(courseModule);
      expect(notes.kind).toBe('v3');
      if (notes.kind === 'v3') {
        expect(notes.content.courseId).toBe('dispensing-optics-ii');
        expect(notes.content.moduleId).toBe(moduleId);
        expect(notes.content.sections.map((section) => section.id))
          .toEqual(Object.keys(OPT370_MODULE_CONFIGS[moduleId].sectionLabels));
        expect(notes.content.sections.every((section) => section.blocks.length > 0)).toBe(true);
      }
    }
  });

  it('registers five unique disabled-by-default curated experiences', () => {
    const entries = curatedExperienceRegistry.filter(
      (entry) => entry.summary.courseId === 'dispensing-optics-ii',
    );
    expect(entries).toHaveLength(5);
    expect(new Set(entries.map((entry) => entry.summary.experienceId)).size).toBe(5);
    expect(new Set(entries.map((entry) => entry.summary.routeSegment)).size).toBe(5);
    expect(new Set(entries.flatMap((entry) => entry.summary.blueprintIds)).size).toBe(10);
    entries.forEach((entry) => {
      const flagName = OPT370_MODULE_CONFIGS[
        entry.summary.moduleId as keyof typeof OPT370_MODULE_CONFIGS
      ].flagName;
      vi.stubEnv(flagName, undefined);
      expect(entry.isEnabled?.()).toBe(false);
      vi.stubEnv(flagName, 'true');
      expect(entry.isEnabled?.()).toBe(true);
      vi.stubEnv(flagName, 'TRUE');
      expect(entry.isEnabled?.()).toBe(false);
      expect(entry.summary.statusLabel).toBe('Course-aligned practice');
    });
    vi.unstubAllEnvs();
  });

  it('assembles deterministic quick, standard, full and written sessions for all five modules', () => {
    for (const { moduleId, bank, experience } of fixtures) {
      const registry = experience.registryBuilder();
      if (!registry.ok) throw new Error(JSON.stringify(registry.issues));
      for (const [profileId, count] of [
        ['quick', 10],
        ['standard', 25],
        ['full', 50],
        ['written', 2],
      ] as const) {
        const first = experience.definition.createAttempt({
          profileId,
          requestedCount: count,
          seed: moduleId + '-' + profileId,
        }, createEmptyStoreV2(), registry.value);
        if (!first.ok) throw new Error(moduleId + '/' + profileId + ': ' + JSON.stringify(first.issues));
        expect(first.value.orderedQuestionIds).toHaveLength(count);
        expect(new Set(first.value.orderedQuestionIds).size).toBe(count);
        const selected = first.value.orderedQuestionIds.map((id) =>
          bank.questions.find((question) => question.id === id),
        );
        expect(selected.every(Boolean)).toBe(true);
        if (profileId === 'written') {
          expect(selected.every((question) => question?.format === 'open_response')).toBe(true);
        } else {
          expect(selected.every((question) => question?.format !== 'open_response')).toBe(true);
        }
        if (profileId === 'full') {
          const questions = selected.filter((question) => question !== undefined);
          const profile = experience.automaticBlueprint.profiles.find(
            (candidate) => candidate.id === 'full',
          );
          const selectedCounts = (field: 'sectionId' | 'format') =>
            questions.reduce<Record<string, number>>((result, question) => ({
              ...result,
              [question[field]]: (result[question[field]] ?? 0) + 1,
            }), {});
          expect(selectedCounts('sectionId')).toEqual(profile?.sectionTargets);
          expect(selectedCounts('format')).toEqual(profile?.formatTargets);
          expect(new Set(questions.map((question) => question.difficulty)).size).toBe(3);
          expect(new Set(questions.map((question) => question.bloomLevel)).size)
            .toBeGreaterThanOrEqual(5);
          expect(new Set(questions.map((question) => question.objectiveId)).size)
            .toBeGreaterThanOrEqual(bank.objectives.length - 2);
          const familyCounts = questions.reduce<Record<string, number>>(
            (result, question) => ({
              ...result,
              [question.familyId]: (result[question.familyId] ?? 0) + 1,
            }),
            {},
          );
          expect(Math.max(...Object.values(familyCounts))).toBeLessThanOrEqual(2);
        }
        const second = experience.definition.createAttempt({
          profileId,
          requestedCount: count,
          seed: moduleId + '-' + profileId,
        }, createEmptyStoreV2(), registry.value);
        expect(second.ok && second.value.orderedQuestionIds).toEqual(first.value.orderedQuestionIds);
      }
    }
  }, 30_000);
});
