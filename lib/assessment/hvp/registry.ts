import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyHvpRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [humanVisualPerceptionCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}
