import { createHvpSeededRandom } from '@/lib/assessment/hvp/assembler';
import {
  challengeQuestionIds,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
} from '@/lib/assessment/practice/history';
import type {
  PracticeAssembly,
  PracticeBlueprint,
  PracticeIssue,
  PracticeResult,
  PracticeSelectionSnapshot,
} from '@/lib/assessment/practice/types';
import { validatePracticeSelection } from '@/lib/assessment/practice/blueprint';
import type {
  AssessmentQuestion,
  Difficulty,
  QuestionFormat,
} from '@/lib/assessment/types';
import type { QuestionHistoryRecord } from '@/lib/storage/schemas';

const DIFFICULTIES: Difficulty[] = ['foundation', 'intermediate', 'advanced'];
const HIGHER_ORDER = new Set(['apply', 'analyze', 'evaluate', 'create']);

type Counts = Record<string, number>;
type Cell = { sectionId: string; format: QuestionFormat; quota: number };
type DifficultyCounts = Record<Difficulty, number>;

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function counts(values: readonly AssessmentQuestion[], field: 'sectionId' | 'format' | 'difficulty') {
  return values.reduce<Counts>((result, question) => ({
    ...result,
    [question[field]]: (result[question[field]] ?? 0) + 1,
  }), {});
}

function strategyPool(
  questions: AssessmentQuestion[],
  selection: PracticeSelectionSnapshot,
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): PracticeResult<AssessmentQuestion[]> {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const requested = selection.requestedCount;
  const fail = (
    code: PracticeIssue['code'],
    message: string,
    ids: string[],
  ): PracticeResult<AssessmentQuestion[]> => ({
    ok: false,
    issues: [{ code, message, availableCount: ids.length }],
  });
  if (selection.strategy === 'unseen') {
    const ids = unseenQuestionIds(questions, history);
    return ids.length < requested
      ? fail('PRACTICE_INSUFFICIENT_UNSEEN_POOL', 'There are not enough unseen questions for this session.', ids)
      : { ok: true, value: ids.flatMap((id) => byId.get(id) ?? []) };
  }
  if (selection.strategy === 'retry-missed') {
    const ids = retryMissedQuestionIds(questions, history);
    return ids.length < requested
      ? fail('PRACTICE_INSUFFICIENT_MISSED_POOL', 'There are not enough missed questions for this session.', ids)
      : { ok: true, value: ids.flatMap((id) => byId.get(id) ?? []) };
  }
  if (selection.strategy === 'weak-topics') {
    const ids = weakTopicQuestionIds(questions, history);
    return ids.length < requested
      ? fail('PRACTICE_INSUFFICIENT_WEAK_TOPIC_POOL', 'More answered history is needed to build a weak-topic session.', ids)
      : { ok: true, value: ids.flatMap((id) => byId.get(id) ?? []) };
  }
  if (selection.strategy === 'challenge') {
    const ids = challengeQuestionIds(questions);
    return ids.length < requested
      ? fail('PRACTICE_INSUFFICIENT_CHALLENGE_POOL', 'The selected filters do not contain enough challenge questions.', ids)
      : { ok: true, value: ids.flatMap((id) => byId.get(id) ?? []) };
  }
  return { ok: true, value: questions };
}

function transportCells(
  sectionTargets: Counts,
  formatTargets: Counts,
  allowed: Set<string>,
  capacities: Readonly<Record<string, Readonly<Record<string, number>>>>,
): Cell[] | undefined {
  const sections = Object.keys(sectionTargets);
  const formats = Object.keys(formatTargets);
  const remainingFormats = { ...formatTargets };
  const result: Cell[] = [];
  function assignSection(sectionIndex: number): boolean {
    if (sectionIndex === sections.length) {
      return Object.values(remainingFormats).every((value) => value === 0);
    }
    const sectionId = sections[sectionIndex];
    const target = sectionTargets[sectionId];
    const eligible = formats.filter((format) => allowed.has(`${sectionId}:${format}`));
    function assignFormat(index: number, remaining: number): boolean {
      if (index === eligible.length) {
        return remaining === 0 && assignSection(sectionIndex + 1);
      }
      const format = eligible[index];
      const maximum = Math.min(
        remaining,
        remainingFormats[format] ?? 0,
        capacities[sectionId]?.[format] ?? 0,
      );
      for (let quota = maximum; quota >= 0; quota -= 1) {
        remainingFormats[format] -= quota;
        if (quota > 0) result.push({ sectionId, format: format as QuestionFormat, quota });
        if (assignFormat(index + 1, remaining - quota)) return true;
        if (quota > 0) result.pop();
        remainingFormats[format] += quota;
      }
      return false;
    }
    return assignFormat(0, target);
  }
  return assignSection(0) ? result : undefined;
}

