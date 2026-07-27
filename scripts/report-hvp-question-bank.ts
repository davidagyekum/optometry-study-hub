import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  formatQuestionBankReport,
  reportQuestionBank,
} from '@/lib/assessment/reportQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const validation = validateQuestionBank(humanVisualPerceptionCandidateBank);
if (
  !validation.bank
  || validation.diagnostics.some((diagnostic) => diagnostic.severity === 'error')
) {
  console.error('Cannot report an invalid HVP question bank. Run npm run questions:validate:hvp.');
  process.exitCode = 1;
} else {
  console.log(formatQuestionBankReport(reportQuestionBank(validation.bank)));
}
