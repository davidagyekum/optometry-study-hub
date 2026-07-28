import type { QuestionBlueprint } from '@/lib/assessment/blueprint/types';

export const humanVisualPerceptionBlueprint: QuestionBlueprint = {
  id: 'opt374-human-visual-perception-foundations-v1',
  bankId: 'opt374-human-visual-perception-foundations',
  totalQuestions: 120,
  sectionTargets: {
    'hvp-foundations': 16,
    'hvp-retina': 48,
    'hvp-lgn': 32,
    'hvp-extrastriate': 24,
  },
  formatTargets: {
    single_best_answer: 64,
    true_false: 0,
    multiple_response: 16,
    matching: 10,
    extended_matching: 6,
    ordering: 8,
    image_hotspot: 4,
    image_label: 4,
    short_answer: 6,
    open_response: 2,
  },
  bloomTargets: {
    remember: 28,
    understand: 37,
    apply: 30,
    analyze: 22,
    evaluate: 2,
    create: 1,
  },
  difficultyTargets: {
    foundation: 33,
    intermediate: 59,
    advanced: 28,
  },
  stimulusTargets: {
    text: 18,
    diagram: 14,
    table: 0,
    clinical_vignette: 29,
    pathway: 20,
    comparison: 37,
    error_analysis: 2,
  },
  minimumHigherOrderShare: 55 / 120,
  minimumQuestionsPerObjective: 1,
};
