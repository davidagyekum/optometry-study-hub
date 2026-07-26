import { mkdir, writeFile } from 'node:fs/promises';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { buildReviewPackRows, questionSummary, reviewGuide, reviewRowsToCsv } from '@/lib/assessment/review/reviewPack';
const output = 'tmp/question-review'; await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(`${output}/aqueous-vitreous-review-pack.csv`, reviewRowsToCsv(buildReviewPackRows(aqueousVitreousCandidateBank)), 'utf8'),
  writeFile(`${output}/aqueous-vitreous-review-guide.md`, reviewGuide(aqueousVitreousCandidateBank), 'utf8'),
  writeFile(`${output}/aqueous-vitreous-question-summary.json`, `${JSON.stringify(questionSummary(aqueousVitreousCandidateBank), null, 2)}\n`, 'utf8'),
]);
console.log(`Review pack written to ${output}`); console.log(`Questions: ${aqueousVitreousCandidateBank.questions.length}`); console.log(`CSV rows: ${buildReviewPackRows(aqueousVitreousCandidateBank).length}`);
