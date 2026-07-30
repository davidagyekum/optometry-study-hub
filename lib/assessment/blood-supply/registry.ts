import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyBloodSupplyRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [bloodSupplyCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}
