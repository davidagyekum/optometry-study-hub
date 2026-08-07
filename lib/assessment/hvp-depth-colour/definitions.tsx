import { hvpColourPerceptionExtensionQuestionBank } from '@/content/question-bank/opt374/hvp-colour-perception/bank';
import { hvpDepthPerceptionExtensionQuestionBank } from '@/content/question-bank/opt374/hvp-depth-perception/bank';
import {
  HVP_DEPTH_COLOUR_COURSE_ID,
  HVP_DEPTH_COLOUR_MODULE_CONFIGS,
} from '@/lib/assessment/hvp-depth-colour/config';
import { hvpDepthColourSummaries } from '@/lib/assessment/hvp-depth-colour/summaries';
import { createCoursePracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';

const DEPTH_FULL_SECTION_FORMAT_TARGETS = {
  'depth-foundations': {
    short_answer: 1,
    single_best_answer: 1,
    true_false: 1,
  },
  'depth-overview': {
    multiple_response: 1,
    single_best_answer: 3,
  },
  'monocular-cues': {
    image_hotspot: 1,
    image_label: 1,
    matching: 2,
    short_answer: 1,
    single_best_answer: 6,
    true_false: 1,
  },
  'depth-illusions': {
    multiple_response: 1,
    ordering: 1,
    single_best_answer: 3,
  },
  'binocular-cues': {
    extended_matching: 1,
    matching: 1,
    ordering: 1,
  },
  'retinal-disparity-panum': {
    image_hotspot: 1,
    image_label: 1,
    short_answer: 1,
    single_best_answer: 2,
    true_false: 1,
  },
  stereopsis: { single_best_answer: 1 },
  'clinical-stereopsis-testing': {
    extended_matching: 2,
    image_hotspot: 1,
    matching: 1,
    multiple_response: 2,
    ordering: 2,
    single_best_answer: 2,
  },
  'practical-lab': {
    extended_matching: 1,
    matching: 1,
    multiple_response: 2,
    single_best_answer: 1,
    true_false: 1,
  },
} as const;

const COLOUR_FULL_SECTION_FORMAT_TARGETS = {
  'colour-foundations': {
    extended_matching: 1,
    multiple_response: 1,
    single_best_answer: 1,
    true_false: 1,
  },
  'visible-spectrum-cones': { single_best_answer: 3 },
  'importance-of-colour': {
    matching: 1,
    single_best_answer: 1,
  },
  'colour-attributes': {
    extended_matching: 1,
    image_hotspot: 2,
    image_label: 1,
    ordering: 1,
    short_answer: 2,
    single_best_answer: 2,
  },
  'colour-constancy': {
    image_label: 1,
    matching: 1,
    multiple_response: 1,
    single_best_answer: 2,
    true_false: 1,
  },
  'trichromatic-theory': {
    matching: 1,
    multiple_response: 1,
    single_best_answer: 2,
  },
  'opponent-process-theory': {
    extended_matching: 1,
    image_hotspot: 1,
    multiple_response: 1,
    ordering: 2,
    short_answer: 1,
    single_best_answer: 4,
  },
  'zone-model': {
    extended_matching: 1,
    matching: 1,
    multiple_response: 1,
    ordering: 1,
    single_best_answer: 1,
    true_false: 1,
  },
  'clinical-considerations': {
    matching: 1,
    multiple_response: 1,
    single_best_answer: 3,
    true_false: 1,
  },
} as const;

export const hvpDepthPerceptionExperience = createCoursePracticeExperience({
  config: HVP_DEPTH_COLOUR_MODULE_CONFIGS['hvp-depth-perception'],
  summary: hvpDepthColourSummaries['hvp-depth-perception'],
  bank: hvpDepthPerceptionExtensionQuestionBank,
  courseId: HVP_DEPTH_COLOUR_COURSE_ID,
  courseLabel: 'OPT 374 Depth Perception',
  enforceFullFormatTargets: true,
  enforceSectionAndDifficultyTargets: true,
  enforceHigherOrderTargets: true,
  enforceConstrainedShortProfiles: true,
  enforceFullObjectiveCoverage: true,
  fullContractDescription: 'Full practice uses 50 questions with exact section, format and difficulty quotas, at least 28 higher-order questions, all ten objectives and the family limit.',
  fullSectionFormatTargets: DEPTH_FULL_SECTION_FORMAT_TARGETS,
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
  enforceFullFormatTargets: true,
  enforceSectionAndDifficultyTargets: true,
  enforceHigherOrderTargets: true,
  enforceConstrainedShortProfiles: true,
  enforceFullObjectiveCoverage: true,
  fullContractDescription: 'Full practice uses 50 questions with exact section, format and difficulty quotas, at least 28 higher-order questions, all ten objectives and the family limit.',
  fullSectionFormatTargets: COLOUR_FULL_SECTION_FORMAT_TARGETS,
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
