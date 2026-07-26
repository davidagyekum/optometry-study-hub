import type { BloomLevel, Difficulty, QuestionFormat, StimulusType } from '@/lib/assessment/types';

export type TargetMap<Key extends string = string> = Record<Key, number>;
export type QuestionBlueprint = {
  id: string;
  bankId: string;
  totalQuestions: number;
  sectionTargets: TargetMap;
  formatTargets: TargetMap<QuestionFormat>;
  bloomTargets: TargetMap<BloomLevel>;
  difficultyTargets: TargetMap<Difficulty>;
  stimulusTargets: TargetMap<StimulusType>;
  minimumHigherOrderShare: number;
  minimumQuestionsPerObjective: number;
};
