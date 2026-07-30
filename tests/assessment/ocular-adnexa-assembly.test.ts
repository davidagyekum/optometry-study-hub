import { describe, expect, it } from 'vitest';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import {
  createOcularAdnexaPracticeSelection,
  OCULAR_ADNEXA_PROFILE_SECTION_FORMAT_ALLOCATIONS,
  ocularAdnexaCuratedPracticeBlueprint,
} from '@/lib/assessment/ocular-adnexa/practiceBlueprint';

const HIGHER_ORDER = new Set(['apply', 'analyze', 'evaluate', 'create']);

function count(
  questions: typeof ocularAdnexaCandidateBank.questions,
  field: 'sectionId' | 'format' | 'difficulty',
) {
  return questions.reduce<Record<string, number>>((result, question) => ({
    ...result,
    [question[field]]: (result[question[field]] ?? 0) + 1,
  }), {});
}

describe('Ocular Adnexa deterministic fixed profiles', () => {
  it('satisfies every hard profile contract across 1,000 seeds', () => {
    for (let seedIndex = 0; seedIndex < 1_000; seedIndex += 1) {
      for (const profileId of ['quick', 'standard', 'full'] as const) {
        const profile = ocularAdnexaCuratedPracticeBlueprint.profiles.find(
          (candidate) => candidate.id === profileId,
        );
        if (!profile?.sectionTargets || !profile.formatTargets
          || !profile.difficultyTargets) {
          throw new Error(`Missing fixed contract for ${profileId}.`);
        }
        const selection = createOcularAdnexaPracticeSelection({
          profileId,
          requestedCount: profile.count,
          sectionIds: Object.keys(profile.sectionTargets),
          formats: Object.keys(profile.formatTargets) as never,
          difficulties: Object.keys(profile.difficultyTargets) as never,
          seed: `ocular-adnexa-seed-${seedIndex}`,
        });
        const first = assemblePractice({
          questions: ocularAdnexaCandidateBank.questions,
          blueprint: ocularAdnexaCuratedPracticeBlueprint,
          selection,
          sectionFormatAvailability:
            OCULAR_ADNEXA_PROFILE_SECTION_FORMAT_ALLOCATIONS[profileId],
        });
        if (!first.ok) {
          throw new Error(
            `${profileId}/${seedIndex}: ${JSON.stringify(first.issues)}`,
          );
        }
        expect(first.value.questionIds).toHaveLength(profile.count);
        expect(new Set(first.value.questionIds).size).toBe(profile.count);
        expect(count(first.value.questions, 'sectionId')).toEqual(
          profile.sectionTargets,
        );
        expect(count(first.value.questions, 'format')).toEqual(
          profile.formatTargets,
        );
        expect(count(first.value.questions, 'difficulty')).toEqual(
          profile.difficultyTargets,
        );
        expect(first.value.higherOrderCount)
          .toBeGreaterThanOrEqual(profile.higherOrderMinimum);
        expect(first.value.higherOrderCount)
          .toBeLessThanOrEqual(profile.higherOrderMaximum ?? profile.count);
        const families = first.value.questions.reduce<Record<string, number>>(
          (result, question) => ({
            ...result,
            [question.familyId]: (result[question.familyId] ?? 0) + 1,
          }),
          {},
        );
        expect(Math.max(...Object.values(families))).toBeLessThanOrEqual(2);
        if (profile.requiredObjectiveIds) {
          const objectives = new Set(
            first.value.questions.map((question) => question.objectiveId),
          );
          expect(profile.requiredObjectiveIds.every(
            (objectiveId) => objectives.has(objectiveId),
          )).toBe(true);
        }
        expect(first.value.questions.filter(
          (question) => HIGHER_ORDER.has(question.bloomLevel),
        )).toHaveLength(first.value.higherOrderCount);
        const second = assemblePractice({
          questions: ocularAdnexaCandidateBank.questions,
          blueprint: ocularAdnexaCuratedPracticeBlueprint,
          selection,
          sectionFormatAvailability:
            OCULAR_ADNEXA_PROFILE_SECTION_FORMAT_ALLOCATIONS[profileId],
        });
        expect(second.ok && second.value.questionIds)
          .toEqual(first.value.questionIds);
      }
    }
  }, 120_000);
});
