import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_PRACTICE_ID,
} from '@/lib/assessment/hvp/config';
import {
  HVP_WRITTEN_BLUEPRINT_ID,
  hvpCuratedPracticeBlueprint,
  hvpWrittenPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { curatedExperienceSummaries } from '@/lib/assessment/curated/experienceRegistry';

describe('HVP behavior parity behind the curated adapter', () => {
  it('preserves the canonical package bytes and 120 question identities', () => {
    const bytes = readFileSync(
      'content/question-bank/opt374/human-visual-perception/bank.json',
    );
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      '029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a',
    );
    expect(humanVisualPerceptionCandidateBank.questions).toHaveLength(120);
    expect(new Set(
      humanVisualPerceptionCandidateBank.questions.map((question) => question.id),
    )).toHaveLength(120);
  });

  it('preserves automatic, written, profile, route and registry identities', () => {
    expect(hvpCuratedPracticeBlueprint.id).toBe(HVP_CURATED_BLUEPRINT_ID);
    expect(hvpWrittenPracticeBlueprint.id).toBe(HVP_WRITTEN_BLUEPRINT_ID);
    expect(hvpCuratedPracticeBlueprint.profiles.map(({ id, count }) => ({
      id,
      count,
    }))).toEqual([
      { id: 'quick', count: 10 },
      { id: 'standard', count: 25 },
      { id: 'full', count: 50 },
      { id: 'targeted', count: 10 },
    ]);
    expect(curatedExperienceSummaries()[0]).toEqual(expect.objectContaining({
      routeSegment: HVP_CURATED_PRACTICE_ID,
      blueprintIds: [HVP_CURATED_BLUEPRINT_ID, HVP_WRITTEN_BLUEPRINT_ID],
    }));
  });
});
