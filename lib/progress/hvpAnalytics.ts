import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { validateHvpCuratedAttempt, validateHvpCuratedResult } from '@/lib/assessment/hvp/compatibility';
import { HVP_CURATED_BLUEPRINT_ID } from '@/lib/assessment/hvp/config';
import { HVP_WRITTEN_BLUEPRINT_ID } from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import {
  familyConstrainedCount,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
} from '@/lib/assessment/practice/history';
import type { AssessmentGradingReport } from '@/lib/assessment/grading/types';
import { accuracyPercentage, groupMastery, questionMastery } from '@/lib/progress/mastery';
import type {
  CompatibleCuratedResult,
  HvpCuratedSummary,
  MasteryEvidence,
  MasteryGroup,
  MasteryLevel,
  QuestionMasteryEvidence,
} from '@/lib/progress/types';
import {
  assessmentAttemptSnapshotSchema,
  assessmentResultSnapshotSchema,
  type StoreV2,
} from '@/lib/storage/schemas';

const AUTOMATIC = humanVisualPerceptionCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);
const SECTION_LABELS: Record<string, string> = {
  'hvp-foundations': 'Foundations',
  'hvp-retina': 'Retina',
  'hvp-lgn': 'LGN and V1',
  'hvp-extrastriate': 'Extrastriate',
};
const FORMAT_LABELS: Record<string, string> = {
  single_best_answer: 'Single best answer',
  true_false: 'True / False',
  multiple_response: 'Multiple response',
  matching: 'Matching',
  extended_matching: 'Extended matching',
  ordering: 'Ordering',
  image_hotspot: 'Image hotspot',
  image_label: 'Image label',
  short_answer: 'Short answer',
};
const LEVELS: MasteryLevel[] = ['unseen', 'learning', 'developing', 'proficient', 'mastered'];

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

function latest(left?: string, right?: string): string | undefined {
  if (!left) return right;
  if (!right) return left;
  return left.localeCompare(right) >= 0 ? left : right;
}

function percentage(report: AssessmentGradingReport): number | undefined {
  return report.score !== null && report.maxScore
    ? (report.score / report.maxScore) * 100
    : undefined;
}

function aggregateGroups(
  questions: QuestionMasteryEvidence[],
  definitions: Array<{ id: string; label: string }>,
  key: (question: QuestionMasteryEvidence) => string,
): MasteryGroup[] {
  return definitions.map(({ id, label }) => {
    const members = questions.filter((question) => key(question) === id);
    const earnedPoints = members.reduce((sum, question) => sum + question.earnedPoints, 0);
    const possiblePoints = members.reduce((sum, question) => sum + question.possiblePoints, 0);
    const encountered = members.filter((question) => question.encounterCount > 0);
    const evidence: MasteryEvidence = {
      eligibleQuestionCount: members.length,
      distinctQuestionsEncountered: encountered.length,
      distinctGradableQuestions: members.filter((question) => question.gradableAttemptCount > 0).length,
      coveragePercentage: members.length ? (encountered.length / members.length) * 100 : 0,
      gradableEncounterCount: members.reduce((sum, question) => sum + question.gradableAttemptCount, 0),
      earnedPoints,
      possiblePoints,
      answeredAccuracy: accuracyPercentage(earnedPoints, possiblePoints),
      recentMissCount: members.filter(
        (question) => question.lastStatus === 'incorrect' || question.lastStatus === 'partial',
      ).length,
      lastActivity: members.reduce<string | undefined>(
        (value, question) => latest(value, question.lastActivity),
        undefined,
      ),
    };
    return { id, label, ...evidence, mastery: groupMastery(evidence) };
  });
}

function profileOf(result: StoreV2['assessment']['results'][string]): string {
  return result.practiceSelection?.profileId ?? 'full';
}

function strategyOf(result: StoreV2['assessment']['results'][string]): string {
  return result.practiceSelection?.strategy ?? 'mixed';
}

