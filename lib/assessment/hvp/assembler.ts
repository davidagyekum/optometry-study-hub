import type {
  AssessmentQuestion,
  Difficulty,
  QuestionFormat,
} from '@/lib/assessment/types';

export const HVP_SECTION_FORMAT_ALLOCATION = {
  'hvp-foundations': {
    single_best_answer: 3,
    multiple_response: 1,
    matching: 1,
    extended_matching: 0,
    ordering: 0,
    image_hotspot: 0,
    image_label: 0,
    short_answer: 1,
  },
  'hvp-retina': {
    single_best_answer: 10,
    multiple_response: 4,
    matching: 1,
    extended_matching: 1,
    ordering: 1,
    image_hotspot: 1,
    image_label: 1,
    short_answer: 1,
  },
  'hvp-lgn': {
    single_best_answer: 9,
    multiple_response: 2,
    matching: 1,
    extended_matching: 1,
    ordering: 1,
    image_hotspot: 0,
    image_label: 0,
    short_answer: 0,
  },
  'hvp-extrastriate': {
    single_best_answer: 8,
    multiple_response: 1,
    matching: 1,
    extended_matching: 0,
    ordering: 0,
    image_hotspot: 0,
    image_label: 0,
    short_answer: 0,
  },
} as const;

export const HVP_PRACTICE_SECTION_TARGETS = {
  'hvp-foundations': 6,
  'hvp-retina': 20,
  'hvp-lgn': 14,
  'hvp-extrastriate': 10,
} as const;

export const HVP_PRACTICE_FORMAT_TARGETS = {
  single_best_answer: 30,
  multiple_response: 8,
  matching: 4,
  extended_matching: 2,
  ordering: 2,
  image_hotspot: 1,
  image_label: 1,
  short_answer: 2,
} as const;

export const HVP_PRACTICE_DIFFICULTY_TARGETS = {
  foundation: 14,
  intermediate: 26,
  advanced: 10,
} as const;

const DIFFICULTIES: Difficulty[] = ['foundation', 'intermediate', 'advanced'];
const HIGHER_ORDER = new Set(['apply', 'analyze', 'evaluate', 'create']);

type ScoredFormat = keyof typeof HVP_PRACTICE_FORMAT_TARGETS;
type SectionId = keyof typeof HVP_SECTION_FORMAT_ALLOCATION;
type Cell = { sectionId: SectionId; format: ScoredFormat; quota: number };
type DifficultyCounts = Record<Difficulty, number>;

export type HvpAssemblyIssue = {
  code:
    | 'HVP_CELL_UNAVAILABLE'
    | 'HVP_DIFFICULTY_UNSATISFIABLE'
    | 'HVP_HIGHER_ORDER_UNSATISFIABLE'
    | 'HVP_FAMILY_LIMIT_UNSATISFIABLE';
  message: string;
  sectionId?: string;
  format?: QuestionFormat;
};

export type HvpPracticeAssembly = {
  questions: AssessmentQuestion[];
  questionIds: string[];
  difficultyCounts: DifficultyCounts;
  difficultyDeviation: number;
  usedDifficultyRelaxation: boolean;
  higherOrderCount: number;
};

export type HvpAssemblyResult =
  | { ok: true; value: HvpPracticeAssembly }
  | { ok: false; issues: HvpAssemblyIssue[] };

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createHvpSeededRandom(seed: string | number): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function cells(): Cell[] {
  return Object.entries(HVP_SECTION_FORMAT_ALLOCATION).flatMap(
    ([sectionId, formats]) => Object.entries(formats)
      .filter(([, quota]) => quota > 0)
      .map(([format, quota]) => ({
        sectionId: sectionId as SectionId,
        format: format as ScoredFormat,
        quota,
      })),
  );
}

function emptyDifficultyCounts(): DifficultyCounts {
  return { foundation: 0, intermediate: 0, advanced: 0 };
}

