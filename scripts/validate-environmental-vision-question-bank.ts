import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import { formatDiagnostics, summarizeDiagnostics } from '@/lib/assessment/diagnostics';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const EXPECTED_CHECKSUM =
  'cd453b8dd2f691db44bc93eb550f290d0c7213e44f16dc1913e5d75559b99385';
const EXPECTED_CANONICAL_LINT_NOTES = new Set([
  'UNDECLARED_NEGATIVE_STEM:env-optics-large-pupil-aberration-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-optics-fluorescence-wavelength-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-task-visibility-factors-mr-001',
  'OPTION_LENGTH_IMBALANCE:env-ergonomics-monitor-height-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-hazards-penetrating-perforating-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:env-hazards-metal-foreign-body-toxicity-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-hazards-uv-latent-photokeratitis-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-hazards-blunt-trauma-effects-mr-001',
  'OPTION_LENGTH_IMBALANCE:env-hazards-uv-acute-chronic-mr-001',
  'OPTION_LENGTH_IMBALANCE:env-hazards-injury-classification-emq-001',
  'OPTION_LENGTH_IMBALANCE:env-hazards-chemical-response-ordering-001',
  'OPTION_LENGTH_IMBALANCE:env-protection-side-shields-impact-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-protection-chemical-splash-goggles-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-protection-prescription-lens-worker-sba-001',
  'UNDECLARED_NEGATIVE_STEM:env-protection-laser-wavelength-od-sba-001',
  'POSSIBLE_BLOOM_MISMATCH:env-protection-welding-helmet-primary-sba-001',
  'OPTION_LENGTH_IMBALANCE:env-protection-dust-sealed-goggles-sba-001',
  'UNDECLARED_NEGATIVE_STEM:env-protection-damaged-ppe-sba-001',
]);
const strict = process.argv.includes('--strict');
const validation = validateQuestionBank(environmentalVisionCandidateBank);
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
    'content/question-bank/opt508/environmental-vision/bank.json',
  ))
  .digest('hex');
const failed = summary.errors > 0
  || checksum !== EXPECTED_CHECKSUM
  || (strict && summary.warnings > 0);

console.log(`Environmental Vision question bank validation: ${failed ? 'FAILED' : 'PASSED'}`);
console.log(`Questions: ${environmentalVisionCandidateBank.questions.length}`);
console.log(`Objectives: ${environmentalVisionCandidateBank.objectives.length}`);
console.log(`Sources: ${environmentalVisionCandidateBank.sources.length}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Errors: ${summary.errors}`);
console.log(`Warnings: ${summary.warnings}`);
console.log(`Accepted canonical lint notes: ${expectedLintNotes.length}`);
if (diagnostics.length > 0) console.log(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = failed ? 1 : 0;
