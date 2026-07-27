import { reportQuestionBank } from '@/lib/assessment/reportQuestionBank';
import type { QuestionBank } from '@/lib/assessment/types';
import type { QuestionBlueprint } from './types';
import { validateQuestionBlueprint } from './validateBlueprint';

export type BlueprintReport = ReturnType<typeof reportQuestionBank> & { higherOrderCount: number; higherOrderPercentage: number; sourceCoverage: Record<string, number>; familyWarnings: string[] };
export function reportQuestionBlueprint(bank: QuestionBank): BlueprintReport {
  const base = reportQuestionBank(bank);
  const higherOrderCount = bank.questions.filter((question) => ['apply', 'analyze', 'evaluate', 'create'].includes(question.bloomLevel)).length;
  const sourceEntries: [string, number][] = bank.sources.map((source) => [source.id, bank.questions.filter((question) => question.sources.some((item) => item.id === source.id)).length]);
  const sourceCoverage = Object.fromEntries(sourceEntries.sort(([a], [b]) => a.localeCompare(b)));
  const familyCounts = new Map<string, number>();
  for (const question of bank.questions) familyCounts.set(question.familyId, (familyCounts.get(question.familyId) ?? 0) + 1);
  const familyWarnings = [...familyCounts.entries()].filter(([, count]) => count > 3).sort(([a], [b]) => a.localeCompare(b)).map(([id, count]) => `${id}: ${count} active questions`);
  return { ...base, higherOrderCount, higherOrderPercentage: bank.questions.length === 0 ? 0 : higherOrderCount / bank.questions.length * 100, sourceCoverage, familyWarnings };
}
export function formatBlueprintReport(bank: QuestionBank, blueprint: QuestionBlueprint): string {
  const report = reportQuestionBlueprint(bank);
  const lines = (title: string, values: Record<string, number>) => [title, ...Object.entries(values).map(([id, count]) => `  ${id}: ${count}`)];
  const diagnostics = validateQuestionBlueprint(bank, blueprint);
  return ['Question blueprint report', `Blueprint: ${blueprint.id}`, `Total questions: ${report.totalQuestions}`, `Higher-order questions: ${report.higherOrderCount} (${report.higherOrderPercentage.toFixed(6)}%)`, '', ...lines('Sections', Object.fromEntries(Object.entries(report.bySection).map(([id, count]) => [id.split('/').at(-1) ?? id, count]))), ...lines('Objectives', report.byObjective), ...lines('Formats', report.byFormat), ...lines('Bloom levels', report.byBloomLevel), ...lines('Difficulty', report.byDifficulty), ...lines('Stimulus types', report.byStimulusType), ...lines('Review statuses', report.byReviewStatus), ...lines('Source coverage', report.sourceCoverage), 'Family-size warnings', ...(report.familyWarnings.length ? report.familyWarnings.map((item) => `  ${item}`) : ['  (none)']), `Blueprint diagnostics: ${diagnostics.length}`].join('\n');
}
