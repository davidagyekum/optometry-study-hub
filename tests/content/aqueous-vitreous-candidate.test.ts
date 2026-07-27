import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousBlueprint } from '@/content/question-bank/opt376/aqueous-vitreous/blueprint';
import { AQUEOUS_PILOT_QUESTION_IDS } from '@/lib/assessment/pilot/blueprint';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

describe('canonical Aqueous and Vitreous candidate bank', () => {
  it('has the declared draft-only integrity and exact blueprint', () => {
    const bank = aqueousVitreousCandidateBank;
    expect(bank.questions).toHaveLength(36); expect(bank.objectives).toHaveLength(13); expect(new Set(bank.questions.map((q) => q.id)).size).toBe(36);
    expect(bank.questions.every((q) => q.reviewStatus === 'draft' && !q.reviewer && q.version > 0 && q.sources.length > 0)).toBe(true);
    expect(bank.objectives.every((objective) => objective.reviewStatus === 'draft' && objective.sourceIds.length > 0)).toBe(true);
    expect(validateQuestionBank(bank).diagnostics).toEqual([]); expect(lintQuestionBank(bank)).toEqual([]); expect(validateQuestionBlueprint(bank, aqueousVitreousBlueprint)).toEqual([]);
    const studyModule = moduleMap.get('aqueous-vitreous'); expect(studyModule).toBeDefined(); const sections = new Set(studyModule?.sections.map((section) => section.id));
    expect(sections?.size).toBe(6); for (const question of bank.questions) { expect(sections?.has(question.noteAnchor)).toBe(true); if ('image' in question) expect(existsSync(join(process.cwd(), 'public', question.image.src.slice(1)))).toBe(true); }
    const objectiveCounts = Object.fromEntries(bank.objectives.map((objective) => [objective.id, bank.questions.filter((q) => q.objectiveId === objective.id).length])); expect(Math.min(...Object.values(objectiveCounts))).toBeGreaterThanOrEqual(2);
  });
  it('uses accessible structured data for every table stimulus', () => {
    const tables = aqueousVitreousCandidateBank.questions.filter((q) => q.stimulusType === 'table'); expect(tables).toHaveLength(3);
    for (const question of tables) { expect(question.table?.caption).toBeTruthy(); const columns = question.table?.columns.map((column) => column.id) ?? []; expect(columns.length).toBeGreaterThanOrEqual(2); for (const row of question.table?.rows ?? []) expect(Object.keys(row.cells).sort()).toEqual([...columns].sort()); }
  });
  it('meets candidate content-quality rules', () => {
    const pilotIds = new Set<string>(AQUEOUS_PILOT_QUESTION_IDS);
    const newQuestions = aqueousVitreousCandidateBank.questions.filter((q) => !pilotIds.has(q.id));
    expect(newQuestions).toHaveLength(27);
    for (const question of newQuestions) { const serialized = JSON.stringify(question); expect(serialized).not.toMatch(/all of the above|none of the above/i); if (question.difficulty !== 'foundation') expect(question.misconceptionTags.length).toBeGreaterThan(0); if (/\b(not|except|false|incorrect|least)\b/i.test(question.stem)) expect(question.allowNegativeStem).toBe(true); if (question.format === 'single_best_answer' || question.format === 'multiple_response' || question.format === 'extended_matching') expect(question.options.every((option) => option.rationale?.trim())).toBe(true); if (question.format === 'ordering') expect(question.items.every((item) => item.rationale?.trim())).toBe(true); if (question.format === 'matching') expect(question.choices.every((choice) => choice.rationale?.trim())).toBe(true); if (question.format === 'image_label') expect(question.labels.every((item) => item.rationale?.trim())).toBe(true); if (question.format === 'image_hotspot') for (const region of question.regions) expect(region.interactionLabel.toLowerCase()).not.toBe(region.label.toLowerCase()); }
  });
  it('keeps the revised table stimuli independent from their answer maps', () => {
    for (const questionId of ['aqueous-production-matching-001', 'vitreous-anatomy-matching-001']) {
      const question = aqueousVitreousCandidateBank.questions.find((entry) => entry.id === questionId); expect(question?.format).toBe('matching'); if (!question || question.format !== 'matching') continue;
      const rows = question.table?.rows ?? []; expect(rows.length).toBe(question.prompts.length);
      for (const prompt of question.prompts) {
        const row = rows.find((entry) => Object.values(entry.cells).includes(prompt.text)); expect(row).toBeDefined();
        const correctChoice = question.choices.find((entry) => entry.id === question.correctMatches[prompt.id]); expect(correctChoice).toBeDefined();
        expect(JSON.stringify(row?.cells).toLowerCase()).not.toContain(correctChoice!.text.toLowerCase());
      }
    }
  });
  it('keeps the IOP error-analysis mapping unique and the corrected Bloom operations defensible', () => {
    const matching = aqueousVitreousCandidateBank.questions.find((entry) => entry.id === 'aqueous-iop-matching-001'); expect(matching?.format).toBe('matching'); if (matching?.format === 'matching') {
      expect(matching.correctMatches).toEqual({ 'formation-normal': 'outflow-resistance', 'meshwork-low': 'episcleral-pressure', 'one-reading': 'measurement-context' });
      expect(new Set(Object.values(matching.correctMatches)).size).toBe(matching.prompts.length);
      expect(matching.prompts.map((entry) => entry.text)).toEqual([
        '“Aqueous formation and episcleral venous pressure are unchanged, so IOP cannot rise.”',
        '“Aqueous formation and trabecular resistance are unchanged, so IOP cannot rise.”',
        '“One tonometer value is a context-free diagnosis.”',
      ]);
      expect(matching.prompts.map((entry) => entry.text).join(' ')).not.toMatch(/Only secretion can raise IOP/i);
    }
    expect(aqueousVitreousCandidateBank.questions.find((entry) => entry.id === 'aqueous-barrier-sba-001')).toMatchObject({ bloomLevel: 'analyze', stimulusType: 'clinical_vignette' });
    expect(aqueousVitreousCandidateBank.questions.find((entry) => entry.id === 'aqueous-production-matching-001')).toMatchObject({ bloomLevel: 'analyze', stimulusType: 'table' });
    expect(aqueousVitreousCandidateBank.questions.find((entry) => entry.id === 'vitreous-anatomy-matching-001')).toMatchObject({ bloomLevel: 'understand', stimulusType: 'table' });
    const short = aqueousVitreousCandidateBank.questions.find((entry) => entry.id === 'vitreous-clinical-short-001'); expect(short).toMatchObject({ bloomLevel: 'apply', stimulusType: 'error_analysis' }); expect(short?.stem).toMatch(/examination shows/i);
  });
  it('registers syntactically valid external source URLs', () => { for (const source of aqueousVitreousCandidateBank.sources.filter((item) => item.url)) expect(() => new URL(source.url as string)).not.toThrow(); });
});