function difficultyTargetsByRelaxation(): DifficultyCounts[] {
  const exact = { ...HVP_PRACTICE_DIFFICULTY_TARGETS };
  const alternatives: Array<DifficultyCounts & { deviation: number }> = [];
  for (let foundation = 0; foundation <= 50; foundation += 1) {
    for (let intermediate = 0; intermediate <= 50 - foundation; intermediate += 1) {
      const advanced = 50 - foundation - intermediate;
      alternatives.push({
        foundation,
        intermediate,
        advanced,
        deviation: Math.abs(foundation - exact.foundation)
          + Math.abs(intermediate - exact.intermediate)
          + Math.abs(advanced - exact.advanced),
      });
    }
  }
  return alternatives
    .sort((left, right) => left.deviation - right.deviation
      || left.foundation - right.foundation
      || left.intermediate - right.intermediate)
    .map(({ foundation, intermediate, advanced }) => ({
      foundation,
      intermediate,
      advanced,
    }));
}

function allocationsForCell(
  cell: Cell,
  candidates: AssessmentQuestion[],
  random: () => number,
): DifficultyCounts[] {
  const availability = emptyDifficultyCounts();
  candidates.forEach((question) => {
    availability[question.difficulty] += 1;
  });
  const allocations: DifficultyCounts[] = [];
  for (let foundation = 0; foundation <= cell.quota; foundation += 1) {
    for (
      let intermediate = 0;
      intermediate <= cell.quota - foundation;
      intermediate += 1
    ) {
      const advanced = cell.quota - foundation - intermediate;
      if (
        foundation <= availability.foundation
        && intermediate <= availability.intermediate
        && advanced <= availability.advanced
      ) {
        allocations.push({ foundation, intermediate, advanced });
      }
    }
  }
  return shuffle(allocations, random);
}

function allocationHigherOrderCapacity(
  allocation: DifficultyCounts,
  candidates: AssessmentQuestion[],
): number {
  return DIFFICULTIES.reduce((total, difficulty) => {
    const higherAvailable = candidates.filter(
      (question) => question.difficulty === difficulty
        && HIGHER_ORDER.has(question.bloomLevel),
    ).length;
    return total + Math.min(allocation[difficulty], higherAvailable);
  }, 0);
}

function findDifficultyAllocation(
  cellList: Cell[],
  candidatesByCell: AssessmentQuestion[][],
  target: DifficultyCounts,
  random: () => number,
): DifficultyCounts[] | undefined {
  type AllocationState = {
    allocations: DifficultyCounts[];
    higherCapacity: number;
  };
  let states = new Map<string, AllocationState>([[
    '0:0:0',
    { allocations: [], higherCapacity: 0 },
  ]]);

  for (let index = 0; index < cellList.length; index += 1) {
    const next = new Map<string, AllocationState>();
    const options = allocationsForCell(
      cellList[index],
      candidatesByCell[index],
      random,
    );
    for (const [key, state] of states) {
      const used = key.split(':').map(Number) as [number, number, number];
      for (const option of options) {
        const totals: DifficultyCounts = {
          foundation: used[0] + option.foundation,
          intermediate: used[1] + option.intermediate,
          advanced: used[2] + option.advanced,
        };
        if (DIFFICULTIES.some((difficulty) => totals[difficulty] > target[difficulty])) {
          continue;
        }
        const nextKey = DIFFICULTIES.map((difficulty) => totals[difficulty]).join(':');
        const higherCapacity = state.higherCapacity + allocationHigherOrderCapacity(
          option,
          candidatesByCell[index],
        );
        const existing = next.get(nextKey);
        if (!existing || existing.higherCapacity < higherCapacity) {
          next.set(nextKey, {
            allocations: [...state.allocations, option],
            higherCapacity,
          });
        }
      }
    }
    states = next;
  }

  const targetKey = DIFFICULTIES.map((difficulty) => target[difficulty]).join(':');
  const resolved = states.get(targetKey);
  return resolved && resolved.higherCapacity >= 20
    ? resolved.allocations
    : undefined;
}

