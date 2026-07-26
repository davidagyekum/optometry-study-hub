import { aqueousVitreousPilotBank } from '@/content/question-bank/pilot/bank';
import type {
  AssessmentQuestion,
  QuestionBank,
} from '@/lib/assessment/types';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

export const PILOT_COURSE_ID = 'neuro-anatomy';
export const PILOT_MODULE_ID = 'aqueous-vitreous';
export const FIXED_NOW = new Date('2026-07-26T09:00:00.000Z');

export function makePilotBank(): QuestionBank {
  return structuredClone(aqueousVitreousPilotBank);
}

export function makeApprovedPilotBank(): QuestionBank {
  const bank = makePilotBank();
  bank.id = 'aqueous-vitreous-approved';
  bank.questions.forEach((question) => {
    question.reviewStatus = 'approved';
    question.reviewer = 'Independent pilot reviewer';
  });
  return bank;
}

export function makeDraftRegistry(): QuestionRegistry {
  const built = buildQuestionRegistry({
    banks: [makePilotBank()],
    allowedReviewStatuses: ['draft'],
  });
  if (!built.ok) {
    throw new Error(`Draft registry failed: ${built.issues.map((issue) => issue.code).join(', ')}`);
  }
  return built.value;
}

export function fixedRandom(values: number[] = [0.1, 0.8, 0.3, 0.6]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

export function makeAttempt(
  questionIds?: string[],
  overrides: Partial<Parameters<typeof createAssessmentAttempt>[0]> = {},
): AssessmentAttemptSnapshot {
  const registry = overrides.registry ?? makeDraftRegistry();
  const ids = questionIds ?? registry.questionIds();
  const created = createAssessmentAttempt({
    registry,
    questionIds: ids,
    mode: 'study',
    courseId: PILOT_COURSE_ID,
    moduleId: PILOT_MODULE_ID,
    allowedReviewStatuses: ['draft'],
    random: fixedRandom(),
    now: () => FIXED_NOW,
    idFactory: () => 'attempt-fixed',
    ...overrides,
  });
  if (!created.ok) {
    throw new Error(`Attempt creation failed: ${created.issues.map((issue) => issue.code).join(', ')}`);
  }
  return created.value;
}

export function questionByFormat<TFormat extends AssessmentQuestion['format']>(
  format: TFormat,
): Extract<AssessmentQuestion, { format: TFormat }> {
  const question = makePilotBank().questions.find((item) => item.format === format);
  if (!question) throw new Error(`Missing pilot question format: ${format}`);
  return question as Extract<AssessmentQuestion, { format: TFormat }>;
}

export function makeResult(
  attempt: AssessmentAttemptSnapshot = makeAttempt(),
): AssessmentResultSnapshot {
  return {
    id: 'result-fixed',
    attemptId: attempt.id,
    courseId: attempt.courseId,
    moduleId: attempt.moduleId,
    ...(attempt.gradingPolicy
      ? { gradingPolicy: structuredClone(attempt.gradingPolicy) }
      : {}),
    submittedAt: '2026-07-26T09:30:00.000Z',
    orderedQuestionIds: [...attempt.orderedQuestionIds],
    questionVersions: { ...attempt.questionVersions },
    responses: structuredClone(attempt.responses),
    score: null,
    maxScore: null,
  };
}
