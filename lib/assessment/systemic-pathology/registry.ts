import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlySystemicPathologyRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [systemicPathologyCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}
