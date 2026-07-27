import type { QuestionBank } from '@/lib/assessment/types';
import { applicableCriteria } from './criteria';
import { buildReviewPackRows, parseCsv, REVIEW_PACK_HEADERS } from './reviewPack';
import type { AikenRating, AikenSummary, AikenValue, ReviewIssue, ReviewPackRow } from './types';

const REVIEWER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const normalizeReviewerId = (value: string): string => value.trim().toLowerCase();
type CalculatedAikenValue = { numerator: number; denominator: number; value: number; displayValue: string; ratingCount: number; minimumRating: number; maximumRating: number };
export function calculateAikenValue(ratings: number[], lowestRating = 1, highestRating = 5): CalculatedAikenValue | undefined {
  if (ratings.length === 0) return undefined;
  if (ratings.some((rating) => !Number.isInteger(rating) || rating < lowestRating || rating > highestRating)) throw new Error(`Ratings must be integers from ${lowestRating} to ${highestRating}.`);
  const numerator = ratings.reduce((sum, rating) => sum + rating - lowestRating, 0);
  const denominator = ratings.length * (highestRating - lowestRating);
  const value = numerator / denominator;
  return { numerator, denominator, value, displayValue: value.toFixed(6), ratingCount: ratings.length, minimumRating: Math.min(...ratings), maximumRating: Math.max(...ratings) };
}
function rowRecord(values: string[]): Record<(typeof REVIEW_PACK_HEADERS)[number], string> {
  return Object.fromEntries(REVIEW_PACK_HEADERS.map((header, column) => [header, values[column] ?? ''])) as Record<(typeof REVIEW_PACK_HEADERS)[number], string>;
}
function mismatch(issues: ReviewIssue[], row: number, code: string, field: string, actual: string, expected: string | number): void {
  if (actual !== String(expected)) issues.push({ code, message: `${field} "${actual}" does not match canonical value "${expected}".`, row });
}
export function parseAikenRatings(csv: string, bank: QuestionBank): { ratings: AikenRating[]; issues: ReviewIssue[] } {
  const parsed = parseCsv(csv); const issues = [...parsed.issues]; const ratings: AikenRating[] = [];
  if (!parsed.rows.length) return { ratings, issues: [...issues, { code: 'INVALID_REVIEW_HEADERS', message: 'CSV is missing the review-pack header row.' }] };
  const header = parsed.rows[0];
  if (header.values.length !== REVIEW_PACK_HEADERS.length || REVIEW_PACK_HEADERS.some((name, index) => header.values[index] !== name)) return { ratings, issues: [...issues, { code: 'INVALID_REVIEW_HEADERS', message: 'CSV headers do not match the review-pack template.', row: header.row }] };
  const expectedRows = buildReviewPackRows(bank); const expectedByQuestion = new Map<string, ReviewPackRow>();
  for (const expected of expectedRows) if (!expectedByQuestion.has(expected.questionId)) expectedByQuestion.set(expected.questionId, expected);
  const questionMap = new Map(bank.questions.map((question) => [question.id, question])); const seen = new Set<string>();
  for (const parsedRow of parsed.rows.slice(1)) {
    if (parsedRow.values.length !== REVIEW_PACK_HEADERS.length) {
      issues.push({ code: parsedRow.values.length > REVIEW_PACK_HEADERS.length ? 'UNEXPECTED_REVIEW_COLUMNS' : 'INVALID_REVIEW_ROW_WIDTH', message: `Expected ${REVIEW_PACK_HEADERS.length} columns but found ${parsedRow.values.length}.`, row: parsedRow.row });
      continue;
    }
    const raw = rowRecord(parsedRow.values); if (!raw.rating.trim()) continue; const rowNumber = parsedRow.row; const question = questionMap.get(raw.questionId);
    if (!question) { issues.push({ code: 'UNKNOWN_REVIEW_QUESTION', message: `Unknown question "${raw.questionId}".`, row: rowNumber }); continue; }
    const expected = expectedByQuestion.get(question.id)!; const rowIssueCount = issues.length;
    mismatch(issues, rowNumber, 'REVIEW_BANK_MISMATCH', 'bankId', raw.bankId, expected.bankId);
    if (!/^[1-9]\d*$/.test(raw.questionVersion)) issues.push({ code: 'INVALID_REVIEW_QUESTION_VERSION', message: `questionVersion "${raw.questionVersion}" must be a positive integer.`, row: rowNumber });
    else mismatch(issues, rowNumber, 'REVIEW_QUESTION_VERSION_MISMATCH', 'questionVersion', raw.questionVersion, expected.questionVersion);
    mismatch(issues, rowNumber, 'REVIEW_QUESTION_HASH_MISMATCH', 'questionHash', raw.questionHash, expected.questionHash);
    mismatch(issues, rowNumber, 'REVIEW_SECTION_MISMATCH', 'sectionId', raw.sectionId, expected.sectionId);
    mismatch(issues, rowNumber, 'REVIEW_OBJECTIVE_MISMATCH', 'objectiveId', raw.objectiveId, expected.objectiveId);
    mismatch(issues, rowNumber, 'REVIEW_FORMAT_MISMATCH', 'format', raw.format, expected.format);
    mismatch(issues, rowNumber, 'REVIEW_BLOOM_MISMATCH', 'bloomLevel', raw.bloomLevel, expected.bloomLevel);
    mismatch(issues, rowNumber, 'REVIEW_DIFFICULTY_MISMATCH', 'difficulty', raw.difficulty, expected.difficulty);
    const allowed = new Set(applicableCriteria(question.format).map((criterion) => criterion.id));
    if (!allowed.has(raw.criterion)) issues.push({ code: 'UNKNOWN_REVIEW_CRITERION', message: `Criterion "${raw.criterion}" is unknown or not applicable.`, row: rowNumber });
    const rating = Number(raw.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5) issues.push({ code: 'RATING_OUT_OF_RANGE', message: `Rating "${raw.rating}" must be an integer from 1 to 5.`, row: rowNumber });
    const reviewerId = normalizeReviewerId(raw.reviewerId);
    if (!reviewerId) issues.push({ code: 'MISSING_REVIEWER_ID', message: 'A rating requires a reviewerId.', row: rowNumber });
    else if (!REVIEWER_ID_PATTERN.test(reviewerId)) issues.push({ code: 'INVALID_REVIEWER_ID', message: `reviewerId "${raw.reviewerId}" must normalize to a lowercase slug.`, row: rowNumber });
    const key = `${reviewerId}|${raw.questionId}|${raw.criterion}`;
    if (reviewerId && seen.has(key)) issues.push({ code: 'DUPLICATE_REVIEW_RATING', message: `Duplicate reviewer/question/criterion row for ${key}.`, row: rowNumber });
    if (issues.length !== rowIssueCount) continue;
    seen.add(key);
    ratings.push({ ...raw, reviewerId, questionVersion: Number(raw.questionVersion), rating });
  }
  return { ratings, issues };
}
export function summarizeAikenRatings(bank: QuestionBank, ratings: AikenRating[], flagBelow = 0.8): AikenSummary {
  const groups = new Map<string, AikenRating[]>();
  for (const rating of ratings) { const key = `${rating.questionId}|${rating.criterion}`; groups.set(key, [...(groups.get(key) ?? []), rating]); }
  const values: AikenValue[] = []; const warnings: ReviewIssue[] = [];
  for (const expected of buildReviewPackRows(bank)) {
    const key = `${expected.questionId}|${expected.criterion}`; const group = groups.get(key) ?? []; const uniqueReviewers = new Set(group.map((rating) => rating.reviewerId)); const calculated = calculateAikenValue(group.map((rating) => rating.rating));
    if (!calculated) {
      values.push({ bankId: expected.bankId, questionId: expected.questionId, questionVersion: expected.questionVersion, questionHash: expected.questionHash, criterion: expected.criterion, ratingCount: 0, reviewerCount: 0, status: 'unrated' });
      warnings.push({ code: 'NO_REVIEW_RATINGS', message: `${expected.questionId}/${expected.criterion} has no review ratings.` });
      continue;
    }
    if (uniqueReviewers.size < 3) warnings.push({ code: 'INSUFFICIENT_REVIEWERS', message: `${expected.questionId}/${expected.criterion} has ${uniqueReviewers.size} unique reviewers; at least 3 are recommended.` });
    values.push({ bankId: expected.bankId, questionId: expected.questionId, questionVersion: expected.questionVersion, questionHash: expected.questionHash, criterion: expected.criterion, ...calculated, reviewerCount: uniqueReviewers.size, status: uniqueReviewers.size < 3 ? 'provisional' : calculated.value < flagBelow ? 'needs-review' : 'complete' });
  }
  const questionValues = values.filter((value) => value.criterion === 'overall-content-validity');
  const uniqueReviewers = new Set(ratings.map((rating) => rating.reviewerId)); const ratedQuestions = new Set(ratings.map((rating) => rating.questionId)); const ratedCriterionCount = values.filter((value) => value.ratingCount > 0).length;
  return { values, questionValues, warnings, coverage: { applicableCriterionCount: values.length, ratedCriterionCount, unratedCriterionCount: values.length - ratedCriterionCount, uniqueReviewerCount: uniqueReviewers.size, questionCount: bank.questions.length, questionsWithRatings: ratedQuestions.size } };
}
