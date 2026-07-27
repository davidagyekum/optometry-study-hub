import { createHash } from 'node:crypto';
import type { AssessmentQuestion, LearningObjective, QuestionBank, SourceReference } from '@/lib/assessment/types';
import { applicableCriteria } from './criteria';
import type { ReviewCriterion, ReviewIssue, ReviewPackRow } from './types';

export const REVIEW_PACK_HEADERS = ['bankId', 'questionId', 'questionVersion', 'questionHash', 'sectionId', 'objectiveId', 'format', 'bloomLevel', 'difficulty', 'criterion', 'reviewerId', 'rating', 'comment'] as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, stableValue(entry)]));
  return value;
}
export function reviewQuestionHash(question: AssessmentQuestion, objective: LearningObjective, bankSources: SourceReference[]): string {
  const sourceIds = new Set([...question.sources.map((source) => source.id), ...objective.sourceIds]);
  const sourceIdentities = bankSources.filter((source) => sourceIds.has(source.id)).map((source) => ({ id: source.id, title: source.title, locator: source.locator, url: source.url, kind: source.kind }));
  const evidence = stableValue({ question, objective, sourceIdentities });
  return createHash('sha256').update(JSON.stringify(evidence), 'utf8').digest('hex');
}
export function buildReviewPackRows(bank: QuestionBank): ReviewPackRow[] {
  const objectiveMap = new Map(bank.objectives.map((objective) => [objective.id, objective]));
  return bank.questions.flatMap((question) => {
    const objective = objectiveMap.get(question.objectiveId);
    if (!objective) throw new Error(`Question ${question.id} has no canonical objective.`);
    const questionHash = reviewQuestionHash(question, objective, bank.sources);
    return applicableCriteria(question.format).map((criterion) => ({ bankId: bank.id, questionId: question.id, questionVersion: question.version, questionHash, sectionId: question.sectionId, objectiveId: question.objectiveId, format: question.format, bloomLevel: question.bloomLevel, difficulty: question.difficulty, criterion: criterion.id, reviewerId: '', rating: '', comment: '' }));
  });
}
const escapeCsv = (value: string | number) => { const text = String(value); return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; };
export function reviewRowsToCsv(rows: ReviewPackRow[]): string { return `${REVIEW_PACK_HEADERS.join(',')}\n${rows.map((row) => REVIEW_PACK_HEADERS.map((header) => escapeCsv(row[header])).join(',')).join('\n')}\n`; }

export type ParsedCsv = { rows: { values: string[]; row: number }[]; issues: ReviewIssue[] };
export function parseCsv(text: string): ParsedCsv {
  const rows: ParsedCsv['rows'] = []; const issues: ReviewIssue[] = []; let values: string[] = []; let field = ''; let quoted = false; let closedQuote = false; let line = 1; let rowStart = 1;
  const finishRow = () => { values.push(field); if (values.some((value) => value !== '')) rows.push({ values, row: rowStart }); values = []; field = ''; closedQuote = false; rowStart = line + 1; };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else { field += char; if (char === '\n') line += 1; }
      continue;
    }
    if (closedQuote && char !== ',' && char !== '\n' && char !== '\r') { issues.push({ code: 'INVALID_CSV_QUOTE', message: 'Unexpected text follows a closing quote.', row: line }); closedQuote = false; }
    if (char === '"') {
      if (field.length > 0) issues.push({ code: 'INVALID_CSV_QUOTE', message: 'A quoted field must begin at the start of a field.', row: line });
      quoted = true;
    } else if (char === ',') { values.push(field); field = ''; closedQuote = false; }
    else if (char === '\n') { finishRow(); line += 1; }
    else if (char !== '\r') field += char;
  }
  if (quoted) issues.push({ code: 'UNTERMINATED_CSV_QUOTE', message: 'Quoted CSV field is not terminated.', row: rowStart });
  if (field || values.length) finishRow();
  return { rows, issues };
}

