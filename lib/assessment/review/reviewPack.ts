import type { QuestionBank } from '@/lib/assessment/types';
import { applicableCriteria } from './criteria';
import type { ReviewPackRow } from './types';

export const REVIEW_PACK_HEADERS = ['bankId', 'questionId', 'questionVersion', 'sectionId', 'objectiveId', 'format', 'bloomLevel', 'difficulty', 'criterion', 'reviewerId', 'rating', 'comment'] as const;
export function buildReviewPackRows(bank: QuestionBank): ReviewPackRow[] {
  return bank.questions.flatMap((question) => applicableCriteria(question.format).map((criterion) => ({ bankId: bank.id, questionId: question.id, questionVersion: question.version, sectionId: question.sectionId, objectiveId: question.objectiveId, format: question.format, bloomLevel: question.bloomLevel, difficulty: question.difficulty, criterion: criterion.id, reviewerId: '', rating: '', comment: '' })));
}
const escapeCsv = (value: string | number) => { const text = String(value); return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; };
export function reviewRowsToCsv(rows: ReviewPackRow[]): string { return `${REVIEW_PACK_HEADERS.join(',')}\n${rows.map((row) => REVIEW_PACK_HEADERS.map((header) => escapeCsv(row[header])).join(',')).join('\n')}\n`; }
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index]; if (quoted) { if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; } else if (char === '"') quoted = false; else field += char; } else if (char === '"') quoted = true; else if (char === ',') { row.push(field); field = ''; } else if (char === '\n') { row.push(field.replace(/\r$/, '')); if (row.some((value) => value !== '')) rows.push(row); row = []; field = ''; } else field += char; }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); if (row.some((value) => value !== '')) rows.push(row); }
  return rows;
}
export function reviewGuide(bank: QuestionBank): string { return `# Expert content review guide\n\nBank: ${bank.title} (${bank.questions.length} draft questions)\n\nUse this project review scale for each applicable criterion:\n\n1 — unacceptable\n2 — major revision required\n3 — usable with revision\n4 — strong\n5 — excellent\n\nEnter a stable reviewer ID, one integer rating from 1 to 5, and an optional comment. Omit a criterion row when it is not applicable; do not enter a fake numerical value. Ratings support discussion and do not change review status or constitute academic approval.\n`; }
export function questionSummary(bank: QuestionBank): object { return { bankId: bank.id, title: bank.title, generatedFromVersionedSource: true, questions: bank.questions.map((q) => ({ id: q.id, version: q.version, sectionId: q.sectionId, objectiveId: q.objectiveId, format: q.format, bloomLevel: q.bloomLevel, difficulty: q.difficulty, stem: q.stem, explanation: q.explanation, noteAnchor: q.noteAnchor, sourceIds: q.sources.map((source) => source.id), criteria: applicableCriteria(q.format).map((criterion) => criterion.id) })) }; }
