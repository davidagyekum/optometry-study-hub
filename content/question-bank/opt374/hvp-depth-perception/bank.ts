import bankJson from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';
import { normalizeHvpDepthColourRuntimeBank } from '@/content/question-bank/opt374/normalizeHvpDepthColourRuntimeBank';

export const hvpDepthPerceptionExtensionQuestionBank =
  questionBankSchema.parse(normalizeHvpDepthColourRuntimeBank(bankJson));