function imageAudit(question: AssessmentQuestion): object | undefined {
  if (!('image' in question)) return undefined;
  const knownAsset = question.image.src.includes('05-vitreous-anatomy')
    ? { attribution: 'National Eye Institute existing module figure', rightsStatus: 'attributed-nei-asset-pending-expert-confirmation' }
    : { attribution: 'OpenStax or course-attributed existing anterior-segment figure', rightsStatus: 'attributed-educational-asset-pending-expert-confirmation' };
  return {
    path: question.image.src,
    alt: question.image.alt,
    width: question.image.width,
    height: question.image.height,
    coordinates: question.format === 'image_hotspot' ? question.regions : question.targets,
    ...knownAsset,
    auditNote: 'Existing attributed educational asset; source attribution, reuse basis, and coordinates require expert confirmation before approval.',
    sourceCandidates: question.sources.map((source) => ({ id: source.id, title: source.title, url: source.url })),
  };
}
export function criterionEvidence(question: AssessmentQuestion, criterion: ReviewCriterion): object {
  const common = { stem: question.stem, explanation: question.explanation, objectiveId: question.objectiveId, bloomLevel: question.bloomLevel, difficulty: question.difficulty, sources: question.sources };
  switch (criterion.id) {
    case 'distractor-quality': return { options: 'options' in question ? question.options : 'choices' in question ? question.choices : undefined, correctAnswer: correctAnswer(question) };
    case 'rationale-quality': return { question, correctAnswer: correctAnswer(question) };
    case 'component-independence': return { components: componentEvidence(question), correctAnswer: correctAnswer(question) };
    case 'image-accessibility': case 'image-coordinate-accuracy': case 'image-rights': return imageAudit(question) ?? {};
    case 'rubric-quality': return question.format === 'open_response' ? { rubric: question.rubric, sampleAnswer: question.sampleAnswer } : {};
    default: return common;
  }
}
function componentEvidence(question: AssessmentQuestion): unknown {
  switch (question.format) {
    case 'single_best_answer': case 'multiple_response': return question.options;
    case 'ordering': return question.items;
    case 'matching': return { prompts: question.prompts, choices: question.choices };
    case 'extended_matching': return { stems: question.stems, options: question.options };
    case 'image_label': return { targets: question.targets, labels: question.labels };
    default: return question;
  }
}
function correctAnswer(question: AssessmentQuestion): unknown {
  switch (question.format) {
    case 'single_best_answer': return { correctOptionId: question.correctOptionId };
    case 'multiple_response': return { correctOptionIds: question.correctOptionIds };
    case 'ordering': return { correctOrder: question.correctOrder };
    case 'matching': return { correctMatches: question.correctMatches };
    case 'extended_matching': return { correctAnswers: question.correctAnswers };
    case 'image_hotspot': return { correctRegionIds: question.correctRegionIds };
    case 'image_label': return { correctLabels: question.correctLabels };
    case 'short_answer': return { acceptedAnswers: question.acceptedAnswers, normalization: question.normalization };
    case 'open_response': return { sampleAnswer: question.sampleAnswer, rubric: question.rubric, autoGraded: question.autoGraded };
  }
}
export function buildReviewDossier(bank: QuestionBank): object {
  const objectives = new Map(bank.objectives.map((objective) => [objective.id, objective]));
  return {
    bank: { id: bank.id, title: bank.title, schemaVersion: bank.schemaVersion },
    generatedFromVersionedCanonicalSource: true,
    questions: bank.questions.map((question) => {
      const objective = objectives.get(question.objectiveId);
      if (!objective) throw new Error(`Question ${question.id} has no canonical objective.`);
      const criteria = applicableCriteria(question.format);
      return { questionHash: reviewQuestionHash(question, objective, bank.sources), question, objective, sources: question.sources, imageAudit: imageAudit(question), applicableCriteria: criteria.map((criterion) => ({ ...criterion, evidence: criterionEvidence(question, criterion) })) };
    }),
  };
}
export function reviewDossierMarkdown(bank: QuestionBank): string {
  const dossier = buildReviewDossier(bank) as { questions: { questionHash: string; question: AssessmentQuestion; objective: LearningObjective; sources: SourceReference[]; imageAudit?: object; applicableCriteria: object[] }[] };
  const sections = dossier.questions.flatMap((item) => [`## ${item.question.id} (version ${item.question.version})`, '', `Question hash: \`${item.questionHash}\``, '', `Objective: **${item.objective.id}** — ${item.objective.statement}`, '', '```json', JSON.stringify(item, null, 2), '```', '']);
  return [`# Aqueous and Vitreous expert-review items`, '', 'This dossier is for expert review only and is not rendered in the student interface.', '', ...sections].join('\n');
}
export function reviewGuide(bank: QuestionBank): string { return `# Expert content review guide\n\nBank: ${bank.title} (${bank.questions.length} draft questions)\n\nUse this project review scale for each applicable criterion:\n\n1 — unacceptable\n2 — major revision required\n3 — usable with revision\n4 — strong\n5 — excellent\n\nUse a stable lowercase slug reviewer ID (for example, reviewer-a), one integer rating from 1 to 5, and an optional comment. Do not edit evidence-binding columns. Blank rating rows remain part of the expected coverage matrix. Ratings support discussion and do not change review status or constitute academic approval.\n`; }