function emptyDifficultyCounts(): DifficultyCounts {
  return { foundation: 0, intermediate: 0, advanced: 0 };
}

function allocationsForCell(
  cell: Cell,
  candidates: AssessmentQuestion[],
): DifficultyCounts[] {
  const availability = emptyDifficultyCounts();
  candidates.forEach((question) => {
    availability[question.difficulty] += 1;
  });
  const allocations: DifficultyCounts[] = [];
  for (let foundation = 0; foundation <= cell.quota; foundation += 1) {
    for (let intermediate = 0; intermediate <= cell.quota - foundation; intermediate += 1) {
      const advanced = cell.quota - foundation - intermediate;
      if (
        foundation <= availability.foundation
        && intermediate <= availability.intermediate
        && advanced <= availability.advanced
      ) allocations.push({ foundation, intermediate, advanced });
    }
  }
  return allocations;
}

function findDifficultyAllocation(
  cells: Cell[],
  candidateCells: AssessmentQuestion[][],
  targets: DifficultyCounts,
  minimumHigherOrder: number,
): DifficultyCounts[] | undefined {
  type State = { allocations: DifficultyCounts[]; higherCapacity: number };
  let states = new Map<string, State>([['0:0:0', { allocations: [], higherCapacity: 0 }]]);
  cells.forEach((cell, cellIndex) => {
    const next = new Map<string, State>();
    const options = allocationsForCell(cell, candidateCells[cellIndex]);
    states.forEach((state, key) => {
      const used = key.split(':').map(Number);
      options.forEach((option) => {
        const totals = DIFFICULTIES.map(
          (difficulty, index) => used[index] + option[difficulty],
        );
        if (totals.some((value, index) => value > targets[DIFFICULTIES[index]])) return;
        const nextKey = totals.join(':');
        const higherCapacity = state.higherCapacity + DIFFICULTIES.reduce((sum, difficulty) => (
          sum + Math.min(
            option[difficulty],
            candidateCells[cellIndex].filter(
              (question) => question.difficulty === difficulty
                && HIGHER_ORDER.has(question.bloomLevel),
            ).length,
          )
        ), 0);
        const previous = next.get(nextKey);
        if (!previous || higherCapacity > previous.higherCapacity) {
          next.set(nextKey, {
            allocations: [...state.allocations, option],
            higherCapacity,
          });
        }
      });
    });
    states = next;
  });
  const resolved = states.get(DIFFICULTIES.map((difficulty) => targets[difficulty]).join(':'));
  return resolved && resolved.higherCapacity >= minimumHigherOrder
    ? resolved.allocations
    : undefined;
}

function selectQuotaQuestions(
  cells: Cell[],
  candidateCells: AssessmentQuestion[][],
  allocations: DifficultyCounts[],
  random: () => number,
  maximumFamilyRepetition: number,
  minimumHigherOrder: number,
): AssessmentQuestion[] | undefined {
  for (let retry = 0; retry < 24; retry += 1) {
    const selected: AssessmentQuestion[] = [];
    const familyCounts = new Map<string, number>();
    let failed = false;
    cells.forEach((cell, cellIndex) => {
      DIFFICULTIES.forEach((difficulty) => {
        if (failed) return;
        const quota = allocations[cellIndex][difficulty];
        const candidates = shuffle(
          candidateCells[cellIndex].filter((question) => question.difficulty === difficulty),
          random,
        ).sort((left, right) => (
          Number(HIGHER_ORDER.has(right.bloomLevel))
          - Number(HIGHER_ORDER.has(left.bloomLevel))
        ));
        let picked = 0;
        candidates.forEach((question) => {
          if (picked >= quota || (familyCounts.get(question.familyId) ?? 0) >= maximumFamilyRepetition) return;
          selected.push(question);
          familyCounts.set(question.familyId, (familyCounts.get(question.familyId) ?? 0) + 1);
          picked += 1;
        });
        if (picked !== quota) failed = true;
      });
    });
    if (
      !failed
      && selected.filter((question) => HIGHER_ORDER.has(question.bloomLevel)).length
        >= minimumHigherOrder
    ) return selected;
  }
  return undefined;
}

function simpleSelection(
  candidates: AssessmentQuestion[],
  selection: PracticeSelectionSnapshot,
  random: () => number,
  maximumFamilyRepetition: number,
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): AssessmentQuestion[] | undefined {
  let ordered = shuffle(candidates, random);
  if (selection.strategy === 'mixed') {
    ordered = ordered.sort((left, right) => (
      Number(history[left.id]?.version === left.version)
      - Number(history[right.id]?.version === right.version)
    ));
  }
  const selected: AssessmentQuestion[] = [];
  const families = new Map<string, number>();
  ordered.forEach((question) => {
    if (
      selected.length >= selection.requestedCount
      || (families.get(question.familyId) ?? 0) >= maximumFamilyRepetition
    ) return;
    selected.push(question);
    families.set(question.familyId, (families.get(question.familyId) ?? 0) + 1);
  });
  return selected.length === selection.requestedCount ? selected : undefined;
}

