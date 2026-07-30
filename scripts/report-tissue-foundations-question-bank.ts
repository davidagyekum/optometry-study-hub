import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import {
  formatQuestionBankReport,
  reportQuestionBank,
} from '@/lib/assessment/reportQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';

const validation = validateQuestionBank(tissueFoundationsCandidateBank);
if (
  !validation.bank
  || validation.diagnostics.some(
    (diagnostic) => diagnostic.severity === 'error',
  )
) {
  console.error(
    'Cannot report an invalid Tissue Foundations question bank. Run npm run questions:validate:tissue.',
  );
  process.exitCode = 1;
} else {
  console.log(formatQuestionBankReport(reportQuestionBank(validation.bank)));
}
