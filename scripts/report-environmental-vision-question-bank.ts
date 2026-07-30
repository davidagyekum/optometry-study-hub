import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import {
  formatQuestionBankReport,
  reportQuestionBank,
} from '@/lib/assessment/reportQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const validation = validateQuestionBank(environmentalVisionCandidateBank);
if (!validation.bank || validation.diagnostics.some(
  (diagnostic) => diagnostic.severity === 'error',
)) {
  console.error('Cannot report an invalid Environmental Vision question bank.');
  process.exitCode = 1;
} else {
  console.log(formatQuestionBankReport(reportQuestionBank(validation.bank)));
}
