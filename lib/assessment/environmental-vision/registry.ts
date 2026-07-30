import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import {
  buildQuestionRegistry,
  type QuestionRegistry,
} from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';

export function buildDraftOnlyEnvironmentalVisionRegistry(): SessionResult<QuestionRegistry> {
  return buildQuestionRegistry({
    banks: [environmentalVisionCandidateBank],
    allowedReviewStatuses: ['draft'],
  });
}
