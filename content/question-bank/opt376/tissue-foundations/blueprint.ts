import type { QuestionBlueprint } from '@/lib/assessment/blueprint/types';

export const tissueFoundationsBlueprint: QuestionBlueprint = {
  id: 'opt376-tissue-foundations-candidate-v1',
  bankId: 'opt376-tissue-foundations-candidate',
  totalQuestions: 80,
  sectionTargets: {
    'tissue-nervous': 44,
    'tissue-epithelium': 20,
    'tissue-connective': 16,
  },
  formatTargets: {
    single_best_answer: 40,
    true_false: 6,
    multiple_response: 9,
    matching: 7,
    extended_matching: 4,
    ordering: 4,
    image_hotspot: 3,
    image_label: 2,
    short_answer: 3,
    open_response: 2,
  },
  bloomTargets: {
    remember: 5,
    understand: 20,
    apply: 39,
    analyze: 14,
    evaluate: 1,
    create: 1,
  },
  difficultyTargets: {
    foundation: 28,
    intermediate: 41,
    advanced: 11,
  },
  stimulusTargets: {
    text: 7,
    diagram: 9,
    table: 0,
    clinical_vignette: 36,
    pathway: 4,
    comparison: 19,
    error_analysis: 5,
  },
  minimumHigherOrderShare: 55 / 80,
  minimumQuestionsPerObjective: 2,
};
