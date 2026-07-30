import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const EXPECTED_CHECKSUM =
  '7f8c0d7915bccd3c3ffcf2ac96bc44758366928198ec55e68ee5e5c55d43e143';
const EXPECTED_CANONICAL_LINT_NOTES = new Set([
  'POSSIBLE_BLOOM_MISMATCH:pharm-adr-amphetamine-indirect-sba-001',
  'REPEATED_OPTION_PREFIX:pharm-adr-alpha1-mydriasis-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-adr-beta1-response-sba-001',
  'OPTION_LENGTH_IMBALANCE:pharm-adr-beta2-response-sba-001',
  'OPTION_LENGTH_IMBALANCE:pharm-adr-phenylephrine-cycloplegia-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-adr-brimonidine-mechanism-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-adr-apraclonidine-use-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-adr-timolol-heartblock-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-adr-phenoxybenzamine-sba-001',
  'OPTION_LENGTH_IMBALANCE:pharm-adr-betaxolol-selectivity-sba-001',
  'OPTION_LENGTH_IMBALANCE:pharm-adr-anaphylaxis-epinephrine-sba-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-adr-phenylephrine-cycloplegia-tf-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-adr-alpha2-feedback-tf-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-adr-clinical-selection-emq-001',
  'OPTION_LENGTH_IMBALANCE:pharm-chol-ache-vs-bche-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-chol-ache-vs-bche-sba-001',
  'REPEATED_OPTION_PREFIX:pharm-chol-nicotinic-channel-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-chol-bethanechol-selectivity-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-chol-pilocarpine-counselling-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:pharm-chol-atropine-eye-sba-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-chol-muscarinic-gpcr-tf-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-chol-bche-ach-tf-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-chol-succ-phase1-reversal-tf-001',
  'OPTION_LENGTH_IMBALANCE:pharm-chol-muscarinic-effects-mr-001',
  'OPTION_LENGTH_IMBALANCE:pharm-chol-organophosphate-manifestations-mr-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-chol-clinical-selection-emq-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-chol-organophosphate-response-emq-001',
  'OPTION_LENGTH_IMBALANCE:pharm-chol-organophosphate-response-emq-001',
  'UNDECLARED_NEGATIVE_STEM:pharm-chol-neuromuscular-selection-emq-001',
  'OPTION_LENGTH_IMBALANCE:pharm-chol-neuromuscular-selection-emq-001',
]);
const strict = process.argv.includes('--strict');
const validation = validateQuestionBank(autonomicPharmacologyCandidateBank);
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
    'content/question-bank/pharmacology/autonomic-pharmacology/bank.json',
  ))
  .digest('hex');
const failed = summary.errors > 0
  || checksum !== EXPECTED_CHECKSUM
  || (strict && summary.warnings > 0);

console.log(`Autonomic Pharmacology question bank validation: ${failed ? 'FAILED' : 'PASSED'}`);
console.log(`Questions: ${autonomicPharmacologyCandidateBank.questions.length}`);
console.log(`Objectives: ${autonomicPharmacologyCandidateBank.objectives.length}`);
console.log(`Sources: ${autonomicPharmacologyCandidateBank.sources.length}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings}`);
console.log(`Accepted canonical lint notes: ${expectedLintNotes.length}`);
if (diagnostics.length > 0) console.log(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = failed ? 1 : 0;
