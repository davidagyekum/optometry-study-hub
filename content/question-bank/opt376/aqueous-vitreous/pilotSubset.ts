import { aqueousVitreousObjectives } from './objectives';
import { preservedPilotQuestions } from './questions/preservedPilot';
import { aqueousVitreousSources } from './sources';
import type { QuestionBank } from '@/lib/assessment/types';
import { AQUEOUS_PILOT_QUESTION_IDS } from '@/lib/assessment/pilot/blueprint';

export function deriveAqueousVitreousPilotBank(): QuestionBank {
  const byId = new Map(preservedPilotQuestions.map((question) => [question.id, question]));
  const questions = AQUEOUS_PILOT_QUESTION_IDS.map((id) => {
    const question = byId.get(id);
    if (!question) throw new Error(`Pilot question ${id} is missing from the preserved pilot source.`);
    return question;
  });
  const objectiveIds = new Set(questions.map((question) => question.objectiveId));
  const objectives = aqueousVitreousObjectives.filter((objective) => objectiveIds.has(objective.id));
  const sourceIds = new Set([...questions.flatMap((question) => question.sources.map((source) => source.id)), ...objectives.flatMap((objective) => objective.sourceIds)]);
  return {
    schemaVersion: 1,
    id: 'aqueous-vitreous-pilot',
    title: 'Aqueous Humour and Vitreous Body assessment-schema pilot',
    courseIds: ['neuro-anatomy'],
    questions,
    objectives,
    sources: aqueousVitreousSources.filter((source) => sourceIds.has(source.id)),
  };
}
export const aqueousVitreousPilotBank = deriveAqueousVitreousPilotBank();
