import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyTissueRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [tissueFoundationsCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}
