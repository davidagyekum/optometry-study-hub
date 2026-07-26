import { describe, expect, it } from 'vitest';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousBlueprint } from '@/content/question-bank/opt376/aqueous-vitreous/blueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
const codes = (bank = aqueousVitreousCandidateBank, blueprint = aqueousVitreousBlueprint) => validateQuestionBlueprint(bank, blueprint).map((diagnostic) => diagnostic.code);
describe('question blueprint validation', () => {
  it('accepts the canonical bank', () => expect(codes()).toEqual([]));
  it('reports target totals and bank counts', () => { expect(codes(aqueousVitreousCandidateBank, { ...aqueousVitreousBlueprint, totalQuestions: 35 })).toContain('BLUEPRINT_TOTAL_MISMATCH'); expect(codes({ ...aqueousVitreousCandidateBank, questions: aqueousVitreousCandidateBank.questions.slice(1) })).toContain('BLUEPRINT_BANK_COUNT_MISMATCH'); });
  it.each([
    ['sectionId', 'unexpected-section', 'BLUEPRINT_SECTION_MISMATCH'], ['format', 'multiple_response', 'BLUEPRINT_FORMAT_MISMATCH'], ['bloomLevel', 'understand', 'BLUEPRINT_BLOOM_MISMATCH'], ['difficulty', 'advanced', 'BLUEPRINT_DIFFICULTY_MISMATCH'], ['stimulusType', 'text', 'BLUEPRINT_STIMULUS_MISMATCH'],
  ] as const)('detects %s mismatches', (field, value, code) => { const questions = [...aqueousVitreousCandidateBank.questions]; questions[0] = { ...questions[0], [field]: value } as typeof questions[number]; expect(codes({ ...aqueousVitreousCandidateBank, questions })).toContain(code); });
  it('detects higher-order and objective coverage shortfalls', () => { expect(codes(aqueousVitreousCandidateBank, { ...aqueousVitreousBlueprint, minimumHigherOrderShare: 0.9 })).toContain('BLUEPRINT_HIGHER_ORDER_SHORTFALL'); expect(codes(aqueousVitreousCandidateBank, { ...aqueousVitreousBlueprint, minimumQuestionsPerObjective: 5 })).toContain('BLUEPRINT_OBJECTIVE_UNDERCOVERED'); });
});
