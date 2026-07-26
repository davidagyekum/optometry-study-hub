import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';
import {
  makeApprovedPilotBank,
  makePilotBank,
} from '@/tests/fixtures/session-engine';

function codes(result: ReturnType<typeof buildQuestionRegistry>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('assessment question registry', () => {
  it('registers the draft pilot only with an explicit development allowance', () => {
    const result = buildQuestionRegistry({
      banks: [makePilotBank()],
      allowedReviewStatuses: ['draft'],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.size).toBe(9);
    expect(result.value.bankIds).toEqual(['aqueous-vitreous-pilot']);
    const entry = result.value.lookup('aqueous-flow-sba-001');
    expect(entry.ok).toBe(true);
    if (!entry.ok) return;
    expect(entry.value).toMatchObject({
      questionId: 'aqueous-flow-sba-001',
      version: 1,
      familyId: 'aqueous-conventional-outflow-sequence',
      courseId: 'neuro-anatomy',
      moduleId: 'aqueous-vitreous',
      sectionId: 'flow',
      objectiveId: 'aqueous-identify-outflow-resistance',
      reviewStatus: 'draft',
      format: 'single_best_answer',
    });
  });

  it('rejects draft questions by default and accepts approved questions by default', () => {
    expect(codes(buildQuestionRegistry({ banks: [makePilotBank()] })))
      .toContain('QUESTION_NOT_ELIGIBLE');
    const approved = buildQuestionRegistry({ banks: [makeApprovedPilotBank()] });
    expect(approved.ok).toBe(true);
    if (approved.ok) expect(approved.value.size).toBe(9);
  });

  it('requires the clearly named archival override for retired questions', () => {
    const bank = makeApprovedPilotBank();
    bank.questions[0].reviewStatus = 'retired';

    expect(codes(buildQuestionRegistry({
      banks: [bank],
      allowedReviewStatuses: ['approved', 'retired'],
    }))).toContain('QUESTION_NOT_ELIGIBLE');
    expect(buildQuestionRegistry({
      banks: [bank],
      allowedReviewStatuses: ['approved', 'retired'],
      allowRetiredForArchival: true,
    }).ok).toBe(true);
  });

  it('rejects duplicate bank IDs and duplicate question IDs across banks', () => {
    const first = makePilotBank();
    const duplicateBank = makePilotBank();
    expect(codes(buildQuestionRegistry({
      banks: [first, duplicateBank],
      allowedReviewStatuses: ['draft'],
    }))).toContain('DUPLICATE_BANK_ID');

    const secondBank = makePilotBank();
    secondBank.id = 'second-pilot-bank';
    expect(codes(buildQuestionRegistry({
      banks: [first, secondBank],
      allowedReviewStatuses: ['draft'],
    }))).toContain('DUPLICATE_QUESTION_ID');
  });

  it('distinguishes conflicting question versions or content from exact duplicates', () => {
    const first = makePilotBank();
    const conflicting = makePilotBank();
    conflicting.id = 'conflicting-pilot-bank';
    conflicting.questions[0].version = 2;

    expect(codes(buildQuestionRegistry({
      banks: [first, conflicting],
      allowedReviewStatuses: ['draft'],
    }))).toContain('QUESTION_CONFLICT');
  });

  it('returns structured errors for malformed banks and missing lookup', () => {
    const malformed = { ...makePilotBank(), schemaVersion: 2 };
    expect(codes(buildQuestionRegistry({
      banks: [malformed],
      allowedReviewStatuses: ['draft'],
    }))).toContain('MALFORMED_QUESTION_BANK');

    const built = buildQuestionRegistry({
      banks: [makePilotBank()],
      allowedReviewStatuses: ['draft'],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const missing = built.value.lookup('missing-question');
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.issues[0].code).toBe('QUESTION_NOT_FOUND');
  });

  it('provides deterministic lookup without cloning or mutation', () => {
    const built = buildQuestionRegistry({
      banks: [makePilotBank()],
      allowedReviewStatuses: ['draft'],
    });
    if (!built.ok) throw new Error('Registry should build');
    const first = built.value.lookup('aqueous-flow-sba-001');
    const second = built.value.lookup('aqueous-flow-sba-001');
    if (!first.ok || !second.ok) throw new Error('Question should resolve');
    expect(second.value).toBe(first.value);
  });

  it('keeps the pilot and session engine disconnected from the public legacy quiz', async () => {
    const source = await readFile('components/quiz/LegacyQuizView.tsx', 'utf8');
    expect(source).not.toContain('question-bank/pilot');
    expect(source).not.toContain('assessment/session');
  });
});
