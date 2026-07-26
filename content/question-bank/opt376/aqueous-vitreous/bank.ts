import { aqueousVitreousObjectives } from './objectives';
import { aqueousVitreousSources } from './sources';
import { flowQuestions } from './questions/flow';
import { iopQuestions } from './questions/iop';
import { mediaChambersQuestions } from './questions/mediaChambers';
import { preservedPilotQuestions } from './questions/preservedPilot';
import { productionQuestions } from './questions/production';
import { vitreousAnatomyQuestions } from './questions/vitreousAnatomy';
import { vitreousClinicalQuestions } from './questions/vitreousClinical';
import type { QuestionBank } from '@/lib/assessment/types';

export const aqueousVitreousCandidateBank: QuestionBank = {
  schemaVersion: 1,
  id: 'aqueous-vitreous-candidate',
  title: 'OPT 376 Aqueous Humour and Vitreous Body candidate bank',
  courseIds: ['neuro-anatomy'],
  objectives: aqueousVitreousObjectives,
  questions: [...preservedPilotQuestions, ...mediaChambersQuestions, ...productionQuestions, ...flowQuestions, ...iopQuestions, ...vitreousAnatomyQuestions, ...vitreousClinicalQuestions],
  sources: aqueousVitreousSources,
};
