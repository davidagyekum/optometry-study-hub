import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const EXPECTED_CHECKSUM =
  'fe96d664bdad67b40a4711332612e59e26a2b5a2c3844aae279dc71f662ecb9f';
const strict = process.argv.includes('--strict');
const validation = validateQuestionBank(ocularAdnexaCandidateBank);
const warnings = validation.bank ? lintQuestionBank(validation.bank) : [];
const diagnostics = [...validation.diagnostics, ...warnings];
const summary = summarizeDiagnostics(diagnostics);
const checksum = createHash('sha256')
  .update(readFileSync(
    'content/question-bank/opt376/ocular-adnexa/bank.json',
  ))
  .digest('hex');
const failed = summary.errors > 0
  || checksum !== EXPECTED_CHECKSUM
  || (strict && summary.warnings > 0);

console.log(`Ocular Adnexa question bank validation: ${failed ? 'FAILED' : 'PASSED'}`);
console.log(`Questions: ${ocularAdnexaCandidateBank.questions.length}`);
console.log(`Objectives: ${ocularAdnexaCandidateBank.objectives.length}`);
console.log(`Sources: ${ocularAdnexaCandidateBank.sources.length}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings}`);
if (diagnostics.length > 0) console.log(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = failed ? 1 : 0;
