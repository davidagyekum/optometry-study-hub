import {
  validateHvpCuratedAttempt,
  validateHvpCuratedResult,
} from '@/lib/assessment/hvp/compatibility';
import {
  HVP_CURATED_BLUEPRINT_ID,
} from '@/lib/assessment/hvp/config';
import {
  HVP_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { sessionIssue } from '@/lib/assessment/session/errors';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionIssue } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

export type HvpAttemptSelection = {
  candidates: AssessmentAttemptSnapshot[];
  compatibleAttempt?: AssessmentAttemptSnapshot;
  issues: SessionIssue[];
};

export function isHvpPracticeBlueprintId(id?: string): boolean {
  return id === HVP_CURATED_BLUEPRINT_ID || id === HVP_WRITTEN_BLUEPRINT_ID;
}

function selectCandidates(
  candidates: AssessmentAttemptSnapshot[],
  registry: QuestionRegistry,
): HvpAttemptSelection {
  const snapshots = candidates.map((candidate) => structuredClone(candidate));
  if (!snapshots.length) return { candidates: [], issues: [] };
  const issues: SessionIssue[] = [];
  if (snapshots.length > 1) {
    issues.push(sessionIssue('PILOT_MULTIPLE_ACTIVE_ATTEMPTS', 'Multiple active Human Visual Perception practice attempts require recovery.'));
  }
  snapshots.forEach((candidate) => {
    const compatible = validateHvpCuratedAttempt(candidate, registry);
    if (!compatible.ok) issues.push(...compatible.issues);
  });
  return {
    candidates: snapshots,
    compatibleAttempt: snapshots.length === 1 && !issues.length ? snapshots[0] : undefined,
    issues,
  };
}

export function selectActiveHvpAttempt(
  store: StoreV2,
  registry: QuestionRegistry,
): HvpAttemptSelection {
  return selectCandidates(
    Object.values(store.assessment.activeAttempts).filter(
      (attempt) => isHvpPracticeBlueprintId(attempt.blueprintId),
    ),
    registry,
  );
}

export function selectHvpAttemptById(
  store: StoreV2,
  registry: QuestionRegistry,
  attemptId: string,
): HvpAttemptSelection {
  const candidate = store.assessment.activeAttempts[attemptId];
  if (!candidate) return { candidates: [], issues: [sessionIssue('ATTEMPT_NOT_FOUND', `Assessment attempt "${attemptId}" was not found.`, { attemptId })] };
  if (!isHvpPracticeBlueprintId(candidate.blueprintId)) {
    return { candidates: [], issues: [sessionIssue('PILOT_BLUEPRINT_MISMATCH', 'This assessment does not belong to OPT 374 practice.', { attemptId })] };
  }
  return selectCandidates([candidate], registry);
}

export function selectLatestCompatibleHvpResult(
  store: StoreV2,
  registry: QuestionRegistry,
  blueprintId = HVP_CURATED_BLUEPRINT_ID,
): AssessmentResultSnapshot | undefined {
  return Object.values(store.assessment.results)
    .filter((result) => result.blueprintId === blueprintId)
    .filter((result) => validateHvpCuratedResult(result, registry).ok)
    .map((result) => structuredClone(result))
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}
