import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const EXPECTED_CHECKSUM =
  '06ed91a7323147e8eb9ce1fe6d4813209d986d0b4e4664d55136a012d544b379';
const EXPECTED_CANONICAL_LINT_NOTES = new Set([
  'OPTION_LENGTH_IMBALANCE:breast-fat-necrosis-trauma-sba-001',
  'OPTION_LENGTH_IMBALANCE:breast-risk-protective-factors-mr-001',
  'OPTION_LENGTH_IMBALANCE:cardio-rheumatic-valvulitis-sba-001',
  'OPTION_LENGTH_IMBALANCE:cardio-atherosclerosis-pathogenesis-ordering-001',
  'OPTION_LENGTH_IMBALANCE:endocrine-type1-type2-sba-001',
  'OPTION_LENGTH_IMBALANCE:endocrine-hyperthyroidism-features-mr-001',
  'OPTION_LENGTH_IMBALANCE:endocrine-cells-zones-hormones-matching-001',
  'OPTION_LENGTH_IMBALANCE:endocrine-insulin-release-ordering-001',
  'OPTION_LENGTH_IMBALANCE:gi-hpylori-chronic-gastritis-sba-001',
  'OPTION_LENGTH_IMBALANCE:gi-gastric-metastatic-signs-mr-001',
  'OPTION_LENGTH_IMBALANCE:renal-ckd-definition-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:renal-ckd-definition-sba-001',
  'OPTION_LENGTH_IMBALANCE:renal-hydronephrosis-obstruction-sba-001',
  'OPTION_LENGTH_IMBALANCE:renal-struvite-proteus-sba-001',
  'OPTION_LENGTH_IMBALANCE:renal-wilms-syndromes-mr-001',
  'OPTION_LENGTH_IMBALANCE:renal-jga-matching-001',
  'OPTION_LENGTH_IMBALANCE:renal-clinical-syndromes-emq-001',
]);
const strict = process.argv.includes('--strict');
const validation = validateQuestionBank(systemicPathologyCandidateBank);
const lintNotes = validation.bank ? lintQuestionBank(validation.bank) : [];
const expectedLintNotes = lintNotes.filter((diagnostic) => (
  EXPECTED_CANONICAL_LINT_NOTES.has(
    `${diagnostic.code}:${diagnostic.questionId ?? ''}`,
  )
));
const warnings = lintNotes.filter((diagnostic) => (
  !EXPECTED_CANONICAL_LINT_NOTES.has(
    `${diagnostic.code}:${diagnostic.questionId ?? ''}`,
  )
));
const diagnostics = [...validation.diagnostics, ...warnings];
const summary = summarizeDiagnostics(diagnostics);
const checksum = createHash('sha256')
  .update(readFileSync(
    'content/question-bank/systemic-pathology/systemic-pathology/bank.json',
  ))
  .digest('hex');
const failed = summary.errors > 0
  || checksum !== EXPECTED_CHECKSUM
  || (strict && summary.warnings > 0);

console.log(`Systemic Pathology question bank validation: ${failed ? 'FAILED' : 'PASSED'}`);
console.log(`Questions: ${systemicPathologyCandidateBank.questions.length}`);
console.log(`Objectives: ${systemicPathologyCandidateBank.objectives.length}`);
console.log(`Sources: ${systemicPathologyCandidateBank.sources.length}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings}`);
console.log(`Accepted canonical lint notes: ${expectedLintNotes.length}`);
if (diagnostics.length > 0) console.log(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = failed ? 1 : 0;
