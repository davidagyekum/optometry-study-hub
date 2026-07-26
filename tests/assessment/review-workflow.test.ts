import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { calculateAikenValue, parseAikenRatings, summarizeAikenRatings } from '@/lib/assessment/review/aikenV';
import { applicableCriteria } from '@/lib/assessment/review/criteria';
import { buildReviewPackRows, reviewRowsToCsv } from '@/lib/assessment/review/reviewPack';

const headers = 'bankId,questionId,questionVersion,sectionId,objectiveId,format,bloomLevel,difficulty,criterion,reviewerId,rating,comment';
const row = (overrides: Record<string, string> = {}) => ({ bankId: 'aqueous-vitreous-candidate', questionId: 'aqueous-flow-sba-001', questionVersion: '1', sectionId: 'flow', objectiveId: 'aqueous-identify-outflow-resistance', format: 'single_best_answer', bloomLevel: 'remember', difficulty: 'foundation', criterion: 'relevance', reviewerId: 'reviewer-a', rating: '5', comment: '', ...overrides });
const csv = (...rows: ReturnType<typeof row>[]) => `${headers}\n${rows.map((value) => Object.values(value).join(',')).join('\n')}\n`;

describe("Aiken's V", () => {
  it('calculates the required exact examples', () => { expect(calculateAikenValue([5, 5, 4])).toEqual({ numerator: 11, denominator: 12, value: 11 / 12, displayValue: '0.916667', reviewerCount: 3, minimumRating: 4, maximumRating: 5 }); expect(calculateAikenValue([1, 1, 1])?.value).toBe(0); expect(calculateAikenValue([5, 5, 5])?.value).toBe(1); expect(calculateAikenValue([])).toBeUndefined(); });
  it('handles mixed criteria and reviewer warnings', () => { const parsed = parseAikenRatings(csv(row(), row({ reviewerId: 'reviewer-b', rating: '4' }), row({ reviewerId: 'reviewer-a', criterion: 'clarity', rating: '3' })), aqueousVitreousCandidateBank); expect(parsed.issues).toEqual([]); const summary = summarizeAikenRatings(parsed.ratings); expect(summary.values).toHaveLength(2); expect(summary.warnings).toHaveLength(2); const complete = summarizeAikenRatings(parseAikenRatings(csv(row(), row({ reviewerId: 'reviewer-b' }), row({ reviewerId: 'reviewer-c' })), aqueousVitreousCandidateBank).ratings); expect(complete.warnings).toEqual([]); });
  it.each([
    ['duplicate reviewer row', csv(row(), row()), 'DUPLICATE_REVIEW_RATING'],
    ['unknown question', csv(row({ questionId: 'unknown-question' })), 'UNKNOWN_REVIEW_QUESTION'],
    ['unknown criterion', csv(row({ criterion: 'unknown-criterion' })), 'UNKNOWN_REVIEW_CRITERION'],
    ['out-of-range rating', csv(row({ rating: '6' })), 'RATING_OUT_OF_RANGE'],
  ])('rejects %s', (_label, input, code) => expect(parseAikenRatings(input, aqueousVitreousCandidateBank).issues.map((issue) => issue.code)).toContain(code));
  it('ignores missing ratings and never mutates review status', () => { const before = JSON.stringify(aqueousVitreousCandidateBank); const parsed = parseAikenRatings(csv(row({ rating: '', reviewerId: '' })), aqueousVitreousCandidateBank); expect(parsed).toEqual({ ratings: [], issues: [] }); summarizeAikenRatings(parsed.ratings); expect(JSON.stringify(aqueousVitreousCandidateBank)).toBe(before); });
});

describe('expert review pack', () => {
  it('is deterministic and contains only applicable criteria', () => { const first = buildReviewPackRows(aqueousVitreousCandidateBank); const second = buildReviewPackRows(aqueousVitreousCandidateBank); expect(reviewRowsToCsv(first)).toBe(reviewRowsToCsv(second)); expect(first).toHaveLength(302); for (const reviewRow of first) { const question = aqueousVitreousCandidateBank.questions.find((item) => item.id === reviewRow.questionId); expect(applicableCriteria(question!.format).map((criterion) => criterion.id)).toContain(reviewRow.criterion); expect(reviewRow.reviewerId).toBe(''); expect(reviewRow.rating).toBe(''); } });
  it('accepts the committed deterministic fixture', () => { const parsed = parseAikenRatings(readFileSync('tests/fixtures/review/valid-ratings.csv', 'utf8'), aqueousVitreousCandidateBank); expect(parsed.issues).toEqual([]); expect(summarizeAikenRatings(parsed.ratings).values[0]).toMatchObject({ numerator: 11, denominator: 12, displayValue: '0.916667', reviewerCount: 3 }); });
});
