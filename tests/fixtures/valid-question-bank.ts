import { aqueousVitreousPilotBank } from '@/content/question-bank/pilot/bank';

export function makeValidQuestionBank() {
  return structuredClone(aqueousVitreousPilotBank);
}
