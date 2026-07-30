import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const EXPECTED_CHECKSUM =
  '1ce2628c3c74ac124b7034d7c34efba63a10dc4d6dcaab079e5eed73a01ccf8d';
const strict = process.argv.includes('--strict');
const validation = validateQuestionBank(bloodSupplyCandidateBank);
const warnings = validation.bank ? lintQuestionBank(validation.bank) : [];
const diagnostics = [...validation.diagnostics, ...warnings];
const summary = summarizeDiagnostics(diagnostics);
const checksum = createHash('sha256')
  .update(readFileSync(
    'content/question-bank/opt376/blood-supply/bank.json',
  ))
  .digest('hex');
const failed = summary.errors > 0
  || checksum !== EXPECTED_CHECKSUM
  || (strict && summary.warnings > 0);

console.log(`Blood Supply question bank validation: ${failed ? 'FAILED' : 'PASSED'}`);
console.log(`Questions: ${bloodSupplyCandidateBank.questions.length}`);
console.log(`Objectives: ${bloodSupplyCandidateBank.objectives.length}`);
console.log(`Sources: ${bloodSupplyCandidateBank.sources.length}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings}`);
if (diagnostics.length > 0) console.log(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = failed ? 1 : 0;
