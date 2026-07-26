import {
  validateAqueousPilotAttempt,
  validateAqueousPilotResult,
} from '@/lib/assessment/pilot/compatibility';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import { sessionIssue } from '@/lib/assessment/session/errors';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionIssue } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

export type AqueousPilotAttemptSelection = {
  candidates: AssessmentAttemptSnapshot[];
  compatibleAttempt?: AssessmentAttemptSnapshot;
  issues: SessionIssue[];
};

function selectCandidates(
  candidates: AssessmentAttemptSnapshot[],
  registry: QuestionRegistry,
): AqueousPilotAttemptSelection {
  const snapshots = candidates.map((candidate) => structuredClone(candidate));
  if (snapshots.length === 0) return { candidates: [], issues: [] };

  const issues: SessionIssue[] = [];
  if (snapshots.length > 1) {
    issues.push(sessionIssue(
      'PILOT_MULTIPLE_ACTIVE_ATTEMPTS',
      'Multiple active aqueous and vitreous pilot attempts require recovery.',
    ));
  }
  for (const candidate of snapshots) {
    const compatible = validateAqueousPilotAttempt(candidate, registry);
    if (!compatible.ok) issues.push(...compatible.issues);
  }

  return {
    candidates: snapshots,
    compatibleAttempt: snapshots.length === 1 && issues.length === 0
      ? snapshots[0]
      : undefined,
    issues,
  };
}

export function selectActiveAqueousPilotAttempt(
  store: StoreV2,
  registry: QuestionRegistry,
): AqueousPilotAttemptSelection {
  return selectCandidates(
    Object.values(store.assessment.activeAttempts).filter(
      (candidate) => candidate.blueprintId === AQUEOUS_PILOT_BLUEPRINT_ID,
    ),
    registry,
  );
}

export function selectAqueousPilotAttemptById(
  store: StoreV2,
  registry: QuestionRegistry,
  attemptId: string,
): AqueousPilotAttemptSelection {
  const candidate = store.assessment.activeAttempts[attemptId];
  if (!candidate) {
    return {
      candidates: [],
      issues: [sessionIssue(
        'ATTEMPT_NOT_FOUND',
        `Assessment attempt "${attemptId}" was not found.`,
        { attemptId },
      )],
    };
  }
  if (candidate.blueprintId !== AQUEOUS_PILOT_BLUEPRINT_ID) {
    return {
      candidates: [],
      issues: [sessionIssue(
        'PILOT_BLUEPRINT_MISMATCH',
        'This assessment does not belong to the aqueous and vitreous pilot.',
        { attemptId },
      )],
    };
  }
  return selectCandidates([candidate], registry);
}

export function selectCompatibleAqueousPilotResults(
  store: StoreV2,
  registry: QuestionRegistry,
): AssessmentResultSnapshot[] {
  return Object.values(store.assessment.results)
    .filter((result) => validateAqueousPilotResult(result, registry).ok)
    .map((result) => structuredClone(result));
}

export function selectLatestCompatibleAqueousPilotResult(
  store: StoreV2,
  registry: QuestionRegistry,
): AssessmentResultSnapshot | undefined {
  return selectCompatibleAqueousPilotResults(store, registry)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}