export function calculateHvpProgress(store: StoreV2): HvpCuratedSummary {
  const built = buildDraftOnlyHvpRegistry();
  if (!built.ok) throw new Error('The current HVP registry could not be built.');
  const registry = built.value;
  const automaticResults: Array<{
    result: StoreV2['assessment']['results'][string];
    report: AssessmentGradingReport;
  }> = [];
  const writtenResults: Array<{
    result: StoreV2['assessment']['results'][string];
    report: AssessmentGradingReport;
  }> = [];
  const integrityIssueCategories: Record<string, number> = {};
  let omittedResultCount = 0;

  Object.values(store.assessment.results).forEach((result) => {
    if (
      result.blueprintId !== HVP_CURATED_BLUEPRINT_ID
      && result.blueprintId !== HVP_WRITTEN_BLUEPRINT_ID
    ) return;
    const parsed = assessmentResultSnapshotSchema.safeParse(result);
    if (!parsed.success) {
      omittedResultCount += 1;
      increment(integrityIssueCategories, 'RESULT_SCHEMA_INVALID');
      return;
    }
    const candidate = parsed.data;
    const validated = validateHvpCuratedResult(candidate, registry);
    if (!validated.ok) {
      omittedResultCount += 1;
      validated.issues.forEach((issue) => increment(integrityIssueCategories, issue.code));
    } else if (candidate.blueprintId === HVP_WRITTEN_BLUEPRINT_ID) {
      writtenResults.push({ result: candidate, report: validated.value.report });
    } else {
      automaticResults.push({ result: candidate, report: validated.value.report });
    }
  });
  automaticResults.sort((a, b) => b.result.submittedAt.localeCompare(a.result.submittedAt));
  writtenResults.sort((a, b) => b.result.submittedAt.localeCompare(a.result.submittedAt));

  const evidenceById = new Map<string, QuestionMasteryEvidence>();
  AUTOMATIC.forEach((question) => {
    const history = store.assessment.questionHistory[question.id];
    const current = history?.version === question.version ? history : undefined;
    evidenceById.set(question.id, {
      questionId: question.id,
      version: question.version,
      sectionId: question.sectionId,
      objectiveId: question.objectiveId,
      format: question.format,
      difficulty: question.difficulty,
      bloomLevel: question.bloomLevel,
      encounterCount: current?.encounterCount ?? 0,
      gradableAttemptCount: 0,
      earnedPoints: 0,
      possiblePoints: 0,
      unansweredCount: current?.unansweredCount ?? 0,
      lastStatus: current?.lastStatus,
      lastActivity: current?.lastEncounteredAt ?? current?.lastAnsweredAt,
      limitedAccuracyEvidence: Boolean(current?.attemptCount),
      mastery: 'unseen',
    });
  });
  const verifiedEncounters = new Map<string, number>();
  const verifiedUnanswered = new Map<string, number>();
  automaticResults.forEach(({ result, report }) => {
    result.orderedQuestionIds.forEach((questionId) => {
      const evidence = evidenceById.get(questionId);
      const grade = report.questionGrades[questionId];
      if (!evidence || !grade) return;
      verifiedEncounters.set(questionId, (verifiedEncounters.get(questionId) ?? 0) + 1);
      const previousActivity = evidence.lastActivity;
      evidence.lastActivity = latest(previousActivity, result.submittedAt);
      if (!previousActivity || evidence.lastActivity === result.submittedAt) {
        evidence.lastStatus = grade.status;
      }
      if (grade.status === 'unanswered') {
        verifiedUnanswered.set(questionId, (verifiedUnanswered.get(questionId) ?? 0) + 1);
      } else if (grade.status !== 'manual_required' && grade.score !== null) {
        evidence.gradableAttemptCount += 1;
        evidence.earnedPoints += grade.score;
        evidence.possiblePoints += grade.maxScore;
      }
    });
  });
  const questions = [...evidenceById.values()].map((evidence) => {
    const next = {
      ...evidence,
      encounterCount: Math.max(evidence.encounterCount, verifiedEncounters.get(evidence.questionId) ?? 0),
      unansweredCount: Math.max(evidence.unansweredCount, verifiedUnanswered.get(evidence.questionId) ?? 0),
      answeredAccuracy: accuracyPercentage(evidence.earnedPoints, evidence.possiblePoints),
      limitedAccuracyEvidence: evidence.limitedAccuracyEvidence && evidence.possiblePoints === 0,
    };
    return { ...next, mastery: questionMastery(next) };
  });
  const group = (
    ids: string[],
    key: (question: QuestionMasteryEvidence) => string,
    labels: Record<string, string>,
  ) => aggregateGroups(
    questions,
    ids.map((id) => ({ id, label: labels[id] ?? id })),
    key,
  );
  const objectives = aggregateGroups(
    questions,
    humanVisualPerceptionCandidateBank.objectives.map((objective) => ({
      id: objective.id,
      label: objective.statement,
    })),
    (question) => question.objectiveId,
  );
  const formats = group(
    Object.keys(FORMAT_LABELS).filter((format) => questions.some(
      (question) => question.format === format && question.encounterCount > 0,
    )),
    (question) => question.format,
    FORMAT_LABELS,
  );
  const totalEarned = questions.reduce((sum, question) => sum + question.earnedPoints, 0);
  const totalPossible = questions.reduce((sum, question) => sum + question.possiblePoints, 0);
  const percentages = automaticResults
    .map(({ report }) => percentage(report))
    .filter((value): value is number => value !== undefined);
  const profileDistribution: Record<string, number> = {};
  const strategyDistribution: Record<string, number> = {};
  automaticResults.forEach(({ result }) => {
    increment(profileDistribution, profileOf(result));
    increment(strategyDistribution, strategyOf(result));
  });
  const compatibleAttempts = Object.values(store.assessment.activeAttempts)
    .filter((attempt) => attempt.blueprintId === HVP_CURATED_BLUEPRINT_ID)
    .flatMap((attempt) => {
      const parsed = assessmentAttemptSnapshotSchema.safeParse(attempt);
      return parsed.success ? [parsed.data] : [];
    })
    .filter((attempt) => validateHvpCuratedAttempt(attempt, registry).ok)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const recentSessions: CompatibleCuratedResult[] = automaticResults.map(({ result, report }) => ({
    resultId: result.id,
    submittedAt: result.submittedAt,
    profile: profileOf(result),
    strategy: strategyOf(result),
    questionCount: result.orderedQuestionIds.length,
    percentage: percentage(report) ?? 0,
  }));
  const masteryDistribution = Object.fromEntries(LEVELS.map((level) => [
    level,
    questions.filter((question) => question.mastery === level).length,
  ])) as Record<MasteryLevel, number>;

  return {
    compatibleScoredResultCount: automaticResults.length,
    omittedResultCount,
    integrityIssueCategories,
    latestPercentage: percentages[0],
    bestPercentage: percentages.length ? Math.max(...percentages) : undefined,
    averageSessionPercentage: percentages.length
      ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
      : undefined,
    weightedAnsweredAccuracy: accuracyPercentage(totalEarned, totalPossible),
    lastSubmittedAt: automaticResults[0]?.result.submittedAt,
    activePractice: compatibleAttempts[0],
    distinctCurrentQuestionsEncountered: questions.filter((question) => question.encounterCount > 0).length,
    eligibleAutomaticQuestionTotal: questions.length,
    coveragePercentage: questions.length
      ? (questions.filter((question) => question.encounterCount > 0).length / questions.length) * 100
      : 0,
    gradableAnsweredEncounters: questions.reduce((sum, question) => sum + question.gradableAttemptCount, 0),
    correctCount: automaticResults.reduce((sum, item) => sum + item.report.correctCount, 0),
    partialCount: automaticResults.reduce((sum, item) => sum + item.report.partialCount, 0),
    incorrectCount: automaticResults.reduce((sum, item) => sum + item.report.incorrectCount, 0),
    unansweredCount: automaticResults.reduce((sum, item) => sum + item.report.unansweredCount, 0),
    profileDistribution,
    strategyDistribution,
    retryMissedAvailable: familyConstrainedCount(
      retryMissedQuestionIds(AUTOMATIC, store.assessment.questionHistory), AUTOMATIC, 2,
    ),
    weakTopicAvailable: familyConstrainedCount(
      weakTopicQuestionIds(AUTOMATIC, store.assessment.questionHistory), AUTOMATIC, 2,
    ),
    unseenAvailable: familyConstrainedCount(
      unseenQuestionIds(AUTOMATIC, store.assessment.questionHistory), AUTOMATIC, 2,
    ),
    writtenSubmissions: writtenResults.length,
    latestWrittenSubmissionAt: writtenResults[0]?.result.submittedAt,
    writtenResponsesSupplied: writtenResults.reduce(
      (sum, item) => sum + item.report.manualRequiredCount, 0,
    ),
    writtenUnansweredPrompts: writtenResults.reduce(
      (sum, item) => sum + item.report.unansweredCount, 0,
    ),
    questions,
    sections: group(Object.keys(SECTION_LABELS), (question) => question.sectionId, SECTION_LABELS),
    objectives,
    formats,
    difficulties: group(
      ['foundation', 'intermediate', 'advanced'],
      (question) => question.difficulty,
      { foundation: 'Foundation', intermediate: 'Intermediate', advanced: 'Advanced' },
    ),
    bloomLevels: group(
      ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      (question) => question.bloomLevel,
      { remember: 'Remember', understand: 'Understand', apply: 'Apply', analyze: 'Analyze', evaluate: 'Evaluate', create: 'Create' },
    ),
    masteryDistribution,
    recentSessions,
  };
}
