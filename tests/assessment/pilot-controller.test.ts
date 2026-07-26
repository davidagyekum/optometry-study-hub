import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  AQUEOUS_PILOT_BLUEPRINT_ID,
} from '@/lib/assessment/pilot/config';
import {
  AQUEOUS_PILOT_COURSE_ID,
  AQUEOUS_PILOT_MODULE_ID,
  AQUEOUS_PILOT_POLICY,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import { buildDraftOnlyAqueousPilotRegistry } from '@/lib/assessment/pilot/registry';
import {
  selectActiveAqueousPilotAttempt,
  selectAqueousPilotAttemptById,
  selectLatestCompatibleAqueousPilotResult,
} from '@/lib/assessment/pilot/selectors';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { updateAttemptDraftResponse } from '@/lib/assessment/session/draftResponses';
import {
  finalizeAssessmentStore,
  getActiveAssessmentAttempt,
  putActiveAssessmentAttempt,
} from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { storeV2Schema } from '@/lib/storage/schemas';

describe('controlled pilot persistence flow', () => {
  it('starts, resumes, reloads drafts, submits atomically, and preserves legacy/history state', () => {
    const registryResult = buildDraftOnlyAqueousPilotRegistry();
    if (!registryResult.ok) throw new Error('pilot registry should build');
    const registry = registryResult.value;
    const created = createAssessmentAttempt({
      registry,
      questionIds: [...AQUEOUS_PILOT_QUESTION_IDS],
      mode: 'study',
      courseId: AQUEOUS_PILOT_COURSE_ID,
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
      random: () => 0.999,
      now: () => new Date('2026-07-26T12:00:00.000Z'),
      idFactory: () => 'attempt-controller',
    });
    if (!created.ok) throw new Error('pilot attempt should create');
    const multiple = registry.get('aqueous-production-mr-001');
    if (!multiple || multiple.format !== 'multiple_response') {
      throw new Error('multiple-response pilot question should exist');
    }
    const drafted = updateAttemptDraftResponse({
      attempt: created.value,
      registry,
      questionId: multiple.id,
      draft: {
        format: multiple.format,
        optionIds: [multiple.options[0].id],
      },
    });
    if (!drafted.ok) throw new Error('partial draft should persist');

    const base = createEmptyStoreV2();
    base.read[AQUEOUS_PILOT_MODULE_ID] = ['flow'];
    base.results[AQUEOUS_PILOT_MODULE_ID] = [{
      id: 'legacy-result',
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      startedAt: '2026-07-25T10:00:00.000Z',
      submittedAt: '2026-07-25T10:30:00.000Z',
      order: ['legacy-question'],
      optionOrder: {},
      answers: {},
      flags: [],
      current: 0,
      score: 40,
      total: 50,
    }];
    base.assessment.questionHistory['history-one'] = {
      questionId: 'history-one',
      version: 1,
      attemptCount: 2,
      correctCount: 1,
    };
    const inserted = putActiveAssessmentAttempt(base, drafted.value.id, drafted.value);
    if (!inserted.ok) throw new Error('active pilot should store');

    const reloaded = storeV2Schema.parse(JSON.parse(JSON.stringify(inserted.value)));
    const selected = selectActiveAqueousPilotAttempt(reloaded, registry);
    expect(selected.compatibleAttempt?.id).toBe(drafted.value.id);
    const resumed = getActiveAssessmentAttempt(reloaded, drafted.value.id);
    if (!resumed.ok) throw new Error('active pilot should resume');
    expect(resumed.value.draftResponses?.[multiple.id]).toEqual({
      format: multiple.format,
      optionIds: [multiple.options[0].id],
    });
    expect(resumed.value.responses[multiple.id]).toBeUndefined();

    const finalized = finalizeGradedAssessmentAttempt({
      attempt: resumed.value,
      registry,
      now: () => new Date('2026-07-26T12:30:00.000Z'),
      idFactory: () => 'result-controller',
    });
    if (!finalized.ok) throw new Error('incomplete pilot should still finalize');
    expect('draftResponses' in finalized.value.result).toBe(false);
    expect(finalized.value.report.unansweredCount).toBe(9);

    const stored = finalizeAssessmentStore(
      reloaded,
      resumed.value.id,
      finalized.value.result.id,
      finalized.value.result,
    );
    expect(stored.ok).toBe(true);
    if (!stored.ok) return;
    expect(stored.value.assessment.activeAttempts[resumed.value.id]).toBeUndefined();
    expect(stored.value.assessment.results[finalized.value.result.id]).toBeDefined();
    expect(stored.value.assessment.questionHistory).toEqual(base.assessment.questionHistory);
    expect(stored.value.results).toEqual(base.results);
    expect(stored.value.read).toEqual(base.read);
    expect(selectLatestCompatibleAqueousPilotResult(stored.value, registry)?.id)
      .toBe(finalized.value.result.id);
  });

  it('does not mistake an unrelated attempt or nonmatching result for this pilot', () => {
    const registryResult = buildDraftOnlyAqueousPilotRegistry();
    if (!registryResult.ok) throw new Error('pilot registry should build');
    const store = createEmptyStoreV2();
    const created = createAssessmentAttempt({
      registry: registryResult.value,
      questionIds: [...AQUEOUS_PILOT_QUESTION_IDS],
      mode: 'study',
      courseId: AQUEOUS_PILOT_COURSE_ID,
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      allowedReviewStatuses: ['draft'],
      idFactory: () => 'attempt-unrelated',
    });
    if (!created.ok) throw new Error('fixture should create');
    store.assessment.activeAttempts[created.value.id] = created.value;
    const selected = selectActiveAqueousPilotAttempt(store, registryResult.value);
    expect(selected.compatibleAttempt).toBeUndefined();
    expect(selected.candidates).toHaveLength(0);
    expect(selectLatestCompatibleAqueousPilotResult(store, registryResult.value)).toBeUndefined();
  });
  it('retains incompatible pilot candidates and diagnoses multiple active pilots', () => {
    const registryResult = buildDraftOnlyAqueousPilotRegistry();
    if (!registryResult.ok) throw new Error('pilot registry should build');
    const first = createAssessmentAttempt({
      registry: registryResult.value,
      questionIds: [...AQUEOUS_PILOT_QUESTION_IDS],
      mode: 'study',
      courseId: AQUEOUS_PILOT_COURSE_ID,
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
      allowedReviewStatuses: ['draft'],
      idFactory: () => 'pilot-one',
    });
    if (!first.ok) throw new Error('fixture should create');
    const incompatible = { ...first.value, mode: 'exam' as const };
    const store = createEmptyStoreV2();
    store.assessment.activeAttempts[incompatible.id] = incompatible;

    const selected = selectActiveAqueousPilotAttempt(store, registryResult.value);
    expect(selected.candidates.map((candidate) => candidate.id)).toEqual(['pilot-one']);
    expect(selected.compatibleAttempt).toBeUndefined();
    expect(selected.issues.map((issue) => issue.code)).toContain('PILOT_MODE_MISMATCH');

    store.assessment.activeAttempts['pilot-two'] = { ...first.value, id: 'pilot-two' };
    const multiple = selectActiveAqueousPilotAttempt(store, registryResult.value);
    expect(multiple.candidates).toHaveLength(2);
    expect(multiple.compatibleAttempt).toBeUndefined();
    expect(multiple.issues.map((issue) => issue.code))
      .toContain('PILOT_MULTIPLE_ACTIVE_ATTEMPTS');
  });

  it('does not expose an unrelated direct-route assessment as a pilot candidate', () => {
    const registryResult = buildDraftOnlyAqueousPilotRegistry();
    if (!registryResult.ok) throw new Error('pilot registry should build');
    const unrelated = createAssessmentAttempt({
      registry: registryResult.value,
      questionIds: [...AQUEOUS_PILOT_QUESTION_IDS],
      mode: 'study',
      courseId: AQUEOUS_PILOT_COURSE_ID,
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      allowedReviewStatuses: ['draft'],
      idFactory: () => 'unrelated-direct',
    });
    if (!unrelated.ok) throw new Error('fixture should create');
    const store = createEmptyStoreV2();
    store.assessment.activeAttempts[unrelated.value.id] = unrelated.value;
    const selected = selectAqueousPilotAttemptById(
      store,
      registryResult.value,
      unrelated.value.id,
    );
    expect(selected.candidates).toHaveLength(0);
    expect(selected.issues.map((issue) => issue.code))
      .toContain('PILOT_BLUEPRINT_MISMATCH');
  });
});
