import bankData from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';
import { normalizeOpt370RuntimeObjectiveTargets } from '@/content/question-bank/opt370/normalizeRuntimeBank';

export const schematicEyeRefractiveStatesQuestionBank = questionBankSchema.parse(
  normalizeOpt370RuntimeObjectiveTargets(bankData),
);
