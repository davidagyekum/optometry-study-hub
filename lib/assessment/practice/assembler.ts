import { createSeededRandom } from '@/lib/assessment/practice/random';
import {
  challengeQuestionIds,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
  isCurrentHistory,
} from '@/lib/assessment/practice/history';
import type {
  PracticeAssembly,
  PracticeBlueprint,
  PracticeIssue,
  PracticeResult,
  PracticeSelectionSnapshot,
} from '@/lib/assessment/practice/types';
import { validatePracticeSelection } from '@/lib/assessment/practice/blueprint';
import { withStrategyEvidence } from '@/lib/assessment/practice/evidence';
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
  accept: (cells: Cell[]) => boolean = () => true,
): Cell[] | undefined {
  const sections = Object.keys(sectionTargets);
  const formats = Object.keys(formatTargets);
  const remainingFormats = { ...formatTargets };
  const result: Cell[] = [];
  let accepted: Cell[] | undefined;
  function assignSection(sectionIndex: number): boolean {
    if (sectionIndex === sections.length) {
      if (!Object.values(remainingFormats).every((value) => value === 0)) {
        return false;
      }
      const candidate = result.map((cell) => ({ ...cell }));
      if (!accept(candidate)) return false;
      accepted = candidate;
      return true;
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
  return assignSection(0) ? accepted : undefined;
}

function prescribedTransportCells(
  targets: Readonly<Record<string, Readonly<Record<string, number>>>>,
  sectionTargets: Counts,
  formatTargets: Counts,
  capacities: Readonly<Record<string, Readonly<Record<string, number>>>>,
): Cell[] | undefined {
  const cells = Object.entries(targets).flatMap(([sectionId, formats]) => (
    Object.entries(formats).flatMap(([format, quota]) => (
      quota > 0
        ? [{ sectionId, format: format as QuestionFormat, quota }]
        : []
    ))
  ));
  const actualSections = cells.reduce<Counts>((result, cell) => ({
    ...result,
    [cell.sectionId]: (result[cell.sectionId] ?? 0) + cell.quota,
  }), {});
  const actualFormats = cells.reduce<Counts>((result, cell) => ({
    ...result,
    [cell.format]: (result[cell.format] ?? 0) + cell.quota,
  }), {});
  const matches = (actual: Counts, expected: Counts) => (
    Object.entries(expected).every(([id, count]) => actual[id] === count)
    && Object.entries(actual).every(([id, count]) => expected[id] === count)
  );
  if (
    !matches(actualSections, sectionTargets)
    || !matches(actualFormats, formatTargets)
    || cells.some(
      (cell) => cell.quota > (capacities[cell.sectionId]?.[cell.format] ?? 0),
    )
  ) return undefined;
  return cells;
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
  maximumHigherOrder: number,
): DifficultyCounts[] | undefined {
  type State = {
    allocations: DifficultyCounts[];
    higherCapacity: number;
    minimumHigherOrder: number;
  };
  let states = new Map<string, State>([['0:0:0', {
    allocations: [],
    higherCapacity: 0,
    minimumHigherOrder: 0,
  }]]);
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
        const minimumHigherOrderForOption = DIFFICULTIES.reduce(
          (sum, difficulty) => {
            const lowerAvailable = candidateCells[cellIndex].filter(
              (question) => question.difficulty === difficulty
                && !HIGHER_ORDER.has(question.bloomLevel),
            ).length;
            return sum + Math.max(0, option[difficulty] - lowerAvailable);
          },
          0,
        );
        const minimumCapacity =
          state.minimumHigherOrder + minimumHigherOrderForOption;
        const candidateFeasible = higherCapacity >= minimumHigherOrder
          && minimumCapacity <= maximumHigherOrder;
        const previous = next.get(nextKey);
        const previousFeasible = previous
          ? previous.higherCapacity >= minimumHigherOrder
            && previous.minimumHigherOrder <= maximumHigherOrder
          : false;
        const totalTarget = DIFFICULTIES.reduce(
          (sum, difficulty) => sum + targets[difficulty],
          0,
        );
        const boundedHigherOrder = maximumHigherOrder < totalTarget;
        if (
          !previous
          || (
            !boundedHigherOrder
            && higherCapacity > previous.higherCapacity
          )
          || (
            boundedHigherOrder
            && (
              (candidateFeasible && !previousFeasible)
              || (
                candidateFeasible === previousFeasible
                && (
                  minimumCapacity < previous.minimumHigherOrder
                  || (
                    minimumCapacity === previous.minimumHigherOrder
                    && higherCapacity > previous.higherCapacity
                  )
                )
              )
            )
          )
        ) {
          next.set(nextKey, {
            allocations: [...state.allocations, option],
            higherCapacity,
            minimumHigherOrder: minimumCapacity,
          });
        }
      });
    });
    states = next;
  });
  const resolved = states.get(DIFFICULTIES.map((difficulty) => targets[difficulty]).join(':'));
  return resolved
    && resolved.higherCapacity >= minimumHigherOrder
    && resolved.minimumHigherOrder <= maximumHigherOrder
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
  maximumHigherOrder: number,
  requiredObjectiveIds: readonly string[],
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): AssessmentQuestion[] | undefined {
  type QuotaBucket = {
    candidates: AssessmentQuestion[];
    quota: number;
    maximumHigherOrder: number;
    maximumUnseen: number;
  };
  const requiredObjectives = new Set(requiredObjectiveIds);
  const allCandidates = candidateCells.flat();
  const objectiveAvailability = allCandidates.reduce<Map<string, number>>(
    (result, question) => result.set(
      question.objectiveId,
      (result.get(question.objectiveId) ?? 0) + 1,
    ),
    new Map(),
  );
  const objectivesWithUnseenCandidates = new Set(
    allCandidates
      .filter((question) => !isCurrentHistory(question, history[question.id]))
      .map((question) => question.objectiveId),
  );
  const buckets: QuotaBucket[] = cells.flatMap((cell, cellIndex) => DIFFICULTIES.flatMap((difficulty) => {
    const quota = allocations[cellIndex][difficulty];
    if (quota === 0) return [];
    const candidates = shuffle(
      candidateCells[cellIndex].filter((question) => question.difficulty === difficulty),
      random,
    ).sort((left, right) => {
      const leftForcedObjective = requiredObjectives.has(left.objectiveId)
        && !objectivesWithUnseenCandidates.has(left.objectiveId);
      const rightForcedObjective = requiredObjectives.has(right.objectiveId)
        && !objectivesWithUnseenCandidates.has(right.objectiveId);
      return Number(rightForcedObjective) - Number(leftForcedObjective)
        || Number(isCurrentHistory(left, history[left.id]))
          - Number(isCurrentHistory(right, history[right.id]))
        || (objectiveAvailability.get(left.objectiveId) ?? 0)
          - (objectiveAvailability.get(right.objectiveId) ?? 0)
        || Number(HIGHER_ORDER.has(right.bloomLevel))
          - Number(HIGHER_ORDER.has(left.bloomLevel));
    });
    return [{
      candidates,
      quota,
      maximumHigherOrder: Math.min(
        quota,
        candidates.filter((question) => HIGHER_ORDER.has(question.bloomLevel)).length,
      ),
      maximumUnseen: Math.min(
        quota,
        candidates.filter((question) => !isCurrentHistory(question, history[question.id])).length,
      ),
    }];
  })).sort((left, right) => (
    (left.candidates.length - left.quota) - (right.candidates.length - right.quota)
  ));
  const familyAvailability = allCandidates.reduce<Map<string, number>>(
    (result, question) => result.set(
      question.familyId,
      (result.get(question.familyId) ?? 0) + 1,
    ),
    new Map(),
  );
  const familyConstraintIsRedundant = [...familyAvailability.values()].every(
    (count) => count <= maximumFamilyRepetition,
  );

  function selectRequiredObjectivesByDynamicProgramming():
    AssessmentQuestion[] | undefined {
    if (
      !requiredObjectiveIds.length
      || requiredObjectiveIds.length > 30
      || !familyConstraintIsRedundant
    ) {
      return undefined;
    }
    type SelectionState = {
      mask: number;
      higherOrder: number;
      unseen: number;
      questions: AssessmentQuestion[];
    };
    type BucketState = SelectionState & { count: number };
    const objectiveBits = new Map(
      requiredObjectiveIds.map((objectiveId, index) => [
        objectiveId,
        1 << index,
      ]),
    );
    const requiredMask = (1 << requiredObjectiveIds.length) - 1;
    const bucketOptions = buckets.map((bucket) => {
      let states = new Map<string, BucketState>([['0:0:0', {
        count: 0,
        mask: 0,
        higherOrder: 0,
        unseen: 0,
        questions: [],
      }]]);
      bucket.candidates.forEach((question) => {
        const next = new Map(states);
        states.forEach((state) => {
          if (state.count >= bucket.quota) return;
          const count = state.count + 1;
          const mask = state.mask | (objectiveBits.get(question.objectiveId) ?? 0);
          const higherOrder =
            state.higherOrder + Number(HIGHER_ORDER.has(question.bloomLevel));
          if (higherOrder > maximumHigherOrder) return;
          const unseen =
            state.unseen + Number(!isCurrentHistory(question, history[question.id]));
          const key = `${count}:${mask}:${higherOrder}`;
          const previous = next.get(key);
          if (!previous || unseen > previous.unseen) {
            next.set(key, {
              count,
              mask,
              higherOrder,
              unseen,
              questions: [...state.questions, question],
            });
          }
        });
        states = next;
      });
      return [...states.values()].filter((state) => state.count === bucket.quota);
    });
    if (bucketOptions.some((options) => options.length === 0)) return undefined;

    const remainingObjectiveMasks = Array.from(
      { length: bucketOptions.length + 1 },
      () => 0,
    );
    const remainingMinimumHigherOrder = Array.from(
      { length: bucketOptions.length + 1 },
      () => 0,
    );
    const remainingMaximumHigherOrder = Array.from(
      { length: bucketOptions.length + 1 },
      () => 0,
    );
    for (let index = bucketOptions.length - 1; index >= 0; index -= 1) {
      const options = bucketOptions[index];
      remainingObjectiveMasks[index] = remainingObjectiveMasks[index + 1]
        | options.reduce((mask, option) => mask | option.mask, 0);
      remainingMinimumHigherOrder[index] =
        remainingMinimumHigherOrder[index + 1]
        + Math.min(...options.map((option) => option.higherOrder));
      remainingMaximumHigherOrder[index] =
        remainingMaximumHigherOrder[index + 1]
        + Math.max(...options.map((option) => option.higherOrder));
    }

    let states = new Map<string, SelectionState>([['0:0', {
      mask: 0,
      higherOrder: 0,
      unseen: 0,
      questions: [],
    }]]);
    bucketOptions.forEach((options, bucketIndex) => {
      const next = new Map<string, SelectionState>();
      states.forEach((state) => {
        options.forEach((option) => {
          const mask = state.mask | option.mask;
          const higherOrder = state.higherOrder + option.higherOrder;
          if (higherOrder > maximumHigherOrder) return;
          if (
            higherOrder + remainingMaximumHigherOrder[bucketIndex + 1]
            < minimumHigherOrder
          ) return;
          if (
            higherOrder + remainingMinimumHigherOrder[bucketIndex + 1]
            > maximumHigherOrder
          ) return;
          if (
            (mask | remainingObjectiveMasks[bucketIndex + 1])
            !== requiredMask
          ) return;
          const unseen = state.unseen + option.unseen;
          const key = `${mask}:${higherOrder}`;
          const previous = next.get(key);
          if (!previous || unseen > previous.unseen) {
            next.set(key, {
              mask,
              higherOrder,
              unseen,
              questions: [...state.questions, ...option.questions],
            });
          }
        });
      });
      states = next;
    });

    return [...states.values()]
      .filter((state) => (
        state.mask === requiredMask
        && state.higherOrder >= minimumHigherOrder
        && state.higherOrder <= maximumHigherOrder
      ))
      .reduce<SelectionState | undefined>((best, state) => (
        !best || state.unseen > best.unseen ? state : best
      ), undefined)
      ?.questions;
  }

  const requiredObjectiveSelection =
    selectRequiredObjectivesByDynamicProgramming();
  if (requiredObjectiveSelection) return requiredObjectiveSelection;

  const remainingHigherOrder = Array.from({ length: buckets.length + 1 }, () => 0);
  const remainingUnseen = Array.from({ length: buckets.length + 1 }, () => 0);
  const remainingSlots = Array.from({ length: buckets.length + 1 }, () => 0);
  const remainingObjectives = Array.from(
    { length: buckets.length + 1 },
    () => new Set<string>(),
  );
  const remainingUnseenObjectives = Array.from(
    { length: buckets.length + 1 },
    () => new Set<string>(),
  );
  for (let index = buckets.length - 1; index >= 0; index -= 1) {
    remainingHigherOrder[index] = remainingHigherOrder[index + 1] + buckets[index].maximumHigherOrder;
    remainingUnseen[index] = remainingUnseen[index + 1] + buckets[index].maximumUnseen;
    remainingSlots[index] = remainingSlots[index + 1] + buckets[index].quota;
    remainingObjectives[index] = new Set([
      ...remainingObjectives[index + 1],
      ...buckets[index].candidates.map((question) => question.objectiveId),
    ]);
    remainingUnseenObjectives[index] = new Set([
      ...remainingUnseenObjectives[index + 1],
      ...buckets[index].candidates
        .filter((question) => !isCurrentHistory(question, history[question.id]))
        .map((question) => question.objectiveId),
    ]);
  }
  let best: AssessmentQuestion[] | undefined;
  let bestUnseenCount = -1;
  const selected: AssessmentQuestion[] = [];
  const familyCounts = new Map<string, number>();
  const objectiveCounts = new Map<string, number>();

  function maximumPossibleUnseen(bucketIndex: number, unseenCount: number): number {
    const forcedSeenObjectives = requiredObjectiveIds.filter(
      (objectiveId) => (
        !objectiveCounts.has(objectiveId)
        && !remainingUnseenObjectives[bucketIndex].has(objectiveId)
      ),
    ).length;
    return unseenCount + Math.min(
      remainingUnseen[bucketIndex],
      Math.max(0, remainingSlots[bucketIndex] - forcedSeenObjectives),
    );
  }

  const theoreticalMaximumUnseen = maximumPossibleUnseen(0, 0);

  function visitBucket(bucketIndex: number, higherOrderCount: number, unseenCount: number): void {
    if (bestUnseenCount === theoreticalMaximumUnseen) return;
    if (higherOrderCount > maximumHigherOrder) return;
    if (higherOrderCount + remainingHigherOrder[bucketIndex] < minimumHigherOrder) return;
    if (maximumPossibleUnseen(bucketIndex, unseenCount) <= bestUnseenCount) return;
    const missingObjectiveCount = requiredObjectiveIds.filter(
      (objectiveId) => !objectiveCounts.has(objectiveId),
    ).length;
    if (missingObjectiveCount > remainingSlots[bucketIndex]) return;
    if (requiredObjectiveIds.some(
      (objectiveId) => (
        !objectiveCounts.has(objectiveId)
        && !remainingObjectives[bucketIndex].has(objectiveId)
      ),
    )) return;
    if (bucketIndex === buckets.length) {
      if (
        higherOrderCount >= minimumHigherOrder
        && higherOrderCount <= maximumHigherOrder
        && requiredObjectiveIds.every((objectiveId) => objectiveCounts.has(objectiveId))
        && unseenCount > bestUnseenCount
      ) {
        best = [...selected];
        bestUnseenCount = unseenCount;
      }
      return;
    }
    const bucket = buckets[bucketIndex];
    const chosen: AssessmentQuestion[] = [];

    function choose(
      candidateIndex: number,
      remaining: number,
      chosenHigherOrder: number,
      chosenUnseen: number,
    ): void {
      if (bestUnseenCount === theoreticalMaximumUnseen) return;
      if (bucket.candidates.length - candidateIndex < remaining) return;
      if (remaining === 0) {
        chosen.forEach((question) => {
          selected.push(question);
          familyCounts.set(question.familyId, (familyCounts.get(question.familyId) ?? 0) + 1);
          objectiveCounts.set(
            question.objectiveId,
            (objectiveCounts.get(question.objectiveId) ?? 0) + 1,
          );
        });
        visitBucket(
          bucketIndex + 1,
          higherOrderCount + chosenHigherOrder,
          unseenCount + chosenUnseen,
        );
        chosen.forEach((question) => {
          selected.pop();
          const count = (familyCounts.get(question.familyId) ?? 1) - 1;
          if (count === 0) familyCounts.delete(question.familyId);
          else familyCounts.set(question.familyId, count);
          const objectiveCount = (objectiveCounts.get(question.objectiveId) ?? 1) - 1;
          if (objectiveCount === 0) objectiveCounts.delete(question.objectiveId);
          else objectiveCounts.set(question.objectiveId, objectiveCount);
        });
        return;
      }
      for (let index = candidateIndex; index <= bucket.candidates.length - remaining; index += 1) {
        const question = bucket.candidates[index];
        const alreadyChosen = chosen.filter(
          (candidate) => candidate.familyId === question.familyId,
        ).length;
        if (
          (familyCounts.get(question.familyId) ?? 0) + alreadyChosen
          >= maximumFamilyRepetition
        ) continue;
        chosen.push(question);
        choose(
          index + 1,
          remaining - 1,
          chosenHigherOrder + Number(HIGHER_ORDER.has(question.bloomLevel)),
          chosenUnseen + Number(!isCurrentHistory(question, history[question.id])),
        );
        chosen.pop();
      }
    }

    choose(0, bucket.quota, 0, 0);
  }

  visitBucket(0, 0, 0);
  return best;
}

