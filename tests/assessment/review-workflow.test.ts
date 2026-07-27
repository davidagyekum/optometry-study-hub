import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { calculateAikenValue, normalizeReviewerId, parseAikenRatings, summarizeAikenRatings } from '@/lib/assessment/review/aikenV';
import { applicableCriteria } from '@/lib/assessment/review/criteria';
import type { SourceReference } from '@/lib/assessment/types';
import { buildReviewDossier, buildReviewPackRows, criterionEvidence, REVIEW_PACK_HEADERS, reviewDossierMarkdown, reviewQuestionHash, reviewRowsToCsv } from '@/lib/assessment/review/reviewPack';

const canonicalRow = buildReviewPackRows(aqueousVitreousCandidateBank).find((entry) => entry.questionId === 'aqueous-flow-sba-001' && entry.criterion === 'overall-content-validity')!;
const stringRow = (overrides: Record<string, string> = {}): Record<string, string> => ({ ...Object.fromEntries(Object.entries(canonicalRow).map(([key, value]) => [key, String(value)])), reviewerId: 'reviewer-a', rating: '5', comment: '', ...overrides });
const escape = (value: string) => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
const csv = (...rows: Record<string, string>[]) => `${REVIEW_PACK_HEADERS.join(',')}\n${rows.map((entry) => REVIEW_PACK_HEADERS.map((header) => escape(entry[header] ?? '')).join(',')).join('\n')}\n`;

describe("Aiken's V", () => {
  it('calculates the required exact examples with a rating count', () => {
    expect(calculateAikenValue([5, 5, 4])).toEqual({ numerator: 11, denominator: 12, value: 11 / 12, displayValue: '0.916667', ratingCount: 3, minimumRating: 4, maximumRating: 5 });
    expect(calculateAikenValue([1, 1, 1])?.value).toBe(0); expect(calculateAikenValue([5, 5, 5])?.value).toBe(1); expect(calculateAikenValue([])).toBeUndefined();
  });
  it('builds the complete expected matrix for zero, one, two, and three reviewers', () => {
    const empty = summarizeAikenRatings(aqueousVitreousCandidateBank, []);
    expect(empty.coverage).toMatchObject({ applicableCriterionCount: 338, ratedCriterionCount: 0, unratedCriterionCount: 338, uniqueReviewerCount: 0, questionsWithRatings: 0 });
    expect(empty.values).toHaveLength(338); expect(empty.questionValues).toHaveLength(36); expect(empty.warnings.every((issue) => issue.code === 'NO_REVIEW_RATINGS')).toBe(true);
    for (const count of [1, 2, 3]) {
      const rows = Array.from({ length: count }, (_, index) => stringRow({ reviewerId: `reviewer-${String.fromCharCode(97 + index)}`, rating: index === 2 ? '4' : '5' }));
      const parsed = parseAikenRatings(csv(...rows), aqueousVitreousCandidateBank); expect(parsed.issues).toEqual([]);
      const summary = summarizeAikenRatings(aqueousVitreousCandidateBank, parsed.ratings); const value = summary.questionValues.find((entry) => entry.questionId === canonicalRow.questionId)!;
      expect(value.reviewerCount).toBe(count); expect(value.status).toBe(count < 3 ? 'provisional' : 'complete');
      expect(summary.warnings.some((issue) => issue.code === 'INSUFFICIENT_REVIEWERS' && issue.message.includes('overall-content-validity'))).toBe(count < 3);
    }
  });
  it('uses only overall content validity for per-question V and never pools criteria', () => {
    const rows = [
      stringRow({ criterion: 'overall-content-validity', rating: '5' }),
      stringRow({ criterion: 'relevance', rating: '1' }),
    ];
    const parsed = parseAikenRatings(csv(...rows), aqueousVitreousCandidateBank); expect(parsed.issues).toEqual([]);
    const summary = summarizeAikenRatings(aqueousVitreousCandidateBank, parsed.ratings);
    expect(summary.questionValues.find((entry) => entry.questionId === canonicalRow.questionId)?.value).toBe(1);
    expect(summary.values.find((entry) => entry.questionId === canonicalRow.questionId && entry.criterion === 'relevance')?.value).toBe(0);
    expect(summary.values.some((entry) => entry.criterion === 'all-applicable')).toBe(false);
  });
});

