type RuntimeBank = {
  objectives: Array<{
    id: string;
    targetBloomLevels: string[];
  }>;
  questions: Array<{
    objectiveId: string;
    bloomLevel: string;
  }>;
};

/**
 * Preserve the supplied JSON byte-for-byte while aligning the runtime objective
 * targets with the Bloom levels of their linked questions. The package's final
 * written item in each module uses `create`, while its apply-objective target
 * list stops at `evaluate`; the current session registry requires the link to
 * be explicit.
 */
export function normalizeOpt370RuntimeObjectiveTargets<T extends RuntimeBank>(
  bank: T,
): T {
  const linkedBloomLevels = new Map<string, Set<string>>();
  bank.questions.forEach((question) => {
    const levels = linkedBloomLevels.get(question.objectiveId) ?? new Set<string>();
    levels.add(question.bloomLevel);
    linkedBloomLevels.set(question.objectiveId, levels);
  });
  return {
    ...bank,
    objectives: bank.objectives.map((objective) => ({
      ...objective,
      targetBloomLevels: [
        ...objective.targetBloomLevels,
        ...[...(linkedBloomLevels.get(objective.id) ?? [])]
          .filter((level) => !objective.targetBloomLevels.includes(level)),
      ],
    })),
  } as T;
}
