import type { PracticeSelectionSnapshot } from '@/lib/assessment/practice/types';

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function evidencePayload(
  selection: Omit<PracticeSelectionSnapshot, 'strategyEvidenceHash'>,
): string {
  return JSON.stringify({
    blueprintId: selection.blueprintId,
    practiceFamilyId: selection.practiceFamilyId,
    profileId: selection.profileId,
    strategy: selection.strategy,
    requestedCount: selection.requestedCount,
    sectionIds: [...selection.sectionIds].sort(),
    formats: [...selection.formats].sort(),
    difficulties: [...selection.difficulties].sort(),
    seed: selection.seed,
    resultMode: selection.resultMode,
    historyPolicy: selection.historyPolicy,
    strategyEligibleQuestionIds: [
      ...(selection.strategyEligibleQuestionIds ?? []),
    ].sort(),
  });
}

export function strategyEvidenceHash(
  selection: Omit<PracticeSelectionSnapshot, 'strategyEvidenceHash'>,
): string {
  return stableHash(evidencePayload(selection));
}

export function withStrategyEvidence(
  selection: PracticeSelectionSnapshot,
  eligibleQuestionIds: readonly string[],
): PracticeSelectionSnapshot {
  const candidate = {
    ...structuredClone(selection),
    strategyEligibleQuestionIds: [...new Set(eligibleQuestionIds)].sort(),
    strategyEvidenceHash: undefined,
  };
  delete candidate.strategyEvidenceHash;
  return {
    ...candidate,
    strategyEvidenceHash: strategyEvidenceHash(candidate),
  };
}

export function hasValidStrategyEvidence(
  selection: PracticeSelectionSnapshot,
): boolean {
  if (!selection.strategyEligibleQuestionIds || !selection.strategyEvidenceHash) {
    return false;
  }
  const candidate = { ...structuredClone(selection), strategyEvidenceHash: undefined };
  delete candidate.strategyEvidenceHash;
  return selection.strategyEvidenceHash === strategyEvidenceHash(candidate);
}
