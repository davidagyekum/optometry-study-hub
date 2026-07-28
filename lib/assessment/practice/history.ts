import type { QuestionGradeStatus } from '@/lib/assessment/grading/types';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  AssessmentResultSnapshot,
  QuestionHistoryRecord,
} from '@/lib/storage/schemas';

export const WEAK_TOPIC_ACCURACY_THRESHOLD = 0.8;

export type HistoryStrategyAvailability = {
  eligibleIds: string[];
  availableCount: number;
  requestedCount: number;
  sufficient: boolean;
};

export function isCurrentHistory(
  question: Pick<AssessmentQuestion, 'id' | 'version'>,
  record?: QuestionHistoryRecord,
): boolean {
  return record?.questionId === question.id && record.version === question.version;
}

export function unseenQuestionIds(
  questions: readonly AssessmentQuestion[],
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): string[] {
  return questions
    .filter((question) => !isCurrentHistory(question, history[question.id]))
    .map((question) => question.id);
}

export function retryMissedQuestionIds(
  questions: readonly AssessmentQuestion[],
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): string[] {
  return questions
    .filter((question) => {
      const record = history[question.id];
      return isCurrentHistory(question, record)
        && (record.lastStatus === 'incorrect' || record.lastStatus === 'partial');
    })
    .sort((left, right) => (
      (history[right.id]?.lastEncounteredAt ?? '').localeCompare(
        history[left.id]?.lastEncounteredAt ?? '',
      )
      || left.id.localeCompare(right.id)
    ))
    .map((question) => question.id);
}

export function weakTopicQuestionIds(
  questions: readonly AssessmentQuestion[],
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): string[] {
  const topicStats = new Map<string, { attempts: number; correct: number; recentMisses: number }>();
  questions.forEach((question) => {
    const record = history[question.id];
    if (!isCurrentHistory(question, record)) return;
    const current = topicStats.get(question.sectionId) ?? { attempts: 0, correct: 0, recentMisses: 0 };
    current.attempts += record.attemptCount;
    current.correct += record.correctCount;
    current.recentMisses += Number(record.lastStatus === 'incorrect' || record.lastStatus === 'partial');
    topicStats.set(question.sectionId, current);
  });
  const weakSections = [...topicStats]
    .filter(([, stats]) => stats.attempts >= 2 && (
      stats.correct / stats.attempts < WEAK_TOPIC_ACCURACY_THRESHOLD || stats.recentMisses > 0
    ))
    .sort(([leftId, left], [rightId, right]) => (
      left.correct / left.attempts - right.correct / right.attempts
      || right.recentMisses - left.recentMisses
      || leftId.localeCompare(rightId)
    ))
    .map(([sectionId]) => sectionId);
  const rank = new Map(weakSections.map((sectionId, index) => [sectionId, index]));
  return questions.filter((question) => rank.has(question.sectionId)).sort((left, right) => (
    (rank.get(left.sectionId) ?? 0) - (rank.get(right.sectionId) ?? 0) || left.id.localeCompare(right.id)
  )).map((question) => question.id);
}

export function challengeQuestionIds(
  questions: readonly AssessmentQuestion[],
): string[] {
  const higher = new Set(['apply', 'analyze', 'evaluate', 'create']);
  const priority = (question: AssessmentQuestion) => question.difficulty === 'advanced' && higher.has(question.bloomLevel)
    ? 0 : question.difficulty === 'advanced' ? 1 : 2;
  return questions
    .filter((question) => question.difficulty === 'advanced' || higher.has(question.bloomLevel))
    .sort((left, right) => priority(left) - priority(right) || left.id.localeCompare(right.id))
    .map((question) => question.id);
}

export function familyConstrainedCount(
  eligibleIds: readonly string[],
  questions: readonly AssessmentQuestion[],
  maximumFamilyRepetition: number,
): number {
  const eligible = new Set(eligibleIds);
  const families = new Map<string, number>();
  questions.forEach((question) => {
    if (eligible.has(question.id)) families.set(question.familyId, (families.get(question.familyId) ?? 0) + 1);
  });
  return [...families.values()].reduce((sum, count) => sum + Math.min(count, maximumFamilyRepetition), 0);
}

export function strategyAvailability(
  eligibleIds: readonly string[],
  requestedCount: number,
): HistoryStrategyAvailability {
  return {
    eligibleIds: [...eligibleIds],
    availableCount: eligibleIds.length,
    requestedCount,
    sufficient: eligibleIds.length >= requestedCount,
  };
}

export function nextHistoryRecord(
  existing: QuestionHistoryRecord | undefined,
  result: AssessmentResultSnapshot,
  questionId: string,
  policy: 'scored' | 'encounter-and-manual',
): QuestionHistoryRecord | { issue: 'PRACTICE_HISTORY_VERSION_CONFLICT' } {
  const version = result.questionVersions[questionId];
  const grade = result.grading?.questionGrades[questionId];
  if (!version || !grade) return { issue: 'PRACTICE_HISTORY_VERSION_CONFLICT' };
  if (existing && existing.version > version) {
    return { issue: 'PRACTICE_HISTORY_VERSION_CONFLICT' };
  }
  const sameVersion = existing?.version === version;
  const base: QuestionHistoryRecord = sameVersion && existing
    ? { ...existing }
    : {
      questionId,
      version,
      attemptCount: 0,
      correctCount: 0,
      encounterCount: 0,
      partialCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      manualRequiredCount: 0,
    };
  const status: QuestionGradeStatus = grade.status;
  const answered = Object.hasOwn(result.responses, questionId);
  base.encounterCount = (base.encounterCount ?? 0) + 1;
  base.lastEncounteredAt = result.submittedAt;
  base.lastResultId = result.id;
  base.lastStatus = status;
  base.version = version;
  if (answered) {
    base.responseCount = (base.responseCount ?? 0) + 1;
    base.lastAnsweredAt = result.submittedAt;
  }
  if (policy === 'scored' && answered && status !== 'manual_required') {
    base.attemptCount += 1;
    if (status === 'correct') base.correctCount += 1;
    if (status === 'partial') base.partialCount = (base.partialCount ?? 0) + 1;
    if (status === 'incorrect') base.incorrectCount = (base.incorrectCount ?? 0) + 1;
  }
  if (status === 'unanswered') base.unansweredCount = (base.unansweredCount ?? 0) + 1;
  if (status === 'manual_required') {
    base.manualRequiredCount = (base.manualRequiredCount ?? 0) + 1;
  }
  return base;
}
