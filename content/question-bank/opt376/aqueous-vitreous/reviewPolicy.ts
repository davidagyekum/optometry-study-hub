import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import { applicableCriteria, UNIVERSAL_CRITERIA } from '@/lib/assessment/review/criteria';
import type { ContentReviewPolicy } from '@/lib/assessment/review/campaignTypes';

function deepFreeze<T extends object>(value: T): Readonly<T> {
  Object.values(value).forEach((entry) => {
    if (entry && typeof entry === 'object' && !Object.isFrozen(entry)) {
      deepFreeze(entry);
    }
  });
  return Object.freeze(value);
}

export const aqueousVitreousReviewPolicy: Readonly<ContentReviewPolicy> =
  deepFreeze({
    schemaVersion: 1,
    id: 'opt376-expert-review',
    version: 1,
    minimumUniqueReviewers: 3,
    flagBelowAikenV: 0.8,
    lowRatingAtOrBelow: 2,
    requiredUniversalCriteria: UNIVERSAL_CRITERIA.map(
      (criterion) => criterion.id,
    ),
    requiredFormatCriteria: Object.fromEntries(
      QUESTION_FORMATS.map((format) => [
        format,
        applicableCriteria(format)
          .map((criterion) => criterion.id)
          .filter(
            (criterion) =>
              !UNIVERSAL_CRITERIA.some((universal) => universal.id === criterion),
          ),
      ]),
    ) as ContentReviewPolicy['requiredFormatCriteria'],
    blockingCriteria: ['factual-accuracy', 'image-rights'],
  });