describe('exact review evidence binding', () => {
  it('binds deterministic hashes to question, objective, and source identities', () => {
    const question = aqueousVitreousCandidateBank.questions[0]; const objective = aqueousVitreousCandidateBank.objectives.find((entry) => entry.id === question.objectiveId)!;
    const first = reviewQuestionHash(question, objective, aqueousVitreousCandidateBank.sources); const second = reviewQuestionHash(question, objective, aqueousVitreousCandidateBank.sources);
    expect(first).toBe(second); expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(reviewQuestionHash({ ...question, explanation: `${question.explanation} changed` }, objective, aqueousVitreousCandidateBank.sources)).not.toBe(first);
    expect(reviewQuestionHash(question, { ...objective, statement: `${objective.statement} changed` }, aqueousVitreousCandidateBank.sources)).not.toBe(first);
    expect(reviewQuestionHash(question, objective, aqueousVitreousCandidateBank.sources.map((source) => source.id === question.sources[0].id ? { ...source, title: `${source.title} changed` } : source))).not.toBe(first);
  });
  it.each([
    ['REVIEW_BANK_MISMATCH', { bankId: 'different-bank' }],
    ['REVIEW_QUESTION_VERSION_MISMATCH', { questionVersion: '2' }],
    ['REVIEW_QUESTION_HASH_MISMATCH', { questionHash: '0'.repeat(64) }],
    ['REVIEW_SECTION_MISMATCH', { sectionId: 'iop' }],
    ['REVIEW_OBJECTIVE_MISMATCH', { objectiveId: 'aqueous-explain-production' }],
    ['REVIEW_FORMAT_MISMATCH', { format: 'ordering' }],
    ['REVIEW_BLOOM_MISMATCH', { bloomLevel: 'apply' }],
    ['REVIEW_DIFFICULTY_MISMATCH', { difficulty: 'advanced' }],
    ['INVALID_REVIEW_QUESTION_VERSION', { questionVersion: '1.5' }],
    ['INVALID_REVIEW_QUESTION_VERSION', { questionVersion: '0' }],
  ])('rejects stale or edited metadata with %s', (code, overrides) => expect(parseAikenRatings(csv(stringRow(overrides)), aqueousVitreousCandidateBank).issues.map((issue) => issue.code)).toContain(code));
});

describe('review CSV integrity and reviewer identity', () => {
  it('normalizes reviewer IDs to lowercase stable slugs before storage and counting', () => {
    expect(normalizeReviewerId(' Reviewer-A ')).toBe('reviewer-a');
    const parsed = parseAikenRatings(csv(stringRow({ reviewerId: ' Reviewer-A ' })), aqueousVitreousCandidateBank);
    expect(parsed.issues).toEqual([]); expect(parsed.ratings[0].reviewerId).toBe('reviewer-a');
  });
  it('does not count whitespace or case variants as different reviewers', () => {
    const parsed = parseAikenRatings(csv(stringRow({ reviewerId: 'reviewer-a' }), stringRow({ reviewerId: ' Reviewer-A ' })), aqueousVitreousCandidateBank);
    expect(parsed.issues.map((issue) => issue.code)).toContain('DUPLICATE_REVIEW_RATING');
  });
  it.each([
    ['fewer columns', `${REVIEW_PACK_HEADERS.join(',')}\nonly,two\n`, 'INVALID_REVIEW_ROW_WIDTH'],
    ['extra columns', `${REVIEW_PACK_HEADERS.join(',')}\n${REVIEW_PACK_HEADERS.map(() => '').join(',')},extra\n`, 'UNEXPECTED_REVIEW_COLUMNS'],
    ['unterminated quote', `${REVIEW_PACK_HEADERS.join(',')}\n"unterminated`, 'UNTERMINATED_CSV_QUOTE'],
    ['malformed reviewer ID', csv(stringRow({ reviewerId: 'reviewer_name!' })), 'INVALID_REVIEWER_ID'],
  ])('rejects %s with a deterministic row issue', (_label, input, code) => { const issue = parseAikenRatings(input, aqueousVitreousCandidateBank).issues.find((entry) => entry.code === code); expect(issue?.row).toBeGreaterThanOrEqual(2); });
  it('rejects duplicate, unknown, and invalid ratings', () => {
    expect(parseAikenRatings(csv(stringRow(), stringRow()), aqueousVitreousCandidateBank).issues.map((issue) => issue.code)).toContain('DUPLICATE_REVIEW_RATING');
    expect(parseAikenRatings(csv(stringRow({ questionId: 'unknown-question' })), aqueousVitreousCandidateBank).issues.map((issue) => issue.code)).toContain('UNKNOWN_REVIEW_QUESTION');
    expect(parseAikenRatings(csv(stringRow({ criterion: 'unknown-criterion' })), aqueousVitreousCandidateBank).issues.map((issue) => issue.code)).toContain('UNKNOWN_REVIEW_CRITERION');
    expect(parseAikenRatings(csv(stringRow({ rating: '6' })), aqueousVitreousCandidateBank).issues.map((issue) => issue.code)).toContain('RATING_OUT_OF_RANGE');
  });
});