function sectionConstrainedSelection(
  candidates: AssessmentQuestion[],
  sectionTargets: Counts,
  random: () => number,
  maximumFamilyRepetition: number,
  minimumHigherOrder: number,
  maximumHigherOrder: number,
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): AssessmentQuestion[] | undefined {
  const sections = Object.entries(sectionTargets);
  const sectionCandidates = sections.map(([sectionId]) => shuffle(
    candidates.filter((question) => question.sectionId === sectionId),
    random,
  ).sort((left, right) => (
    Number(HIGHER_ORDER.has(right.bloomLevel))
      - Number(HIGHER_ORDER.has(left.bloomLevel))
    || Number(isCurrentHistory(left, history[left.id]))
      - Number(isCurrentHistory(right, history[right.id]))
  )));
  const remainingHigherCapacity = Array.from(
    { length: sections.length + 1 },
    () => 0,
  );
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const target = sections[index][1];
    const higherAvailable = sectionCandidates[index].filter(
      (question) => HIGHER_ORDER.has(question.bloomLevel),
    ).length;
    remainingHigherCapacity[index] = remainingHigherCapacity[index + 1]
      + Math.min(target, higherAvailable);
  }

  const selected: AssessmentQuestion[] = [];
  const familyCounts = new Map<string, number>();
  let resolved: AssessmentQuestion[] | undefined;

  function visitSection(sectionIndex: number, higherOrderCount: number): boolean {
    if (higherOrderCount > maximumHigherOrder) return false;
    if (
      higherOrderCount + remainingHigherCapacity[sectionIndex]
      < minimumHigherOrder
    ) return false;
    if (sectionIndex === sections.length) {
      if (
        higherOrderCount < minimumHigherOrder
        || higherOrderCount > maximumHigherOrder
      ) return false;
      resolved = [...selected];
      return true;
    }

    const target = sections[sectionIndex][1];
    const pool = sectionCandidates[sectionIndex];
    const chosen: AssessmentQuestion[] = [];

    function choose(
      candidateIndex: number,
      remaining: number,
      chosenHigherOrder: number,
    ): boolean {
      if (pool.length - candidateIndex < remaining) return false;
      if (remaining === 0) {
        chosen.forEach((question) => {
          selected.push(question);
          familyCounts.set(
            question.familyId,
            (familyCounts.get(question.familyId) ?? 0) + 1,
          );
        });
        const accepted = visitSection(
          sectionIndex + 1,
          higherOrderCount + chosenHigherOrder,
        );
        chosen.forEach((question) => {
          selected.pop();
          const next = (familyCounts.get(question.familyId) ?? 1) - 1;
          if (next === 0) familyCounts.delete(question.familyId);
          else familyCounts.set(question.familyId, next);
        });
        return accepted;
      }
      for (
        let index = candidateIndex;
        index <= pool.length - remaining;
        index += 1
      ) {
        const question = pool[index];
        const chosenFromFamily = chosen.filter(
          (candidate) => candidate.familyId === question.familyId,
        ).length;
        if (
          (familyCounts.get(question.familyId) ?? 0) + chosenFromFamily
          >= maximumFamilyRepetition
        ) continue;
        chosen.push(question);
        if (choose(
          index + 1,
          remaining - 1,
          chosenHigherOrder + Number(HIGHER_ORDER.has(question.bloomLevel)),
        )) return true;
        chosen.pop();
      }
      return false;
    }

    return choose(0, target, 0);
  }

  return visitSection(0, 0) ? resolved : undefined;
}