function selectQuestions(
  cellList: Cell[],
  candidatesByCell: AssessmentQuestion[][],
  allocations: DifficultyCounts[],
  random: () => number,
): AssessmentQuestion[] | undefined {
  const selected: AssessmentQuestion[] = [];
  const familyCounts = new Map<string, number>();
  for (let cellIndex = 0; cellIndex < cellList.length; cellIndex += 1) {
    for (const difficulty of DIFFICULTIES) {
      const quota = allocations[cellIndex][difficulty];
      if (quota === 0) continue;
      const candidates = shuffle(
        candidatesByCell[cellIndex].filter(
          (question) => question.difficulty === difficulty,
        ),
        random,
      ).sort((left, right) => (
        Number(HIGHER_ORDER.has(right.bloomLevel))
        - Number(HIGHER_ORDER.has(left.bloomLevel))
      ));
      let picked = 0;
      for (const question of candidates) {
        if ((familyCounts.get(question.familyId) ?? 0) >= 2) continue;
        selected.push(question);
        familyCounts.set(
          question.familyId,
          (familyCounts.get(question.familyId) ?? 0) + 1,
        );
        picked += 1;
        if (picked === quota) break;
      }
      if (picked !== quota) return undefined;
    }
  }
  return selected;
}

export function assembleHvpCuratedPractice({
  questions,
  seed,
  allowDifficultyRelaxation = true,
}: {
  questions: readonly AssessmentQuestion[];
  seed: string | number;
  allowDifficultyRelaxation?: boolean;
}): HvpAssemblyResult {
  const random = createHvpSeededRandom(seed);
  const cellList = cells();
  const eligible = questions.filter((question) => (
    question.reviewStatus === 'draft'
    && question.version === 1
    && question.courseId === 'human-visual-perception'
    && question.moduleId === 'human-visual-perception'
    && question.format !== 'open_response'
  ));
  const candidatesByCell = cellList.map((cell) => eligible.filter(
    (question) => question.sectionId === cell.sectionId
      && question.format === cell.format,
  ));
  const cellIssues = cellList.flatMap((cell, index) => (
    candidatesByCell[index].length < cell.quota
      ? [{
        code: 'HVP_CELL_UNAVAILABLE' as const,
        message: `${cell.sectionId} / ${cell.format} requires ${cell.quota} questions but only ${candidatesByCell[index].length} are available.`,
        sectionId: cell.sectionId,
        format: cell.format,
      }]
      : []
  ));
  if (cellIssues.length > 0) return { ok: false, issues: cellIssues };

  const targets = difficultyTargetsByRelaxation();
  const targetCandidates = allowDifficultyRelaxation ? targets : targets.slice(0, 1);
  for (const target of targetCandidates) {
    const allocation = findDifficultyAllocation(
      cellList,
      candidatesByCell,
      target,
      random,
    );
    if (!allocation) continue;
    const selected = selectQuestions(
      cellList,
      candidatesByCell,
      allocation,
      random,
    );
    if (!selected) continue;
    const higherOrderCount = selected.filter(
      (question) => HIGHER_ORDER.has(question.bloomLevel),
    ).length;
    if (higherOrderCount < 20) continue;
    const difficultyDeviation = DIFFICULTIES.reduce(
      (total, difficulty) => total + Math.abs(
        target[difficulty] - HVP_PRACTICE_DIFFICULTY_TARGETS[difficulty],
      ),
      0,
    );
    const ordered = shuffle(selected, random);
    return {
      ok: true,
      value: {
        questions: ordered,
        questionIds: ordered.map((question) => question.id),
        difficultyCounts: target,
        difficultyDeviation,
        usedDifficultyRelaxation: difficultyDeviation > 0,
        higherOrderCount,
      },
    };
  }
  return {
    ok: false,
    issues: [{
      code: 'HVP_DIFFICULTY_UNSATISFIABLE',
      message: allowDifficultyRelaxation
        ? 'No valid 50-question set satisfies the hard quotas and deterministic difficulty-relaxation rules.'
        : 'The exact 14/26/10 difficulty target is not satisfiable.',
    }],
  };
}
