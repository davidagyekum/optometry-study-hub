import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyAqueousVitreousCuratedRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [aqueousVitreousCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}