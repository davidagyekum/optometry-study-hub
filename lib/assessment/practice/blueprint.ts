import {
  practiceBlueprintSchema,
  practiceSelectionSnapshotSchema,
} from '@/lib/assessment/practice/schemas';
import type {
  PracticeBlueprint,
  PracticeIssue,
  PracticeResult,
  PracticeSelectionSnapshot,
} from '@/lib/assessment/practice/types';

function issues(
  code: 'PRACTICE_BLUEPRINT_INVALID' | 'PRACTICE_SELECTION_INVALID',
  parsedIssues: { message: string; path: PropertyKey[] }[],
): PracticeIssue[] {
  return parsedIssues.map((issue) => ({
    code,
    message: issue.message,
    path: issue.path.join('.'),
  }));
}

export function validatePracticeBlueprint(
  value: unknown,
): PracticeResult<PracticeBlueprint> {
  const parsed = practiceBlueprintSchema.safeParse(value);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, issues: issues('PRACTICE_BLUEPRINT_INVALID', parsed.error.issues) };
}

export function validatePracticeSelection(
  value: unknown,
  blueprint: PracticeBlueprint,
): PracticeResult<PracticeSelectionSnapshot> {
  const parsed = practiceSelectionSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, issues: issues('PRACTICE_SELECTION_INVALID', parsed.error.issues) };
  }
  const selection = parsed.data;
  const profile = blueprint.profiles.find((candidate) => candidate.id === selection.profileId);
  const selectionIssues: PracticeIssue[] = [];
  if (
    selection.blueprintId !== blueprint.id
    || selection.practiceFamilyId !== blueprint.practiceFamilyId
  ) {
    selectionIssues.push({
      code: 'PRACTICE_SELECTION_INVALID',
      message: 'Selection identity does not match its practice blueprint.',
      path: 'blueprintId',
    });
  }
  if (!profile && selection.profileId !== 'custom') {
    selectionIssues.push({
      code: 'PRACTICE_SELECTION_INVALID',
      message: `Unknown practice profile "${selection.profileId}".`,
      path: 'profileId',
    });
  }
  if (profile && selection.requestedCount !== profile.count) {
    selectionIssues.push({
      code: 'PRACTICE_SELECTION_INVALID',
      message: `Profile "${profile.id}" requires ${profile.count} questions.`,
      path: 'requestedCount',
    });
  }
  if (selection.formats.some((format) => !blueprint.eligibleFormats.includes(format))) {
    selectionIssues.push({
      code: 'PRACTICE_INCOMPATIBLE_FILTERS',
      message: 'Selection contains a format that is not eligible for this blueprint.',
      path: 'formats',
    });
  }
  if (selection.resultMode !== blueprint.resultMode || selection.historyPolicy !== blueprint.historyPolicy) {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: 'Selection result/history policy does not match its blueprint.', path: 'resultMode' });
  }
  if (selection.sectionIds.some((id) => !blueprint.sectionIds.includes(id))) {
    selectionIssues.push({ code: 'PRACTICE_INCOMPATIBLE_FILTERS', message: 'Selection contains an unrecognised section.', path: 'sectionIds' });
  }
  if (blueprint.resultMode === 'automatic' && selection.formats.includes('open_response')) {
    selectionIssues.push({
      code: 'PRACTICE_INCOMPATIBLE_FILTERS',
      message: 'Open responses are not permitted in automatically scored practice.',
      path: 'formats',
    });
  }
  const targeted = new Set(['unseen', 'retry-missed', 'weak-topics', 'challenge']);
  if (selection.strategy === 'custom' && selection.profileId !== 'custom') {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: 'The custom strategy requires the Custom profile.', path: 'strategy' });
  }
  if (selection.profileId === 'targeted' && !targeted.has(selection.strategy)) {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: 'Targeted profiles require a targeted strategy.', path: 'strategy' });
  }
  if (targeted.has(selection.strategy) && selection.profileId !== 'targeted') {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: 'Targeted strategies require the Targeted profile.', path: 'strategy' });
  }
  if (profile && ['quick', 'standard', 'full', 'written'].includes(profile.id) && selection.strategy !== 'mixed') {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: `Profile "${profile.id}" requires mixed strategy.`, path: 'strategy' });
  }
  const sameSet = (values: string[], expected: string[]) => values.length === expected.length && values.every((value) => expected.includes(value));
  if (profile?.sectionTargets && !sameSet(selection.sectionIds, Object.keys(profile.sectionTargets))) {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: 'Fixed profile sections must exactly match targets.', path: 'sectionIds' });
  }
  if (profile?.formatTargets && !sameSet(selection.formats, Object.keys(profile.formatTargets))) {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: 'Fixed profile formats must exactly match targets.', path: 'formats' });
  }
  if (profile?.difficultyTargets && !sameSet(selection.difficulties, Object.keys(profile.difficultyTargets))) {
    selectionIssues.push({ code: 'PRACTICE_SELECTION_INVALID', message: 'Fixed profile difficulties must exactly match targets.', path: 'difficulties' });
  }
  if (selection.profileId === 'custom') {
    if (
      !blueprint.custom
      || selection.requestedCount < blueprint.custom.minimumCount
      || selection.requestedCount > blueprint.custom.maximumCount
    ) {
      selectionIssues.push({
        code: 'PRACTICE_SELECTION_INVALID',
        message: 'Custom question count is outside the blueprint range.',
        path: 'requestedCount',
      });
    }
    if (selection.strategy !== 'custom') {
      selectionIssues.push({
        code: 'PRACTICE_SELECTION_INVALID',
        message: 'Custom profiles must use the custom strategy.',
        path: 'strategy',
      });
    }
  }
  return selectionIssues.length
    ? { ok: false, issues: selectionIssues }
    : { ok: true, value: selection };
}
