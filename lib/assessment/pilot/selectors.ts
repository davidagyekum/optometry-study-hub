import {
  AQUEOUS_PILOT_MODULE_ID,
  AQUEOUS_PILOT_POLICY,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';

function sameQuestionSet(ids: readonly string[]): boolean {
  if (ids.length !== AQUEOUS_PILOT_QUESTION_IDS.length) return false;
  const expected = new Set<string>(AQUEOUS_PILOT_QUESTION_IDS);
  return ids.every((id) => expected.has(id));
}

function currentVersionsResolve(
  result: AssessmentResultSnapshot,
  registry: QuestionRegistry,
): boolean {
  return result.orderedQuestionIds.every((questionId) => (
    registry.getEntry(questionId)?.version === result.questionVersions[questionId]
  ));
}

export function selectActiveAqueousPilotAttempt(
  store: StoreV2,
): AssessmentAttemptSnapshot | undefined {
  const attempt = Object.values(store.assessment.activeAttempts).find(
    (candidate) => candidate.blueprintId === AQUEOUS_PILOT_BLUEPRINT_ID,
  );
  return attempt ? structuredClone(attempt) : undefined;
}

export function selectCompatibleAqueousPilotResults(
  store: StoreV2,
  registry: QuestionRegistry,
): AssessmentResultSnapshot[] {
  return Object.values(store.assessment.results)
    .filter((result) => (
      result.moduleId === AQUEOUS_PILOT_MODULE_ID
      && sameQuestionSet(result.orderedQuestionIds)
      && result.gradingPolicy?.id === AQUEOUS_PILOT_POLICY.id
      && result.gradingPolicy.version === AQUEOUS_PILOT_POLICY.version
      && currentVersionsResolve(result, registry)
    ))
    .map((result) => structuredClone(result));
}

export function selectLatestCompatibleAqueousPilotResult(
  store: StoreV2,
  registry: QuestionRegistry,
): AssessmentResultSnapshot | undefined {
  return selectCompatibleAqueousPilotResults(store, registry)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}
