import { mkdir, writeFile } from 'node:fs/promises';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { buildReviewDossier, buildReviewPackRows, reviewDossierMarkdown, reviewGuide, reviewRowsToCsv } from '@/lib/assessment/review/reviewPack';
const output = 'tmp/question-review'; await mkdir(output, { recursive: true });
const rows = buildReviewPackRows(aqueousVitreousCandidateBank); const dossier = buildReviewDossier(aqueousVitreousCandidateBank);
await Promise.all([
  writeFile(`${output}/aqueous-vitreous-review-pack.csv`, reviewRowsToCsv(rows), 'utf8'),
  writeFile(`${output}/aqueous-vitreous-review-guide.md`, reviewGuide(aqueousVitreousCandidateBank), 'utf8'),
  writeFile(`${output}/aqueous-vitreous-review-items.md`, `${reviewDossierMarkdown(aqueousVitreousCandidateBank)}\n`, 'utf8'),
  writeFile(`${output}/aqueous-vitreous-review-items.json`, `${JSON.stringify(dossier, null, 2)}\n`, 'utf8'),
]);
console.log(`Review pack written to ${output}`); console.log(`Questions: ${aqueousVitreousCandidateBank.questions.length}`); console.log(`CSV rows: ${rows.length}`);