export function assemblePractice({
  questions,
  blueprint,
  selection,
  history = {},
  sectionFormatAvailability,
}: {
  questions: readonly AssessmentQuestion[];
  blueprint: PracticeBlueprint;
  selection: PracticeSelectionSnapshot;
  history?: Readonly<Record<string, QuestionHistoryRecord>>;
  sectionFormatAvailability?: Readonly<Record<string, Readonly<Record<string, number>>>>;
}): PracticeResult<PracticeAssembly> {
  const validated = validatePracticeSelection(selection, blueprint);
  if (!validated.ok) return validated;
  const profile = blueprint.profiles.find((candidate) => candidate.id === selection.profileId);
  const eligible = questions.filter((question) => (
    question.courseId === blueprint.courseId
    && question.moduleId === blueprint.moduleId
    && blueprint.allowedReviewStatuses.includes(question.reviewStatus)
    && selection.sectionIds.includes(question.sectionId)
    && selection.formats.includes(question.format)
    && selection.difficulties.includes(question.difficulty)
    && question.version === 1
    && (blueprint.autoScoreOpenResponses || question.format !== 'open_response')
  ));
  if (!eligible.length) {
    return {
      ok: false,
      issues: [{ code: 'PRACTICE_NO_ELIGIBLE_QUESTIONS', message: 'No questions match the selected practice filters.', availableCount: 0 }],
    };
  }
  const strategy = strategyPool(eligible, selection, history);
  if (!strategy.ok) return strategy;
  const random = createHvpSeededRandom(selection.seed);
  let selected: AssessmentQuestion[] | undefined;
  if (
    profile?.sectionTargets
    && profile.formatTargets
    && profile.difficultyTargets
    && sectionFormatAvailability
  ) {
    const allowed = new Set(Object.entries(sectionFormatAvailability).flatMap(
      ([sectionId, formats]) => Object.entries(formats)
        .filter(([, count]) => count > 0)
        .map(([format]) => `${sectionId}:${format}`),
    ));
    const cells = transportCells(
      profile.sectionTargets,
      profile.formatTargets,
      allowed,
      sectionFormatAvailability,
    );
    if (!cells) {
      return { ok: false, issues: [{ code: 'PRACTICE_UNSATISFIABLE_QUOTAS', message: 'Section and format targets cannot be combined.' }] };
    }
    const candidateCells = cells.map((cell) => strategy.value.filter(
      (question) => question.sectionId === cell.sectionId && question.format === cell.format,
    ));
    if (candidateCells.some((cell, index) => cell.length < cells[index].quota)) {
      return { ok: false, issues: [{ code: 'PRACTICE_UNSATISFIABLE_QUOTAS', message: 'The filtered pool cannot satisfy the profile section/format matrix.' }] };
    }
    const difficultyTargets = {
      foundation: profile.difficultyTargets.foundation ?? 0,
      intermediate: profile.difficultyTargets.intermediate ?? 0,
      advanced: profile.difficultyTargets.advanced ?? 0,
    };
    const allocation = findDifficultyAllocation(
      cells,
      candidateCells,
      difficultyTargets,
      profile.higherOrderMinimum,
    );
    if (allocation) {
      selected = selectQuotaQuestions(
        cells,
        candidateCells,
        allocation,
        random,
        blueprint.maximumFamilyRepetition,
        profile.higherOrderMinimum,
      );
    }
  } else {
    selected = simpleSelection(
      strategy.value,
      selection,
      random,
      blueprint.maximumFamilyRepetition,
      history,
    );
  }
  if (!selected) {
    return {
      ok: false,
      issues: [{ code: 'PRACTICE_UNSATISFIABLE_QUOTAS', message: 'No deterministic set satisfies every selected rule.' }],
    };
  }
  const ordered = shuffle(selected, random);
  return {
    ok: true,
    value: {
      questions: ordered,
      questionIds: ordered.map((question) => question.id),
      selection: structuredClone(selection),
      sectionCounts: counts(ordered, 'sectionId'),
      formatCounts: counts(ordered, 'format'),
      difficultyCounts: counts(ordered, 'difficulty'),
      higherOrderCount: ordered.filter((question) => HIGHER_ORDER.has(question.bloomLevel)).length,
      usedRelaxation: false,
    },
  };
}
