import type { CuratedPracticeDefinition } from '@/lib/assessment/curated/definition';
import { selectActiveCuratedAttempt } from '@/lib/assessment/curated/selectors';
import {
  familyConstrainedCount,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
} from '@/lib/assessment/practice/history';
import type { AssessmentGradingReport } from '@/lib/assessment/grading/types';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';
import type { QuestionBank } from '@/lib/assessment/types';
import { sortProgressActivity } from '@/lib/progress/activity';
import { accuracyPercentage, groupMastery, questionMastery } from '@/lib/progress/mastery';
import type {
  CompatibleCuratedResult,
  CuratedMasterySummary,
  HvpActiveSession,
  MasteryEvidence,
  MasteryGroup,
  MasteryLevel,
  ProgressActivity,
  QuestionMasteryEvidence,
  WrittenPracticeSession,
} from '@/lib/progress/types';
import {
  assessmentResultSnapshotSchema,
  type AssessmentResultSnapshot,
  type StoreV2,
} from '@/lib/storage/schemas';

const LEVELS: MasteryLevel[] = [
  'unseen',
  'learning',
  'developing',
  'proficient',
  'mastered',
];
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

export type CuratedMasteryEngineConfig = {
  bank: QuestionBank;
  definition: CuratedPracticeDefinition;
  registryBuilder: () => SessionResult<QuestionRegistry>;
  sectionLabels: Readonly<Record<string, string>>;
  maximumFamilyRepetition: number;
};

export type CuratedMasteryProgressResult =
  | { ok: true; summary: CuratedMasterySummary }
  | {
    ok: false;
    issues: Array<{ code: 'CURATED_REGISTRY_UNAVAILABLE'; message: string }>;
  };

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

function latest(left?: string, right?: string): string | undefined {
  if (!left) return right;
  if (!right) return left;
  return left.localeCompare(right) >= 0 ? left : right;
}

function percentage(report: AssessmentGradingReport): number | undefined {
  const { score, maxScore } = report;
  return score !== null
    && maxScore !== null
    && Number.isFinite(score)
    && Number.isFinite(maxScore)
    && maxScore > 0
    ? (score / maxScore) * 100
    : undefined;
}

function aggregateGroups(
  questions: QuestionMasteryEvidence[],
  definitions: Array<{ id: string; label: string }>,
  key: (question: QuestionMasteryEvidence) => string,
): MasteryGroup[] {
  return definitions.map(({ id, label }) => {
    const members = questions.filter((question) => key(question) === id);
    const earnedPoints = members.reduce(
      (sum, question) => sum + question.earnedPoints,
      0,
    );
    const possiblePoints = members.reduce(
      (sum, question) => sum + question.possiblePoints,
      0,
    );
    const encountered = members.filter(
      (question) => question.encounterCount > 0,
    );
    const evidence: MasteryEvidence = {
      eligibleQuestionCount: members.length,
      distinctQuestionsEncountered: encountered.length,
      distinctGradableQuestions: members.filter(
        (question) => question.gradableAttemptCount > 0,
      ).length,
      coveragePercentage: members.length
        ? (encountered.length / members.length) * 100
        : 0,
      gradableEncounterCount: members.reduce(
        (sum, question) => sum + question.gradableAttemptCount,
        0,
      ),
      earnedPoints,
      possiblePoints,
      answeredAccuracy: accuracyPercentage(earnedPoints, possiblePoints),
      recentMissCount: members.filter(
        (question) => (
          question.lastStatus === 'incorrect'
          || question.lastStatus === 'partial'
        ),
      ).length,
      lastActivity: members.reduce<string | undefined>(
        (value, question) => latest(value, question.lastActivity),
        undefined,
      ),
    };
    return { id, label, ...evidence, mastery: groupMastery(evidence) };
  });
}

function profileOf(result: AssessmentResultSnapshot): string {
  return result.practiceSelection?.profileId ?? 'full';
}

