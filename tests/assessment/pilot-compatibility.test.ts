import { describe, expect, it } from 'vitest';
import {
  AQUEOUS_PILOT_POLICY,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import {
  validateAqueousPilotAttempt,
  validateAqueousPilotResult,
} from '@/lib/assessment/pilot/compatibility';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import type { SessionIssueCode } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';
import {
  makeAttempt,
  makeDraftRegistry,
  makeResult,
} from '@/tests/fixtures/session-engine';

function exactAttempt(): AssessmentAttemptSnapshot {
  return makeAttempt([...AQUEOUS_PILOT_QUESTION_IDS], {
    blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
    gradingPolicy: AQUEOUS_PILOT_POLICY,
    idFactory: () => 'attempt-compatible',
  });
}

function codes(result: ReturnType<typeof validateAqueousPilotAttempt>): SessionIssueCode[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function mutateAttempt(
  update: (attempt: AssessmentAttemptSnapshot) => void,
): AssessmentAttemptSnapshot {
  const attempt = structuredClone(exactAttempt());
  update(attempt);
  return attempt;
}

function mutateResult(
  update: (result: AssessmentResultSnapshot) => void,
): AssessmentResultSnapshot {
  const result = structuredClone(makeResult(exactAttempt()));
  update(result);
  return result;
}

describe('controlled Aqueous pilot compatibility', () => {
  const registry = makeDraftRegistry();

  it('accepts only the exact valid pilot identity', () => {
    const result = validateAqueousPilotAttempt(exactAttempt(), registry);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(new Set(result.value.attempt.orderedQuestionIds))
        .toEqual(new Set(AQUEOUS_PILOT_QUESTION_IDS));
    }
  });

  it.each([
    ['subset', mutateAttempt((attempt) => {
      const removed = attempt.orderedQuestionIds.pop();
      if (removed) {
        delete attempt.questionVersions[removed];
        delete attempt.optionOrder[removed];
      }
    }), 'PILOT_QUESTION_SET_MISMATCH'],
    ['extra', mutateAttempt((attempt) => {
      attempt.orderedQuestionIds.push('extra-pilot-question');
      attempt.questionVersions['extra-pilot-question'] = 1;
    }), 'PILOT_QUESTION_SET_MISMATCH'],
    ['Exam mode', mutateAttempt((attempt) => { attempt.mode = 'exam'; }), 'PILOT_MODE_MISMATCH'],
    ['Mastery mode', mutateAttempt((attempt) => { attempt.mode = 'mastery'; }), 'PILOT_MODE_MISMATCH'],
    ['strict@1', mutateAttempt((attempt) => {
      attempt.gradingPolicy = { id: 'strict', version: 1 };
    }), 'PILOT_POLICY_MISMATCH'],
    ['wrong course', mutateAttempt((attempt) => { attempt.courseId = 'pharmacology'; }), 'PILOT_COURSE_MISMATCH'],
    ['wrong module', mutateAttempt((attempt) => { attempt.moduleId = 'ocular-adnexa'; }), 'PILOT_MODULE_MISMATCH'],
  ] as const)('rejects %s attempts', (_name, attempt, expectedCode) => {
    expect(codes(validateAqueousPilotAttempt(attempt, registry))).toContain(expectedCode);
  });

  it('rejects subset and wrong-policy results while accepting the exact result', () => {
    const exact = makeResult(exactAttempt());
    expect(validateAqueousPilotResult(exact, registry).ok).toBe(true);

    const subset = mutateResult((result) => {
      const removed = result.orderedQuestionIds.pop();
      if (removed) delete result.questionVersions[removed];
    });
    const subsetValidation = validateAqueousPilotResult(subset, registry);
    expect(subsetValidation.ok).toBe(false);
    if (!subsetValidation.ok) {
      expect(subsetValidation.issues.map((issue) => issue.code))
        .toContain('PILOT_QUESTION_SET_MISMATCH');
    }

    const wrongPolicy = mutateResult((result) => {
      result.gradingPolicy = { id: 'strict', version: 1 };
    });
    const policyValidation = validateAqueousPilotResult(wrongPolicy, registry);
    expect(policyValidation.ok).toBe(false);
    if (!policyValidation.ok) {
      expect(policyValidation.issues.map((issue) => issue.code))
        .toContain('PILOT_POLICY_MISMATCH');
    }
  });
});