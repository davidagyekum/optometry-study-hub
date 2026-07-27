import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { humanVisualPerceptionBlueprint } from '@/content/question-bank/opt374/human-visual-perception/blueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const countBy = <T,>(values: T[], key: (value: T) => string) => values.reduce<Record<string, number>>(
  (counts, value) => ({
    ...counts,
    [key(value)]: (counts[key(value)] ?? 0) + 1,
  }),
  {},
);

describe('OPT 374 Human Visual Perception canonical bank', () => {
  it('preserves the exact package identity and distributions', () => {
    const bank = humanVisualPerceptionCandidateBank;
    expect(bank.id).toBe('opt374-human-visual-perception-foundations');
    expect(bank.questions).toHaveLength(120);
    expect(bank.objectives).toHaveLength(23);
    expect(bank.sources).toHaveLength(19);
    expect(countBy(bank.questions, (question) => question.sectionId)).toEqual({
      'hvp-foundations': 16,
      'hvp-retina': 48,
      'hvp-lgn': 32,
      'hvp-extrastriate': 24,
    });
    expect(countBy(bank.questions, (question) => question.format)).toEqual({
      single_best_answer: 64,
      multiple_response: 16,
      matching: 10,
      extended_matching: 6,
      ordering: 8,
      image_hotspot: 4,
      image_label: 4,
      short_answer: 6,
      open_response: 2,
    });
    expect(countBy(bank.questions, (question) => question.bloomLevel)).toEqual({
      remember: 28,
      understand: 37,
      apply: 30,
      analyze: 22,
      evaluate: 2,
      create: 1,
    });
    expect(countBy(bank.questions, (question) => question.difficulty)).toEqual({
      foundation: 33,
      intermediate: 59,
      advanced: 28,
    });
    expect(countBy(bank.questions, (question) => question.stimulusType)).toEqual({
      text: 18,
      diagram: 14,
      clinical_vignette: 29,
      pathway: 20,
      comparison: 37,
      error_analysis: 2,
    });
  });

  it('passes the repository schema and exact blueprint', () => {
    const validation = validateQuestionBank(humanVisualPerceptionCandidateBank);
    expect(validation.diagnostics.filter((item) => item.severity === 'error')).toEqual([]);
    expect(validation.bank).toBeDefined();
    expect(validateQuestionBlueprint(
      humanVisualPerceptionCandidateBank,
      humanVisualPerceptionBlueprint,
    )).toEqual([]);
  });

  it('keeps stable draft content, note anchors, objectives and source identity', () => {
    const bank = humanVisualPerceptionCandidateBank;
    const questionIds = bank.questions.map((question) => question.id);
    const normalizedStems = bank.questions.map((question) => (
      question.stem.toLocaleLowerCase().replaceAll(/\s+/g, ' ').trim()
    ));
    const objectiveIds = new Set(bank.objectives.map((objective) => objective.id));
    const sourceMap = new Map(bank.sources.map((source) => [source.id, source]));
    const noteAnchors = new Set([
      'hvp-foundations',
      'hvp-retina',
      'hvp-lgn',
      'hvp-extrastriate',
    ]);

    expect(new Set(questionIds).size).toBe(120);
    expect(new Set(normalizedStems).size).toBe(120);
    expect(bank.questions.every((question) => question.reviewStatus === 'draft')).toBe(true);
    expect(bank.objectives.every((objective) => objective.reviewStatus === 'draft')).toBe(true);
    expect(bank.questions.every((question) => question.version === 1)).toBe(true);
    expect(bank.questions.every((question) => question.author
      === 'Optometry Study Hub slide-aligned content team')).toBe(true);
    expect(bank.questions.every((question) => noteAnchors.has(question.noteAnchor))).toBe(true);
    expect(bank.questions.every((question) => objectiveIds.has(question.objectiveId))).toBe(true);
    expect(bank.objectives.every((objective) => bank.questions.some(
      (question) => question.objectiveId === objective.id,
    ))).toBe(true);

    bank.questions.forEach((question) => {
      const objective = bank.objectives.find((item) => item.id === question.objectiveId);
      expect(objective?.targetBloomLevels).toContain(question.bloomLevel);
      question.sources.forEach((source) => expect(source).toEqual(sourceMap.get(source.id)));
    });
  });

  it('keeps component answers, maps, orders, coordinates and normalization coherent', () => {
    humanVisualPerceptionCandidateBank.questions.forEach((question) => {
      if ('options' in question) {
        expect(question.options.every((option) => Boolean(option.rationale))).toBe(true);
      }
      if (question.format === 'single_best_answer') {
        expect(question.options.map((option) => option.id)).toContain(question.correctOptionId);
      }
      if (question.format === 'multiple_response') {
        const ids = new Set(question.options.map((option) => option.id));
        expect(question.correctOptionIds.every((id) => ids.has(id))).toBe(true);
      }
      if (question.format === 'ordering') {
        expect(new Set(question.correctOrder)).toEqual(new Set(
          question.items.map((item) => item.id),
        ));
      }
      if (question.format === 'matching') {
        expect(Object.keys(question.correctMatches).sort()).toEqual(
          question.prompts.map((prompt) => prompt.id).sort(),
        );
      }
      if (question.format === 'extended_matching') {
        expect(Object.keys(question.correctAnswers).sort()).toEqual(
          question.stems.map((stem) => stem.id).sort(),
        );
      }
      if (question.format === 'image_hotspot') {
        question.regions.forEach((region) => {
          expect(region.x).toBeGreaterThanOrEqual(0);
          expect(region.y).toBeGreaterThanOrEqual(0);
          expect(region.x + region.width).toBeLessThanOrEqual(1);
          expect(region.y + region.height).toBeLessThanOrEqual(1);
          expect(region.interactionLabel.toLocaleLowerCase()).not.toContain(
            region.label.toLocaleLowerCase(),
          );
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
      if (question.format === 'short_answer') {
        const normalized = question.acceptedAnswers.map((answer) => (
          answer.trim().toLocaleLowerCase().replaceAll(/\s+/g, ' ')
        ));
        expect(new Set(normalized).size).toBe(normalized.length);
      }
    });
  });

  it('matches the supplied package SHA-256 fixture identity indirectly by exact bytes', () => {
    const bytes = readFileSync(
      'content/question-bank/opt374/human-visual-perception/bank.json',
    );
    expect(bytes.byteLength).toBe(348215);
  });
});