function simpleSelection(
  candidates: AssessmentQuestion[],
  selection: PracticeSelectionSnapshot,
  random: () => number,
  maximumFamilyRepetition: number,
  history: Readonly<Record<string, QuestionHistoryRecord>>,
): AssessmentQuestion[] | undefined {
  let ordered = ['retry-missed', 'weak-topics', 'challenge'].includes(selection.strategy)
    ? [...candidates]
    : shuffle(candidates, random);
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
  sectionFormatTargets,
}: {
  questions: readonly AssessmentQuestion[];
  blueprint: PracticeBlueprint;
  selection: PracticeSelectionSnapshot;
  history?: Readonly<Record<string, QuestionHistoryRecord>>;
  sectionFormatAvailability?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  sectionFormatTargets?: Readonly<Record<string, Readonly<Record<string, number>>>>;
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
    && (blueprint.resultMode === 'manual-only' || question.format !== 'open_response')
  ));
  if (!eligible.length) {
    return {
      ok: false,
      issues: [{ code: 'PRACTICE_NO_ELIGIBLE_QUESTIONS', message: 'No questions match the selected practice filters.', availableCount: 0 }],
    };
  }
  const strategy = strategyPool(eligible, selection, history);
  if (!strategy.ok) return strategy;
  const evidencedSelection = withStrategyEvidence(selection, strategy.value.map((question) => question.id));
  const random = createSeededRandom(selection.seed);
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
    const difficultyTargets = {
      foundation: profile.difficultyTargets.foundation ?? 0,
      intermediate: profile.difficultyTargets.intermediate ?? 0,
      advanced: profile.difficultyTargets.advanced ?? 0,
    };
    const selectCandidate = (candidate: Cell[]) => {
      const candidateCells = candidate.map((cell) => strategy.value.filter(
        (question) => (
          question.sectionId === cell.sectionId
          && question.format === cell.format
        ),
      ));
      if (candidateCells.some(
        (cell, index) => cell.length < candidate[index].quota,
      )) return false;
      const allocation = findDifficultyAllocation(
        candidate,
        candidateCells,
        difficultyTargets,
        profile.higherOrderMinimum,
        profile.higherOrderMaximum ?? profile.count,
      );
      if (!allocation) return false;
      selected = selectQuotaQuestions(
        candidate,
        candidateCells,
        allocation,
        random,
        blueprint.maximumFamilyRepetition,
        profile.higherOrderMinimum,
        profile.higherOrderMaximum ?? profile.count,
        profile.requiredObjectiveIds ?? [],
        history,
      );
      return Boolean(selected);
    };
    let cells: Cell[] | undefined;
    if (sectionFormatTargets) {
      cells = prescribedTransportCells(
        sectionFormatTargets,
        profile.sectionTargets,
        profile.formatTargets,
        sectionFormatAvailability,
      );
      if (!cells || !selectCandidate(cells)) cells = undefined;
    } else {
      cells = transportCells(
        profile.sectionTargets,
        profile.formatTargets,
        allowed,
        sectionFormatAvailability,
        selectCandidate,
      );
    }
    if (!cells) {
      return {
        ok: false,
        issues: [{
          code: 'PRACTICE_UNSATISFIABLE_QUOTAS',
          message: 'No joint section, format, difficulty, higher-order, objective and family allocation is feasible.',
        }],
      };
    }
  } else if (
    blueprint.enforcePartialProfileTargets
    && profile?.sectionTargets
  ) {
    selected = sectionConstrainedSelection(
      strategy.value,
      profile.sectionTargets,
      random,
      blueprint.maximumFamilyRepetition,
      profile.higherOrderMinimum,
      profile.higherOrderMaximum ?? profile.count,
      history,
    );
  } else {
    selected = simpleSelection(
      strategy.value,
      evidencedSelection,
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
      selection: structuredClone(evidencedSelection),
      sectionCounts: counts(ordered, 'sectionId'),
      formatCounts: counts(ordered, 'format'),
      difficultyCounts: counts(ordered, 'difficulty'),
      higherOrderCount: ordered.filter((question) => HIGHER_ORDER.has(question.bloomLevel)).length,
      usedRelaxation: false,
    },
  };
}
