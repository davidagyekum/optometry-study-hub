import { aqueousVitreousPilotBank } from '@/content/question-bank/pilot/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyAqueousPilotRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [aqueousVitreousPilotBank],
    allowedReviewStatuses: ['draft'],
  });
}
