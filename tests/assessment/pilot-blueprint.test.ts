import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { aqueousVitreousPilotBank } from '@/content/question-bank/pilot/bank';
import {
  AQUEOUS_PILOT_BLUEPRINT_ID,
} from '@/lib/assessment/pilot/config';
import {
  AQUEOUS_PILOT_COURSE_ID,
  AQUEOUS_PILOT_MODULE_ID,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import { buildDraftOnlyAqueousPilotRegistry } from '@/lib/assessment/pilot/registry';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';

describe('controlled pilot blueprint', () => {
  it('uses the explicit nine authored IDs and a draft-only registry boundary', () => {
    expect(AQUEOUS_PILOT_QUESTION_IDS).toEqual(
      aqueousVitreousPilotBank.questions.map((question) => question.id),
    );
    const pilotRegistry = buildDraftOnlyAqueousPilotRegistry();
    expect(pilotRegistry.ok).toBe(true);
    expect(buildQuestionRegistry({ banks: [aqueousVitreousPilotBank] }).ok).toBe(false);
  });

  it('creates a nine-question Study attempt locked to diagnostic@1', () => {
    const registry = buildDraftOnlyAqueousPilotRegistry();
    if (!registry.ok) throw new Error('pilot registry should build');
    const created = createAssessmentAttempt({
      registry: registry.value,
      questionIds: [...AQUEOUS_PILOT_QUESTION_IDS],
      mode: 'study',
      courseId: AQUEOUS_PILOT_COURSE_ID,
      moduleId: AQUEOUS_PILOT_MODULE_ID,
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
      random: () => 0.25,
      now: () => new Date('2026-07-26T10:00:00.000Z'),
      idFactory: () => 'attempt-pilot-test',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.orderedQuestionIds).toHaveLength(9);
    expect(created.value.blueprintId).toBe(AQUEOUS_PILOT_BLUEPRINT_ID);
    expect(created.value.mode).toBe('study');
    expect(created.value.gradingPolicy).toEqual({ id: 'diagnostic', version: 1 });
    expect(created.value.draftResponses).toEqual({});
  });

  it('keeps ordinary legacy surfaces outside pilot and grading imports', async () => {
    const ordinaryPaths = [
      'components/quiz/LegacyQuizView.tsx',
      'components/results/LegacyResultsView.tsx',
      'components/course/CourseView.tsx',
      'components/home/HomeView.tsx',
    ];
    const sources = await Promise.all(ordinaryPaths.map((path) => readFile(path, 'utf8')));
    sources.forEach((source) => {
      expect(source).not.toContain('question-bank/pilot');
      expect(source).not.toContain('assessment/grading');
    });
    const appSource = await readFile('app/StudyApp.tsx', 'utf8');
    expect(appSource).toContain("lazy(() => (");
    expect(appSource).toContain('isAssessmentPilotEnabled');
    expect(appSource).not.toContain('question-bank/pilot');
  });
});
