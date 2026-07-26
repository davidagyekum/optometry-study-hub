// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssessmentPilotRouter } from '@/components/assessment/pilot/AssessmentPilotRouter';
import {
  AQUEOUS_PILOT_POLICY,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { makeAttempt, makeResult } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('pilot direct-route compatibility', () => {
  it('rejects a direct subset-result URL through the integrity screen', () => {
    const attempt = makeAttempt([...AQUEOUS_PILOT_QUESTION_IDS], {
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
    });
    const result = makeResult(attempt);
    const removed = result.orderedQuestionIds.pop();
    if (removed) delete result.questionVersions[removed];
    const store = createEmptyStoreV2();
    store.assessment.results[result.id] = result;
    render(
      <AssessmentPilotRouter
        go={vi.fn()}
        resourceId={result.id}
        setStore={vi.fn()}
        store={store}
        view="assessment-result"
      />,
    );
    expect(screen.getByRole('heading', {
      name: 'Assessment result integrity check failed',
    })).toBeInTheDocument();
    expect(screen.getByText('PILOT_QUESTION_SET_MISMATCH')).toBeInTheDocument();
  });
});