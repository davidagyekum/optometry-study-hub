import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
import { EXPECTED_TISSUE_CHECKSUM } from '@/lib/release/assertions';

const strict = process.argv.includes('--strict');
const REVIEWED_CANONICAL_WARNINGS = new Set([
  'OPTION_LENGTH_IMBALANCE:wallerian-regeneration-ordering-001',
  'POSSIBLE_BLOOM_MISMATCH:wallerian-degeneration-short-001',
  'UNDECLARED_NEGATIVE_STEM:cns-pns-repair-open-001',
  'POSSIBLE_BLOOM_MISMATCH:simple-squamous-alveolus-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:transitional-bladder-sba-001',
  'OPTION_LENGTH_IMBALANCE:exocrine-endocrine-duct-sba-001',
  'OPTION_LENGTH_IMBALANCE:epithelium-specimen-extended-001',
  'POSSIBLE_BLOOM_MISMATCH:pseudostratified-short-001',
  'POSSIBLE_BLOOM_MISMATCH:elastic-recoil-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:fibroblast-matrix-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:tendon-slow-healing-short-001',
]);
const warningIdentity = (
  diagnostic: { code: string; questionId?: string },
) => `${diagnostic.code}:${diagnostic.questionId ?? ''}`;
const validation = validateQuestionBank(tissueFoundationsCandidateBank);
const warnings = validation.bank ? lintQuestionBank(validation.bank) : [];
const diagnostics = [...validation.diagnostics, ...warnings];
const summary = summarizeDiagnostics(diagnostics);
const checksum = createHash('sha256')
  .update(readFileSync(
    'content/question-bank/opt376/tissue-foundations/bank.json',
  ))
  .digest('hex');
const unexpectedWarnings = diagnostics.filter(
  (diagnostic) => (
    diagnostic.severity === 'warning'
    && !REVIEWED_CANONICAL_WARNINGS.has(warningIdentity(diagnostic))
  ),
);
const failed = summary.errors > 0
  || checksum !== EXPECTED_TISSUE_CHECKSUM
  || (strict && unexpectedWarnings.length > 0);

console.log(
  `Tissue Foundations question bank validation: ${failed ? 'FAILED' : 'PASSED'}`,
);
console.log(`Questions: ${tissueFoundationsCandidateBank.questions.length}`);
console.log(`Objectives: ${tissueFoundationsCandidateBank.objectives.length}`);
console.log(`Sources: ${tissueFoundationsCandidateBank.sources.length}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings} (${unexpectedWarnings.length} unexpected)`);
if (diagnostics.length > 0) {
  console.log(`\n${formatDiagnostics(diagnostics)}`);
}
process.exitCode = failed ? 1 : 0;
