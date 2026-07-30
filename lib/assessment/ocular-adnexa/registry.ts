import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyOcularAdnexaRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [ocularAdnexaCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}
