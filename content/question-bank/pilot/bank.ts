import { pilotObjectives } from '@/content/question-bank/pilot/objectives';
import { pilotQuestions } from '@/content/question-bank/pilot/questions';
import { pilotSources } from '@/content/question-bank/pilot/sources';
import type { QuestionBank } from '@/lib/assessment/types';

export const aqueousVitreousPilotBank: QuestionBank = {
  schemaVersion: 1,
  id: 'aqueous-vitreous-pilot',
  title: 'Aqueous Humour and Vitreous Body assessment-schema pilot',
  courseIds: ['neuro-anatomy'],
  objectives: pilotObjectives,
  questions: pilotQuestions,
  sources: pilotSources,
};
