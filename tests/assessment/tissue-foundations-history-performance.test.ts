import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import {
  createTissuePracticeSelection,
  TISSUE_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  tissueCuratedPracticeBlueprint,
} from '@/lib/assessment/tissue-foundations/practiceBlueprint';
import type { PracticeAssembly } from '@/lib/assessment/practice/types';
import type { QuestionHistoryRecord } from '@/lib/storage/schemas';

function assembleFixedProfile(
  profileId: 'quick' | 'standard' | 'full',
  seed: string,
  history: Readonly<Record<string, QuestionHistoryRecord>> = {},
): PracticeAssembly {
  const profile = tissueCuratedPracticeBlueprint.profiles.find(
    (candidate) => candidate.id === profileId,
  );
  if (!profile?.sectionTargets || !profile.formatTargets
    || !profile.difficultyTargets) {
    throw new Error(`Missing ${profileId} profile.`);
  }
  const result = assemblePractice({
    questions: tissueFoundationsCandidateBank.questions,
    blueprint: tissueCuratedPracticeBlueprint,
    selection: createTissuePracticeSelection({
      profileId,
      requestedCount: profile.count,
      sectionIds: Object.keys(profile.sectionTargets),
      formats: Object.keys(profile.formatTargets) as never,
      difficulties: Object.keys(profile.difficultyTargets) as never,
      seed,
    }),
    history,
    sectionFormatAvailability:
      TISSUE_PROFILE_SECTION_FORMAT_ALLOCATIONS[profileId],
  });
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => issue.code).join(', '));
  }
  return result.value;
}

function recordHistory(
  history: Record<string, QuestionHistoryRecord>,
  assembly: PracticeAssembly,
) {
  assembly.questions.forEach((question) => {
    history[question.id] = {
      questionId: question.id,
      version: question.version,
      attemptCount: 1,
      correctCount: 0,
    };
  });
}

describe('Tissue Foundations history-aware Full practice', () => {
  it('does not exhaustively search after earlier Quick and Standard sessions', () => {
    const history: Record<string, QuestionHistoryRecord> = {};
    recordHistory(history, assembleFixedProfile('quick', 'history-quick'));
    recordHistory(
      history,
      assembleFixedProfile('standard', 'history-standard', history),
    );

    const startedAt = performance.now();
    const first = assembleFixedProfile('full', 'history-full', history);
    const durationMs = performance.now() - startedAt;
    const second = assembleFixedProfile('full', 'history-full', history);

    expect(first.questionIds).toHaveLength(50);
    expect(second.questionIds).toEqual(first.questionIds);
    expect(new Set(first.questions.map((question) => question.objectiveId)).size)
      .toBe(18);
    expect(durationMs).toBeLessThan(2_000);
  }, 10_000);
});