function strategyOf(result: AssessmentResultSnapshot): string {
  return result.practiceSelection?.strategy ?? 'mixed';
}

function activeSession(
  config: CuratedMasteryEngineConfig,
  store: StoreV2,
  registry: QuestionRegistry,
): HvpActiveSession {
  const selection = selectActiveCuratedAttempt(
    config.definition,
    store,
    registry,
  );
  if (!selection.candidates.length) return { state: 'none' };
  if (!selection.compatibleAttempt || selection.issues.length) {
    return {
      state: 'recovery-required',
      candidateCount: selection.candidates.length,
      issueCodes: [...new Set(selection.issues.map((issue) => issue.code))]
        .sort(),
    };
  }
  const attempt = selection.compatibleAttempt;
  return {
    state: attempt.blueprintId === config.definition.writtenBlueprintId
      ? 'written-practice'
      : 'scored-practice',
    attemptId: attempt.id,
    attempt,
  };
}

export function calculateCuratedMasteryProgress(
  config: CuratedMasteryEngineConfig,
  store: StoreV2,
): CuratedMasteryProgressResult {
  const built = config.registryBuilder();
  if (!built.ok) {
    return {
      ok: false,
      issues: [{
        code: 'CURATED_REGISTRY_UNAVAILABLE',
        message:
          'Curated analytics are temporarily unavailable because the question registry could not be built.',
      }],
    };
  }
  const registry = built.value;
  const automaticQuestions = config.bank.questions.filter(
    (question) => question.format !== 'open_response',
  );
  const automaticResults: Array<{
    result: AssessmentResultSnapshot;
    report: AssessmentGradingReport;
  }> = [];
  const writtenResults: Array<{
    result: AssessmentResultSnapshot;
    report: AssessmentGradingReport;
  }> = [];
  const integrityIssueCategories: Record<string, number> = {};
  let omittedResultCount = 0;

  Object.values(store.assessment.results).forEach((result) => {
    if (!config.definition.summary.blueprintIds.includes(
      result.blueprintId ?? '',
    )) return;
    const parsed = assessmentResultSnapshotSchema.safeParse(result);
    if (!parsed.success) {
      omittedResultCount += 1;
      increment(integrityIssueCategories, 'RESULT_SCHEMA_INVALID');
      return;
    }
    const validated = config.definition.validateResult(parsed.data, registry);
    if (!validated.ok) {
      omittedResultCount += 1;
      validated.issues.forEach(
        (issue) => increment(integrityIssueCategories, issue.code),
      );
      return;
    }
    const report = (validated.value as {
      report: AssessmentGradingReport;
    }).report;
    if (parsed.data.blueprintId === config.definition.writtenBlueprintId) {
      writtenResults.push({ result: parsed.data, report });
    } else {
      automaticResults.push({ result: parsed.data, report });
    }
  });
  const newestFirst = (
    left: { result: AssessmentResultSnapshot },
    right: { result: AssessmentResultSnapshot },
  ) => (
    right.result.submittedAt.localeCompare(left.result.submittedAt)
    || left.result.id.localeCompare(right.result.id)
  );
  automaticResults.sort(newestFirst);
  writtenResults.sort(newestFirst);

  const evidenceById = new Map<string, QuestionMasteryEvidence>();
  automaticQuestions.forEach((question) => {
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
      verifiedEncounters.set(
        questionId,
        (verifiedEncounters.get(questionId) ?? 0) + 1,
      );
      const previousActivity = evidence.lastActivity;
      evidence.lastActivity = latest(previousActivity, result.submittedAt);
      if (!previousActivity || evidence.lastActivity === result.submittedAt) {
        evidence.lastStatus = grade.status;
      }
      if (grade.status === 'unanswered') {
        verifiedUnanswered.set(
          questionId,
          (verifiedUnanswered.get(questionId) ?? 0) + 1,
        );
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
      encounterCount: Math.max(
        evidence.encounterCount,
        verifiedEncounters.get(evidence.questionId) ?? 0,
      ),
      unansweredCount: Math.max(
        evidence.unansweredCount,
        verifiedUnanswered.get(evidence.questionId) ?? 0,
      ),
      answeredAccuracy: accuracyPercentage(
        evidence.earnedPoints,
        evidence.possiblePoints,
      ),
      limitedAccuracyEvidence:
        evidence.limitedAccuracyEvidence && evidence.possiblePoints === 0,
    };
    return { ...next, mastery: questionMastery(next) };
  });
  const group = (
    ids: string[],
    key: (question: QuestionMasteryEvidence) => string,
    labels: Readonly<Record<string, string>>,
  ) => aggregateGroups(
    questions,
    ids.map((id) => ({ id, label: labels[id] ?? id })),
    key,
  );
  const objectives = aggregateGroups(
    questions,
    config.bank.objectives.map((objective) => ({
      id: objective.id,
      label: objective.statement,
    })),
    (question) => question.objectiveId,
  );
  const formats = group(
    Object.keys(FORMAT_LABELS).filter((format) => questions.some(
      (question) => (
        question.format === format && question.encounterCount > 0
      ),
    )),
    (question) => question.format,
    FORMAT_LABELS,
  );
  const totalEarned = questions.reduce(
    (sum, question) => sum + question.earnedPoints,
    0,
  );
  const totalPossible = questions.reduce(
    (sum, question) => sum + question.possiblePoints,
    0,
  );
  const percentages = automaticResults
    .map(({ report }) => percentage(report))
    .filter((value): value is number => value !== undefined);
  const profileDistribution: Record<string, number> = {};
  const strategyDistribution: Record<string, number> = {};
  automaticResults.forEach(({ result }) => {
    increment(profileDistribution, profileOf(result));
    increment(strategyDistribution, strategyOf(result));
  });
  const currentSession = activeSession(config, store, registry);
  const recentSessions: CompatibleCuratedResult[] = automaticResults.map(
    ({ result, report }) => ({
      resultId: result.id,
      submittedAt: result.submittedAt,
      profile: profileOf(result),
      strategy: strategyOf(result),
      questionCount: result.orderedQuestionIds.length,
      percentage: percentage(report) ?? 0,
    }),
  );
  const writtenSessions: WrittenPracticeSession[] = writtenResults.map(
    ({ result, report }) => ({
      resultId: result.id,
      submittedAt: result.submittedAt,
      responsesSupplied: report.manualRequiredCount,
      unansweredPrompts: report.unansweredCount,
    }),
  );
  const masteryDistribution = Object.fromEntries(LEVELS.map((level) => [
    level,
    questions.filter((question) => question.mastery === level).length,
  ])) as Record<MasteryLevel, number>;
  const recentActivity: ProgressActivity[] = [];
  if (
    currentSession.state === 'scored-practice'
    || currentSession.state === 'written-practice'
  ) {
    const written = currentSession.state === 'written-practice';
    recentActivity.push({
      id: `${written ? 'written' : 'curated'}-started:${currentSession.attemptId}`,
      kind: written ? 'written-started' : 'curated-started',
      moduleId: config.definition.summary.moduleId,
      timestamp: currentSession.attempt.startedAt,
      label: written
        ? 'Written practice started'
        : 'Curated practice started',
      detail: written
        ? 'Not scored'
        : `${currentSession.attempt.orderedQuestionIds.length} questions`,
      actionLabel: 'Resume practice',
      destination: {
        view: 'assessment',
        moduleId: currentSession.attemptId,
      },
    });
  }
  automaticResults.forEach(({ result, report }) => {
    recentActivity.push({
      id: `curated-completed:${result.id}`,
      kind: 'curated-completed',
      moduleId: config.definition.summary.moduleId,
      timestamp: result.submittedAt,
      label: 'Curated practice completed',
      detail: `${result.orderedQuestionIds.length} questions`,
      scorePercentage: percentage(report),
      actionLabel: 'Review exact result',
      destination: { view: 'assessment-result', moduleId: result.id },
    });
  });
  writtenSessions.forEach((session) => {
    recentActivity.push({
      id: `written-completed:${session.resultId}`,
      kind: 'written-completed',
      moduleId: config.definition.summary.moduleId,
      timestamp: session.submittedAt,
      label: 'Written practice completed',
      detail: 'Not scored',
      actionLabel: 'Review exact result',
      destination: {
        view: 'assessment-result',
        moduleId: session.resultId,
      },
    });
  });

  const encounteredCount = questions.filter(
    (question) => question.encounterCount > 0,
  ).length;
  const available = (ids: string[]) => familyConstrainedCount(
    ids,
    automaticQuestions,
    config.maximumFamilyRepetition,
  );
  return {
    ok: true,
    summary: {
      compatibleScoredResultCount: automaticResults.length,
      omittedResultCount,
      integrityIssueCategories,
      latestPercentage: percentages[0],
      bestPercentage: percentages.length
        ? Math.max(...percentages)
        : undefined,
      averageSessionPercentage: percentages.length
        ? percentages.reduce((sum, value) => sum + value, 0)
          / percentages.length
        : undefined,
      weightedAnsweredAccuracy: accuracyPercentage(
        totalEarned,
        totalPossible,
      ),
      lastSubmittedAt: automaticResults[0]?.result.submittedAt,
      activeSession: currentSession,
      distinctCurrentQuestionsEncountered: encounteredCount,
      eligibleAutomaticQuestionTotal: questions.length,
      coveragePercentage: questions.length
        ? (encounteredCount / questions.length) * 100
        : 0,
      gradableAnsweredEncounters: questions.reduce(
        (sum, question) => sum + question.gradableAttemptCount,
        0,
      ),
      correctCount: automaticResults.reduce(
        (sum, item) => sum + item.report.correctCount,
        0,
      ),
      partialCount: automaticResults.reduce(
        (sum, item) => sum + item.report.partialCount,
        0,
      ),
      incorrectCount: automaticResults.reduce(
        (sum, item) => sum + item.report.incorrectCount,
        0,
      ),
      unansweredCount: automaticResults.reduce(
        (sum, item) => sum + item.report.unansweredCount,
        0,
      ),
      profileDistribution,
      strategyDistribution,
      retryMissedAvailable: available(retryMissedQuestionIds(
        automaticQuestions,
        store.assessment.questionHistory,
      )),
      weakTopicAvailable: available(weakTopicQuestionIds(
        automaticQuestions,
        store.assessment.questionHistory,
      )),
      unseenAvailable: available(unseenQuestionIds(
        automaticQuestions,
        store.assessment.questionHistory,
      )),
      writtenSubmissions: writtenResults.length,
      latestWrittenSubmissionAt: writtenResults[0]?.result.submittedAt,
      writtenResponsesSupplied: writtenResults.reduce(
        (sum, item) => sum + item.report.manualRequiredCount,
        0,
      ),
      writtenUnansweredPrompts: writtenResults.reduce(
        (sum, item) => sum + item.report.unansweredCount,
        0,
      ),
      writtenSessions,
      questions,
      sections: group(
        Object.keys(config.sectionLabels),
        (question) => question.sectionId,
        config.sectionLabels,
      ),
      objectives,
      formats,
      difficulties: group(
        ['foundation', 'intermediate', 'advanced'],
        (question) => question.difficulty,
        {
          foundation: 'Foundation',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
        },
      ),
      bloomLevels: group(
        ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
        (question) => question.bloomLevel,
        {
          remember: 'Remember',
          understand: 'Understand',
          apply: 'Apply',
          analyze: 'Analyze',
          evaluate: 'Evaluate',
          create: 'Create',
        },
      ),
      masteryDistribution,
      recentSessions,
      recentActivity: sortProgressActivity(recentActivity),
    },
  };
}
