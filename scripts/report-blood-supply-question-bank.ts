import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import {
  formatQuestionBankReport,
  reportQuestionBank,
} from '@/lib/assessment/reportQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const validation = validateQuestionBank(bloodSupplyCandidateBank);
if (!validation.bank || validation.diagnostics.some(
  (diagnostic) => diagnostic.severity === 'error',
)) {
  console.error('Cannot report an invalid Blood Supply question bank.');
  process.exitCode = 1;
} else {
  console.log(formatQuestionBankReport(reportQuestionBank(validation.bank)));
}
