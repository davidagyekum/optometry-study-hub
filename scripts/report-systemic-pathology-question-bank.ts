import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import {
  formatQuestionBankReport,
  reportQuestionBank,
} from '@/lib/assessment/reportQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const validation = validateQuestionBank(systemicPathologyCandidateBank);
if (!validation.bank || validation.diagnostics.some(
  (diagnostic) => diagnostic.severity === 'error',
)) {
  console.error('Cannot report an invalid Systemic Pathology question bank.');
  process.exitCode = 1;
} else {
  console.log(formatQuestionBankReport(reportQuestionBank(validation.bank)));
}
