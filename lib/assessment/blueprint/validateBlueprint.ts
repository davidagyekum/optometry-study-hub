import type { Diagnostic } from '@/lib/assessment/diagnostics';
import type { AssessmentQuestion, QuestionBank } from '@/lib/assessment/types';
import type { QuestionBlueprint, TargetMap } from './types';

const higherOrder = new Set(['apply', 'analyze', 'evaluate', 'create']);
const countBy = (questions: AssessmentQuestion[], select: (question: AssessmentQuestion) => string): TargetMap => {
  const result: TargetMap = {};
  for (const question of questions) result[select(question)] = (result[select(question)] ?? 0) + 1;
  return result;
};

function compareTargets(label: string, code: string, actual: TargetMap, expected: TargetMap, diagnostics: Diagnostic[]): void {
  const ids = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  for (const id of ids) {
    if ((actual[id] ?? 0) !== (expected[id] ?? 0)) diagnostics.push({ severity: 'error', code, message: `${label} "${id}" expected ${expected[id] ?? 0} but found ${actual[id] ?? 0}.`, path: id });
  }
}

export function validateQuestionBlueprint(bank: QuestionBank, blueprint: QuestionBlueprint): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const targetGroups: [string, TargetMap][] = [['section', blueprint.sectionTargets], ['format', blueprint.formatTargets], ['Bloom', blueprint.bloomTargets], ['difficulty', blueprint.difficultyTargets], ['stimulus', blueprint.stimulusTargets]];
  for (const [label, targets] of targetGroups) {
    const total = Object.values(targets).reduce((sum, count) => sum + count, 0);
    if (total !== blueprint.totalQuestions) diagnostics.push({ severity: 'error', code: 'BLUEPRINT_TOTAL_MISMATCH', message: `${label} targets total ${total}, expected ${blueprint.totalQuestions}.`, path: label });
  }
  if (bank.id !== blueprint.bankId) diagnostics.push({ severity: 'error', code: 'BLUEPRINT_BANK_MISMATCH', message: `Blueprint expects bank "${blueprint.bankId}" but received "${bank.id}".` });
  if (bank.questions.length !== blueprint.totalQuestions) diagnostics.push({ severity: 'error', code: 'BLUEPRINT_BANK_COUNT_MISMATCH', message: `Bank contains ${bank.questions.length} questions, expected ${blueprint.totalQuestions}.` });
  compareTargets('Section', 'BLUEPRINT_SECTION_MISMATCH', countBy(bank.questions, (q) => q.sectionId), blueprint.sectionTargets, diagnostics);
  compareTargets('Format', 'BLUEPRINT_FORMAT_MISMATCH', countBy(bank.questions, (q) => q.format), blueprint.formatTargets, diagnostics);
  compareTargets('Bloom level', 'BLUEPRINT_BLOOM_MISMATCH', countBy(bank.questions, (q) => q.bloomLevel), blueprint.bloomTargets, diagnostics);
  compareTargets('Difficulty', 'BLUEPRINT_DIFFICULTY_MISMATCH', countBy(bank.questions, (q) => q.difficulty), blueprint.difficultyTargets, diagnostics);
  compareTargets('Stimulus', 'BLUEPRINT_STIMULUS_MISMATCH', countBy(bank.questions, (q) => q.stimulusType), blueprint.stimulusTargets, diagnostics);
  const higherOrderCount = bank.questions.filter((question) => higherOrder.has(question.bloomLevel)).length;
  const higherOrderShare = bank.questions.length === 0 ? 0 : higherOrderCount / bank.questions.length;
  if (higherOrderShare < blueprint.minimumHigherOrderShare) diagnostics.push({ severity: 'error', code: 'BLUEPRINT_HIGHER_ORDER_SHORTFALL', message: `Higher-order share ${higherOrderShare.toFixed(6)} is below ${blueprint.minimumHigherOrderShare.toFixed(6)}.` });
  const objectiveIds = new Set(bank.objectives.map((objective) => objective.id));
  for (const question of bank.questions) if (!objectiveIds.has(question.objectiveId)) diagnostics.push({ severity: 'error', code: 'BLUEPRINT_MISSING_OBJECTIVE', message: `Question references missing objective "${question.objectiveId}".`, questionId: question.id });
  for (const objective of bank.objectives) {
    const count = bank.questions.filter((question) => question.objectiveId === objective.id).length;
    if (count < blueprint.minimumQuestionsPerObjective) diagnostics.push({ severity: 'error', code: 'BLUEPRINT_OBJECTIVE_UNDERCOVERED', message: `Objective "${objective.id}" has ${count} questions; minimum is ${blueprint.minimumQuestionsPerObjective}.`, path: objective.id });
  }
  return diagnostics;
}
