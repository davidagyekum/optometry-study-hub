import type {
  CuratedAttemptSelection,
  CuratedPracticeDefinition,
} from '@/lib/assessment/curated/definition';
import { sessionIssue } from '@/lib/assessment/session/errors';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type {
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

export function ownsCuratedBlueprint(
  definition: CuratedPracticeDefinition,
  blueprintId?: string,
): boolean {
  return definition.summary.blueprintIds.includes(blueprintId ?? '');
}

function selectCandidates(
  definition: CuratedPracticeDefinition,
  candidates: CuratedAttemptSelection['candidates'],
  registry: QuestionRegistry,
): CuratedAttemptSelection {
  const snapshots = candidates.map((candidate) => structuredClone(candidate));
  if (!snapshots.length) return { candidates: [], issues: [] };
  const issues = snapshots.length > 1
    ? [sessionIssue(
      'PILOT_MULTIPLE_ACTIVE_ATTEMPTS',
      `Multiple active ${definition.summary.shortTitle} attempts require recovery.`,
    )]
    : [];
  snapshots.forEach((candidate) => {
    const compatible = definition.validateAttempt(candidate, registry);
    if (!compatible.ok) issues.push(...compatible.issues);
  });
  return {
    candidates: snapshots,
    compatibleAttempt: snapshots.length === 1 && !issues.length
      ? snapshots[0]
      : undefined,
    issues,
  };
}

export function selectActiveCuratedAttempt(
  definition: CuratedPracticeDefinition,
  store: StoreV2,
  registry: QuestionRegistry,
): CuratedAttemptSelection {
  return selectCandidates(
    definition,
    Object.values(store.assessment.activeAttempts).filter(
      (attempt) => ownsCuratedBlueprint(definition, attempt.blueprintId),
    ),
    registry,
  );
}

export function selectCuratedAttemptById(
  definition: CuratedPracticeDefinition,
  store: StoreV2,
  registry: QuestionRegistry,
  attemptId: string,
): CuratedAttemptSelection {
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
  if (!ownsCuratedBlueprint(definition, candidate.blueprintId)) {
    return {
      candidates: [],
      issues: [sessionIssue(
        'PILOT_BLUEPRINT_MISMATCH',
        `This assessment does not belong to ${definition.summary.shortTitle}.`,
        { attemptId },
      )],
    };
  }
  return selectCandidates(definition, [candidate], registry);
}

export function selectLatestCuratedResult(
  definition: CuratedPracticeDefinition,
  store: StoreV2,
  registry: QuestionRegistry,
  blueprintId = definition.automaticBlueprintId,
): AssessmentResultSnapshot | undefined {
  return Object.values(store.assessment.results)
    .filter((result) => result.blueprintId === blueprintId)
    .filter((result) => definition.validateResult(result, registry).ok)
    .map((result) => structuredClone(result))
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}
