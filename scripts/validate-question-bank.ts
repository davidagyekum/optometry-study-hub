import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const strict = process.argv.includes('--strict');
const validation = validateQuestionBank(aqueousVitreousCandidateBank);
const warnings = validation.bank ? lintQuestionBank(validation.bank) : [];
const diagnostics = [...validation.diagnostics, ...warnings];
const summary = summarizeDiagnostics(diagnostics);
const failed = summary.errors > 0 || (strict && summary.warnings > 0);
console.log(`Question bank validation: ${failed ? 'FAILED' : 'PASSED'}`);
console.log(`Questions: ${aqueousVitreousCandidateBank.questions.length}`);
console.log(`Objectives: ${aqueousVitreousCandidateBank.objectives.length}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings}`);
if (diagnostics.length > 0) console.log(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = failed ? 1 : 0;
