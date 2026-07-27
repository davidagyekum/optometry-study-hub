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
  if (!blueprint.autoScoreOpenResponses && selection.formats.includes('open_response')) {
    selectionIssues.push({
      code: 'PRACTICE_INCOMPATIBLE_FILTERS',
      message: 'Open responses are not permitted in automatically scored practice.',
      path: 'formats',
    });
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
