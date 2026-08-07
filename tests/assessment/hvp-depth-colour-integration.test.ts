import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hvpColourPerceptionExtensionQuestionBank } from '@/content/question-bank/opt374/hvp-colour-perception/bank';
import { hvpDepthPerceptionExtensionQuestionBank } from '@/content/question-bank/opt374/hvp-depth-perception/bank';
import { curatedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import {
  HVP_DEPTH_COLOUR_MODULE_CONFIGS,
  isHvpDepthColourExpansionEnabled,
  type HvpDepthColourModuleId,
} from '@/lib/assessment/hvp-depth-colour/config';
import {
  hvpColourPerceptionExperience,
  hvpDepthPerceptionExperience,
} from '@/lib/assessment/hvp-depth-colour/definitions';
import type { CoursePracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import type { QuestionBank } from '@/lib/assessment/types';
import { EXPECTED_HVP_CHECKSUM, hvpChecksum } from '@/lib/release/assertions';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

const EXPECTED_FORMATS = {
  single_best_answer: 25,
  true_false: 8,
  multiple_response: 10,
  ordering: 7,
  matching: 8,
  extended_matching: 7,
  image_hotspot: 5,
  image_label: 4,
  short_answer: 4,
  open_response: 2,
};

const fixtures: Array<{
  moduleId: HvpDepthColourModuleId;
  bank: QuestionBank;
  experience: CoursePracticeExperience;
  checksum: string;
}> = [
  {
    moduleId: 'hvp-depth-perception',
    bank: hvpDepthPerceptionExtensionQuestionBank,
    experience: hvpDepthPerceptionExperience,
    checksum: 'bc2043867b438330d71d31ab732b54e8b4c5950eee4133fed3b56fc347024194',
  },
  {
    moduleId: 'hvp-colour-perception',
    bank: hvpColourPerceptionExtensionQuestionBank,
    experience: hvpColourPerceptionExperience,
    checksum: 'd9a3011c77cd9cdcfcefff3dab9b24daf9296966397b00c389d32a9a151f0351',
  },
];

function counts(bank: QuestionBank, field: 'format' | 'sectionId') {
  return bank.questions.reduce<Record<string, number>>((result, question) => ({
    ...result,
    [question[field]]: (result[question[field]] ?? 0) + 1,
  }), {});
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('HVP Depth + Colour draft extension', () => {
  it('parses 160 unique draft questions and 20 objectives without changing legacy HVP', () => {
    const questions = fixtures.flatMap(({ bank }) => bank.questions);
    const objectives = fixtures.flatMap(({ bank }) => bank.objectives);

    expect(questions).toHaveLength(160);
    expect(new Set(questions.map((question) => question.id)).size).toBe(160);
    expect(objectives).toHaveLength(20);
    expect(new Set(objectives.map((objective) => objective.id)).size).toBe(20);
    expect([...questions, ...objectives].every(
      (item) => item.reviewStatus === 'draft',
    )).toBe(true);
    expect(hvpChecksum()).toBe(EXPECTED_HVP_CHECKSUM);

    fixtures.forEach(({ moduleId, bank }) => {
      expect(bank.questions).toHaveLength(80);
      expect(counts(bank, 'format')).toEqual(EXPECTED_FORMATS);
      expect(new Set(bank.questions.map((question) => question.sectionId)))
        .toEqual(new Set(Object.keys(HVP_DEPTH_COLOUR_MODULE_CONFIGS[moduleId].sectionLabels)));
    });
  });

  it('preserves supplied bank bytes and validates objective, source, note and image references', () => {
    fixtures.forEach(({ moduleId, bank, checksum }) => {
      const bankPath = join(
        process.cwd(), 'content', 'question-bank', 'opt374', moduleId, 'bank.json',
      );
      expect(createHash('sha256').update(readFileSync(bankPath)).digest('hex'))
        .toBe(checksum);

      const objectiveMap = new Map(
        bank.objectives.map((objective) => [objective.id, objective]),
      );
      const sourceIds = new Set(bank.sources.map((source) => source.id));
      const sectionIds = new Set(
        Object.keys(HVP_DEPTH_COLOUR_MODULE_CONFIGS[moduleId].sectionLabels),
      );
      bank.questions.forEach((question) => {
        expect(objectiveMap.get(question.objectiveId)).toMatchObject({
          moduleId,
          sectionId: question.sectionId,
        });
        expect(sectionIds).toContain(question.noteAnchor);
        question.sources.forEach((source) => expect(sourceIds).toContain(source.id));
        if (question.format === 'image_hotspot' || question.format === 'image_label') {
          const assetPath = join(
            process.cwd(), 'public', question.image.src.replace(/^\//, ''),
          );
          expect(existsSync(assetPath), assetPath).toBe(true);
          expect(readFileSync(assetPath, 'utf8')).toMatch(/<svg[^>]+viewBox=/);
          expect(question.image).toMatchObject({ width: 800, height: 450 });
        }
      });
    });
  });

  it('requires exact flag opt-in and registers two disabled-by-default experiences', () => {
    expect(isHvpDepthColourExpansionEnabled(undefined)).toBe(false);
    expect(isHvpDepthColourExpansionEnabled('false')).toBe(false);
    expect(isHvpDepthColourExpansionEnabled('TRUE')).toBe(false);
    expect(isHvpDepthColourExpansionEnabled(' true ')).toBe(false);
    expect(isHvpDepthColourExpansionEnabled('true')).toBe(true);
    expect(readFileSync('.env.example', 'utf8')).toContain(
      'NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION=false',
    );

    const entries = curatedExperienceRegistry.filter((entry) =>
      entry.summary.experienceId.endsWith('-perception-extension'),
    );
    expect(entries).toHaveLength(2);
    expect(new Set(entries.flatMap((entry) => entry.summary.blueprintIds)).size)
      .toBe(4);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION', undefined);
    expect(entries.every((entry) => entry.isEnabled?.() === false)).toBe(true);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION', 'true');
    expect(entries.every((entry) => entry.isEnabled?.() === true)).toBe(true);
    expect(entries.every((entry) => entry.summary.statusLabel === 'Draft course extension'))
      .toBe(true);
  });

  it('hides both modules while disabled and resolves authored Notes V3 when enabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION', 'false');
    vi.resetModules();
    let [{ moduleMap }, { courses }] = await Promise.all([
      import('@/content/legacy/moduleCatalog'),
      import('@/content/legacy/courseCatalog'),
    ]);
    expect(moduleMap.has('hvp-depth-perception')).toBe(false);
    expect(moduleMap.has('hvp-colour-perception')).toBe(false);
    expect(courses.find((course) => course.id === 'human-visual-perception')?.moduleIds)
      .toEqual(['human-visual-perception']);

    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION', 'true');
    vi.resetModules();
    [{ moduleMap }, { courses }] = await Promise.all([
      import('@/content/legacy/moduleCatalog'),
      import('@/content/legacy/courseCatalog'),
    ]);
    const { loadNotes } = await import('@/content/notes-v3/catalog');
    expect(courses.find((course) => course.id === 'human-visual-perception')?.moduleIds)
      .toEqual([
        'human-visual-perception',
        'hvp-depth-perception',
        'hvp-colour-perception',
      ]);

    for (const { moduleId } of fixtures) {
      const courseModule = moduleMap.get(moduleId);
      if (!courseModule) throw new Error(`Missing enabled module ${moduleId}`);
      expect(courseModule.facts).toEqual([]);
      const notes = await loadNotes(courseModule);
      expect(notes.kind).toBe('v3');
      if (notes.kind === 'v3') {
        expect(notes.content.sections.map((section) => section.id))
          .toEqual(Object.keys(HVP_DEPTH_COLOUR_MODULE_CONFIGS[moduleId].sectionLabels));
        expect(notes.content.sections.every((section) => section.blocks.length > 0))
          .toBe(true);
      }
    }
  });

  it('assembles deterministic quick, standard, full and written sessions for both modules', () => {
    for (const { moduleId, bank, experience } of fixtures) {
      const registry = experience.registryBuilder();
      if (!registry.ok) throw new Error(JSON.stringify(registry.issues));
      for (const [profileId, count] of [
        ['quick', 10],
        ['standard', 25],
        ['full', 50],
        ['written', 2],
      ] as const) {
        const request = {
          profileId,
          requestedCount: count,
          seed: `${moduleId}-${profileId}`,
        };
        const first = experience.definition.createAttempt(
          request, createEmptyStoreV2(), registry.value,
        );
        if (!first.ok) {
          throw new Error(`${moduleId}/${profileId}: ${JSON.stringify(first.issues)}`);
        }
        const compatible = experience.definition.validateAttempt(first.value, registry.value);
        if (!compatible.ok) {
          throw new Error(moduleId + '/' + profileId + ' resume: ' + JSON.stringify(compatible.issues));
        }
        expect(first.value.orderedQuestionIds).toHaveLength(count);
        expect(new Set(first.value.orderedQuestionIds).size).toBe(count);
        const selected = first.value.orderedQuestionIds.map((id) =>
          bank.questions.find((question) => question.id === id),
        );
        expect(selected.every(Boolean)).toBe(true);
        expect(selected.every((question) => profileId === 'written'
          ? question?.format === 'open_response'
          : question?.format !== 'open_response')).toBe(true);

        const second = experience.definition.createAttempt(
          request, createEmptyStoreV2(), registry.value,
        );
        expect(second.ok && second.value.orderedQuestionIds)
          .toEqual(first.value.orderedQuestionIds);
      }
    }
  }, 30_000);
});
