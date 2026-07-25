import type { AssessmentQuestion, QuestionBank } from '@/lib/assessment/types';

export type CountMap = Record<string, number>;

export type QuestionBankReport = {
  totalQuestions: number;
  totalObjectives: number;
  byCourse: CountMap;
  byModule: CountMap;
  bySection: CountMap;
  byObjective: CountMap;
  byBloomLevel: CountMap;
  byDifficulty: CountMap;
  byFormat: CountMap;
  byStimulusType: CountMap;
  byReviewStatus: CountMap;
  questionsWithoutMisconceptionTags: number;
  questionsWithoutSourceLocators: number;
  familiesWithMultipleVariants: CountMap;
};

function countBy(
  questions: AssessmentQuestion[],
  selector: (question: AssessmentQuestion) => string,
): CountMap {
  const counts = new Map<string, number>();
  questions.forEach((question) => {
    const key = selector(question);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

export function reportQuestionBank(bank: QuestionBank): QuestionBankReport {
  const familyCounts = countBy(bank.questions, (question) => question.familyId);
  const familiesWithMultipleVariants = Object.fromEntries(
    Object.entries(familyCounts).filter(([, count]) => count > 1),
  );

  return {
    totalQuestions: bank.questions.length,
    totalObjectives: bank.objectives.length,
    byCourse: countBy(bank.questions, (question) => question.courseId),
    byModule: countBy(bank.questions, (question) => question.moduleId),
    bySection: countBy(
      bank.questions,
      (question) => `${question.courseId}/${question.moduleId}/${question.sectionId}`,
    ),
    byObjective: countBy(bank.questions, (question) => question.objectiveId),
    byBloomLevel: countBy(bank.questions, (question) => question.bloomLevel),
    byDifficulty: countBy(bank.questions, (question) => question.difficulty),
    byFormat: countBy(bank.questions, (question) => question.format),
    byStimulusType: countBy(bank.questions, (question) => question.stimulusType),
    byReviewStatus: countBy(bank.questions, (question) => question.reviewStatus),
    questionsWithoutMisconceptionTags: bank.questions.filter(
      (question) => question.misconceptionTags.length === 0,
    ).length,
    questionsWithoutSourceLocators: bank.questions.filter(
      (question) => question.sources.some(
        (source) => ['lecture', 'textbook', 'guideline', 'journal'].includes(source.kind)
          && !source.locator,
      ),
    ).length,
    familiesWithMultipleVariants,
  };
}

function formatCountMap(title: string, counts: CountMap): string[] {
  const entries = Object.entries(counts);
  return [
    title,
    ...(entries.length === 0
      ? ['  (none)']
      : entries.map(([key, count]) => `  ${key}: ${count}`)),
  ];
}

export function formatQuestionBankReport(report: QuestionBankReport): string {
  return [
    'Question bank report',
    `Total questions: ${report.totalQuestions}`,
    `Total objectives: ${report.totalObjectives}`,
    `Questions without misconception tags: ${report.questionsWithoutMisconceptionTags}`,
    `Questions without source locators: ${report.questionsWithoutSourceLocators}`,
    '',
    ...formatCountMap('By course', report.byCourse),
    ...formatCountMap('By module', report.byModule),
    ...formatCountMap('By section', report.bySection),
    ...formatCountMap('By objective', report.byObjective),
    ...formatCountMap('By Bloom level', report.byBloomLevel),
    ...formatCountMap('By difficulty', report.byDifficulty),
    ...formatCountMap('By format', report.byFormat),
    ...formatCountMap('By stimulus type', report.byStimulusType),
    ...formatCountMap('By review status', report.byReviewStatus),
    ...formatCountMap('Families with multiple variants', report.familiesWithMultipleVariants),
  ].join('\n');
}
