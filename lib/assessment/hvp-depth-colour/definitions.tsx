import { hvpColourPerceptionExtensionQuestionBank } from '@/content/question-bank/opt374/hvp-colour-perception/bank';
import { hvpDepthPerceptionExtensionQuestionBank } from '@/content/question-bank/opt374/hvp-depth-perception/bank';
import {
  HVP_DEPTH_COLOUR_COURSE_ID,
  HVP_DEPTH_COLOUR_MODULE_CONFIGS,
} from '@/lib/assessment/hvp-depth-colour/config';
import { hvpDepthColourSummaries } from '@/lib/assessment/hvp-depth-colour/summaries';
import { createCoursePracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';

export const hvpDepthPerceptionExperience = createCoursePracticeExperience({
  config: HVP_DEPTH_COLOUR_MODULE_CONFIGS['hvp-depth-perception'],
  summary: hvpDepthColourSummaries['hvp-depth-perception'],
  bank: hvpDepthPerceptionExtensionQuestionBank,
  courseId: HVP_DEPTH_COLOUR_COURSE_ID,
  courseLabel: 'OPT 374 Depth Perception',
  enforceFullFormatTargets: false,
  enforceSectionAndDifficultyTargets: false,
  enforceHigherOrderTargets: false,
  fullContractDescription: 'Full practice builds a deterministic 50-question mixed-format set with family constraints.',
  fullSectionTargets: {
    'depth-foundations': 3,
    'depth-overview': 4,
    'monocular-cues': 12,
    'depth-illusions': 5,
    'binocular-cues': 3,
    'retinal-disparity-panum': 6,
    stereopsis: 1,
    'clinical-stereopsis-testing': 10,
    'practical-lab': 6,
  },
});

export const hvpColourPerceptionExperience = createCoursePracticeExperience({
  config: HVP_DEPTH_COLOUR_MODULE_CONFIGS['hvp-colour-perception'],
  summary: hvpDepthColourSummaries['hvp-colour-perception'],
  bank: hvpColourPerceptionExtensionQuestionBank,
  courseId: HVP_DEPTH_COLOUR_COURSE_ID,
  courseLabel: 'OPT 374 Colour Perception',
  enforceFullFormatTargets: false,
  enforceSectionAndDifficultyTargets: false,
  enforceHigherOrderTargets: false,
  fullContractDescription: 'Full practice builds a deterministic 50-question mixed-format set with family constraints.',
  fullSectionTargets: {
    'colour-foundations': 4,
    'visible-spectrum-cones': 3,
    'importance-of-colour': 2,
    'colour-attributes': 9,
    'colour-constancy': 6,
    'trichromatic-theory': 4,
    'opponent-process-theory': 10,
    'zone-model': 6,
    'clinical-considerations': 6,
  },
});
