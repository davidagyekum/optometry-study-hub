import type { QuestionBank } from '@/lib/assessment/types';
import { applicableCriteria } from './criteria';
import { parseCsv, REVIEW_PACK_HEADERS } from './reviewPack';
import type { AikenRating, AikenValue, ReviewIssue } from './types';

export function calculateAikenValue(ratings: number[], lowestRating = 1, highestRating = 5): Omit<AikenValue, 'questionId' | 'criterion' | 'status'> | undefined {
  if (ratings.length === 0) return undefined;
  if (ratings.some((rating) => !Number.isInteger(rating) || rating < lowestRating || rating > highestRating)) throw new Error(`Ratings must be integers from ${lowestRating} to ${highestRating}.`);
  const numerator = ratings.reduce((sum, rating) => sum + rating - lowestRating, 0); const denominator = ratings.length * (highestRating - lowestRating); const value = numerator / denominator;
  return { numerator, denominator, value, displayValue: value.toFixed(6), reviewerCount: new Set(ratings.map((_, index) => index)).size, minimumRating: Math.min(...ratings), maximumRating: Math.max(...ratings) };
}
export function parseAikenRatings(csv: string, bank: QuestionBank): { ratings: AikenRating[]; issues: ReviewIssue[] } {
  const rows = parseCsv(csv); const issues: ReviewIssue[] = []; const ratings: AikenRating[] = [];
  if (!rows.length || REVIEW_PACK_HEADERS.some((header, index) => rows[0][index] !== header)) return { ratings, issues: [{ code: 'INVALID_REVIEW_HEADERS', message: 'CSV headers do not match the review-pack template.' }] };
  const questionMap = new Map(bank.questions.map((question) => [question.id, question])); const seen = new Set<string>();
  for (let index = 1; index < rows.length; index += 1) { const values = rows[index]; const raw = Object.fromEntries(REVIEW_PACK_HEADERS.map((header, column) => [header, values[column] ?? ''])) as Record<(typeof REVIEW_PACK_HEADERS)[number], string>; if (!raw.rating.trim()) continue; const rowNumber = index + 1; const question = questionMap.get(raw.questionId); if (!question) { issues.push({ code: 'UNKNOWN_REVIEW_QUESTION', message: `Unknown question "${raw.questionId}".`, row: rowNumber }); continue; } const allowed = new Set(applicableCriteria(question.format).map((criterion) => criterion.id)); if (!allowed.has(raw.criterion)) { issues.push({ code: 'UNKNOWN_REVIEW_CRITERION', message: `Criterion "${raw.criterion}" is unknown or not applicable.`, row: rowNumber }); continue; } const rating = Number(raw.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5) { issues.push({ code: 'RATING_OUT_OF_RANGE', message: `Rating "${raw.rating}" must be an integer from 1 to 5.`, row: rowNumber }); continue; } if (!raw.reviewerId.trim()) { issues.push({ code: 'MISSING_REVIEWER_ID', message: 'A rating requires a reviewerId.', row: rowNumber }); continue; } const key = `${raw.reviewerId}|${raw.questionId}|${raw.criterion}`; if (seen.has(key)) { issues.push({ code: 'DUPLICATE_REVIEW_RATING', message: `Duplicate reviewer/question/criterion row for ${key}.`, row: rowNumber }); continue; } seen.add(key); ratings.push({ ...raw, questionVersion: Number(raw.questionVersion), rating }); }
  return { ratings, issues };
}
export function summarizeAikenRatings(ratings: AikenRating[], flagBelow = 0.8): { values: AikenValue[]; questionValues: AikenValue[]; warnings: ReviewIssue[] } {
  const groups = new Map<string, AikenRating[]>(); for (const rating of ratings) { const key = `${rating.questionId}|${rating.criterion}`; groups.set(key, [...(groups.get(key) ?? []), rating]); }
  const values: AikenValue[] = []; const warnings: ReviewIssue[] = [];
  for (const [key, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) { const [questionId, criterion] = key.split('|'); const uniqueReviewers = new Set(group.map((rating) => rating.reviewerId)); if (uniqueReviewers.size < 3) warnings.push({ code: 'INSUFFICIENT_REVIEWERS', message: `${questionId}/${criterion} has ${uniqueReviewers.size} unique reviewers; at least 3 are recommended.` }); const calculated = calculateAikenValue(group.map((rating) => rating.rating)); if (calculated) values.push({ questionId, criterion, ...calculated, reviewerCount: uniqueReviewers.size, status: calculated.value < flagBelow ? 'needs-review' : 'complete' }); }
  const questionGroups = new Map<string, AikenRating[]>();
  for (const rating of ratings) questionGroups.set(rating.questionId, [...(questionGroups.get(rating.questionId) ?? []), rating]);
  const questionValues: AikenValue[] = [...questionGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([questionId, group]) => {
    const calculated = calculateAikenValue(group.map((rating) => rating.rating));
    if (!calculated) throw new Error('A non-empty question rating group must produce a value.');
    return { questionId, criterion: 'all-applicable', ...calculated, reviewerCount: new Set(group.map((rating) => rating.reviewerId)).size, status: calculated.value < flagBelow ? 'needs-review' : 'complete' };
  });
  return { values, questionValues, warnings };
}
