import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const EXPECTED_CHECKSUM =
  '97c1bc76cbae20681b1c4494bb7d35d282420f8c03a9181927720e024ae9dccb';
const strict = process.argv.includes('--strict');
const validation = validateQuestionBank(aqueousVitreousCandidateBank);
const warnings = validation.bank ? lintQuestionBank(validation.bank) : [];
const diagnostics = [...validation.diagnostics, ...warnings];
const summary = summarizeDiagnostics(diagnostics);
const checksum = createHash('sha256')
  .update(readFileSync(
    'content/question-bank/opt376/aqueous-vitreous/bank.json',
  ))
  .digest('hex');
const failed = summary.errors > 0
  || checksum !== EXPECTED_CHECKSUM
  || (strict && summary.warnings > 0);
console.log(`Question bank validation: ${failed ? 'FAILED' : 'PASSED'}`);
console.log(`Questions: ${aqueousVitreousCandidateBank.questions.length}`);
console.log(`Objectives: ${aqueousVitreousCandidateBank.objectives.length}`);
console.log(`Sources: ${aqueousVitreousCandidateBank.sources.length}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings}`);
if (diagnostics.length > 0) console.log(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = failed ? 1 : 0;
