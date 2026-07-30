import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import {
  formatQuestionBankReport,
  reportQuestionBank,
} from '@/lib/assessment/reportQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const validation = validateQuestionBank(autonomicPharmacologyCandidateBank);
if (!validation.bank || validation.diagnostics.some(
  (diagnostic) => diagnostic.severity === 'error',
)) {
  console.error('Cannot report an invalid Autonomic Pharmacology question bank.');
  process.exitCode = 1;
} else {
  console.log(formatQuestionBankReport(reportQuestionBank(validation.bank)));
}
