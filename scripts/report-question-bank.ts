import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { formatQuestionBankReport, reportQuestionBank } from '@/lib/assessment/reportQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
const validation = validateQuestionBank(aqueousVitreousCandidateBank);
if (!validation.bank || validation.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) { console.error('Cannot report an invalid question bank. Run npm run questions:validate.'); process.exitCode = 1; } else console.log(formatQuestionBankReport(reportQuestionBank(validation.bank)));
