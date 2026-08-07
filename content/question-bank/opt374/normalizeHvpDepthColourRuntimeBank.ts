type BankLike = {
  objectives?: Array<{
    id: string;
    targetBloomLevels: string[];
  }>;
  questions?: Array<{
    id?: string;
    objectiveId?: string;
    bloomLevel?: string;
    format?: string;
    options?: Array<{ id: string; text: string }>;
    choices?: Array<{ id: string; text: string }>;
    reuseChoices?: boolean;
    regions?: Array<{
      marker: string;
      interactionLabel: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    targets?: Array<{
      x: number;
      y: number;
    }>;
  }>;
};

const sourceSupportedDistractors: Readonly<Record<string, { id: string; text: string }>> = {
  'hvp-depth-em-006': { id: 'binocular-far', text: 'binocular far' },
  'hvp-depth-em-007': { id: 'chromostereopsis', text: 'chromostereopsis prompt' },
  'hvp-colour-em-001': { id: 'colour-constancy', text: 'colour constancy' },
  'hvp-colour-em-002': { id: 'wavelength-discrimination', text: 'wavelength discrimination' },
  'hvp-colour-em-005': { id: 'colour-constancy', text: 'colour constancy' },
  'hvp-colour-em-006': { id: 'source-contradicted', text: 'contradicted by the source' },
  'hvp-colour-em-007': { id: 'light-intensity', text: 'light intensity' },
};

function percentageCoordinate(value: number): number {
  return value > 1 ? value / 100 : value;
}

/**
 * Preserve the supplied JSON byte-for-byte while adapting three package
 * conventions to the existing runtime contract: objective Bloom targets must
 * include linked questions, image coordinates must be normalized from percent
 * to 0-1, and hotspot interaction labels must not reveal answer labels. The
 * package also permits three-option extended matching and one duplicated
 * reusable matching choice, so the seven affected
 * extended-matching items receive one lecture-grounded distractor.
 */
export function normalizeHvpDepthColourRuntimeBank<T>(bank: T): T {
  const normalized = structuredClone(bank) as T & BankLike;
  const linkedBloomLevels = new Map<string, Set<string>>();

  for (const question of normalized.questions ?? []) {
    if (question.objectiveId && question.bloomLevel) {
      const levels = linkedBloomLevels.get(question.objectiveId) ?? new Set<string>();
      levels.add(question.bloomLevel);
      linkedBloomLevels.set(question.objectiveId, levels);
    }

    if (question.format === 'extended_matching' && question.options?.length === 3) {
      const distractor = question.id
        ? sourceSupportedDistractors[question.id]
        : undefined;
      if (!distractor) {
        throw new Error(
          'Missing HVP extended-matching compatibility option for ' + question.id + '.',
        );
      }
      question.options.push({ ...distractor });
    }

    if (question.format === 'matching' && question.choices) {
      const uniqueChoices = new Map(
        question.choices.map((choice) => [choice.id, choice]),
      );
      if (uniqueChoices.size !== question.choices.length) {
        question.choices = [...uniqueChoices.values()];
        question.reuseChoices = true;
      }
    }
    if (question.format === 'image_hotspot') {
      question.regions?.forEach((region) => {
        region.interactionLabel = 'Region ' + region.marker;
        region.x = percentageCoordinate(region.x);
        region.y = percentageCoordinate(region.y);
        region.width = percentageCoordinate(region.width);
        region.height = percentageCoordinate(region.height);
      });
    }

    if (question.format === 'image_label') {
      question.targets?.forEach((target) => {
        target.x = percentageCoordinate(target.x);
        target.y = percentageCoordinate(target.y);
      });
    }
  }

  normalized.objectives = normalized.objectives?.map((objective) => ({
    ...objective,
    targetBloomLevels: [
      ...objective.targetBloomLevels,
      ...[...(linkedBloomLevels.get(objective.id) ?? [])]
        .filter((level) => !objective.targetBloomLevels.includes(level)),
    ],
  }));

  return normalized;
}