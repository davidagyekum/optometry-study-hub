import type { QuestionBlueprint } from '@/lib/assessment/blueprint/types';

export const autonomicPharmacologyBlueprint: QuestionBlueprint = {
  id: 'autonomic-pharmacology-blueprint-v1',
  bankId: 'autonomic-pharmacology-candidate',
  totalQuestions: 80,
  sectionTargets: {
    'pharm-adrenergic': 40,
    'pharm-cholinergic': 40,
  },
  formatTargets: {
    single_best_answer: 40,
    true_false: 5,
    multiple_response: 8,
    matching: 7,
    extended_matching: 5,
    ordering: 4,
    image_hotspot: 3,
    image_label: 3,
    short_answer: 3,
    open_response: 2,
  },
  bloomTargets: {
    remember: 5,
    understand: 13,
    apply: 30,
    analyze: 29,
    evaluate: 1,
    create: 2,
  },
  difficultyTargets: {
    foundation: 16,
    intermediate: 40,
    advanced: 24,
  },
  stimulusTargets: {
    text: 1,
    diagram: 6,
    table: 0,
    clinical_vignette: 35,
    pathway: 18,
    comparison: 15,
    error_analysis: 5,
  },
  minimumHigherOrderShare: 62 / 80,
  minimumQuestionsPerObjective: 2,
};
