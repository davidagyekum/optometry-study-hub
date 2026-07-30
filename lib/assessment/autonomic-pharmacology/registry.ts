import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyAutonomicPharmacologyRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [autonomicPharmacologyCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}