describe('self-contained expert review dossier', () => {
  it('is deterministic, contains 338 applicable rows, and retains evidence hashes', () => {
    const first = buildReviewPackRows(aqueousVitreousCandidateBank); const second = buildReviewPackRows(aqueousVitreousCandidateBank);
    expect(reviewRowsToCsv(first)).toBe(reviewRowsToCsv(second)); expect(first).toHaveLength(338); expect(new Set(first.map((entry) => entry.questionHash)).size).toBe(36);
    for (const reviewRow of first) { const question = aqueousVitreousCandidateBank.questions.find((item) => item.id === reviewRow.questionId)!; expect(applicableCriteria(question.format).map((criterion) => criterion.id)).toContain(reviewRow.criterion); expect(reviewRow.reviewerId).toBe(''); expect(reviewRow.rating).toBe(''); }
  });
  it('contains complete question structures, objectives, sources, answers, and criterion evidence', () => {
    const dossier = buildReviewDossier(aqueousVitreousCandidateBank) as { questions: { question: typeof aqueousVitreousCandidateBank.questions[number]; objective: { statement: string }; sources: SourceReference[]; applicableCriteria: { id: string; definition?: string; evidence: object }[]; imageAudit?: { rightsStatus: string } }[] };
    expect(dossier.questions).toHaveLength(36);
    for (const item of dossier.questions) {
      expect(item.question.stem).toBeDefined(); expect(item.question.explanation).toBeTruthy(); expect(item.objective.statement).toBeTruthy(); expect(item.sources.every((source) => source.title)).toBe(true);
      for (const criterion of applicableCriteria(item.question.format)) {
        const evidence = criterionEvidence(item.question, criterion, item.sources) as Record<string, unknown>; expect(Object.keys(evidence).length).toBeGreaterThan(0);
        if (['overall-content-validity', 'relevance', 'factual-accuracy', 'clarity', 'objective-alignment', 'bloom-alignment', 'source-traceability'].includes(criterion.id)) expect(evidence).toMatchObject({ stem: item.question.stem, objectiveId: item.question.objectiveId, sources: item.sources });
        if (criterion.id === 'distractor-quality') { expect(evidence.options).toBeDefined(); expect(evidence.correctAnswer).toBeDefined(); }
        if (criterion.id === 'rationale-quality') { expect(evidence.question).toEqual(item.question); expect(evidence.correctAnswer).toBeDefined(); }
        if (criterion.id === 'component-independence') { expect(evidence.components).toBeDefined(); expect(evidence.correctAnswer).toBeDefined(); }
        if (criterion.id.startsWith('image-')) { expect(evidence.path).toBeTruthy(); expect(evidence.alt).toBeTruthy(); expect(evidence.coordinates).toBeDefined(); expect(evidence.rightsStatus).toMatch(/^attributed-/); }
        if (criterion.id === 'rubric-quality') { expect(evidence.rubric).toBeDefined(); expect(evidence.sampleAnswer).toBeTruthy(); }
      }
      if ('table' in item.question && item.question.table) expect(item.question.table.rows.length).toBeGreaterThan(0);
      if ('image' in item.question) expect(item.imageAudit?.rightsStatus).toMatch(/^attributed-/);
      if (item.question.format === 'open_response') { expect(item.question.sampleAnswer).toBeTruthy(); expect(item.question.rubric.length).toBeGreaterThan(0); }
      if (item.question.format === 'short_answer') expect(item.question.acceptedAnswers.length).toBeGreaterThan(0);
    }
    const markdown = reviewDossierMarkdown(aqueousVitreousCandidateBank); expect(markdown).toContain('expert-review items'); expect(markdown).toContain('correctOptionId'); expect(markdown).toContain('correctMatches'); expect(markdown).toContain('rubric'); expect(markdown).toContain('rightsStatus');
  });
  it('includes objective-only source identities in dossier, criterion, and image evidence', () => {
    const dossier = buildReviewDossier(aqueousVitreousCandidateBank) as { questions: { question: typeof aqueousVitreousCandidateBank.questions[number]; sources: { id: string }[]; applicableCriteria: { id: string; evidence: { sources: { id: string }[] } }[]; imageAudit?: { sourceCandidates: { id: string }[] } }[] };
    const item = dossier.questions.find((entry) => entry.question.id === 'aqueous-chambers-label-001'); expect(item).toBeDefined();
    const objectiveOnlySourceId = 'ncbi-eye-anatomy';
    expect(item?.question.sources.map((source) => source.id)).not.toContain(objectiveOnlySourceId);
    expect(item?.sources.map((source) => source.id)).toContain(objectiveOnlySourceId);
    for (const criterion of item?.applicableCriteria ?? []) expect(criterion.evidence.sources.map((source) => source.id)).toContain(objectiveOnlySourceId);
    expect(item?.imageAudit?.sourceCandidates.map((source) => source.id)).toContain(objectiveOnlySourceId);
  });
  it('accepts the committed deterministic fixture', () => {
    const parsed = parseAikenRatings(readFileSync('tests/fixtures/review/valid-ratings.csv', 'utf8'), aqueousVitreousCandidateBank); expect(parsed.issues).toEqual([]);
    expect(summarizeAikenRatings(aqueousVitreousCandidateBank, parsed.ratings).questionValues.find((value) => value.questionId === canonicalRow.questionId)).toMatchObject({ numerator: 11, denominator: 12, displayValue: '0.916667', reviewerCount: 3, ratingCount: 3 });
  });
});
