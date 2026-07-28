import type { QuestionBlueprint } from '@/lib/assessment/blueprint/types';
export const aqueousVitreousBlueprint: QuestionBlueprint = {
  id: 'aqueous-vitreous-candidate-v1', bankId: 'aqueous-vitreous-candidate', totalQuestions: 36,
  sectionTargets: { 'media-chambers': 6, production: 6, flow: 6, iop: 6, 'vitreous-anatomy': 6, 'vitreous-clinical': 6 },
  formatTargets: { single_best_answer: 12, true_false: 0, multiple_response: 4, ordering: 4, matching: 4, extended_matching: 3, image_hotspot: 3, image_label: 2, short_answer: 2, open_response: 2 },
  bloomTargets: { remember: 6, understand: 8, apply: 12, analyze: 7, evaluate: 2, create: 1 },
  difficultyTargets: { foundation: 10, intermediate: 18, advanced: 8 },
  stimulusTargets: { text: 5, diagram: 5, table: 3, clinical_vignette: 8, pathway: 6, comparison: 5, error_analysis: 4 },
  minimumHigherOrderShare: 22 / 36, minimumQuestionsPerObjective: 2,
};
