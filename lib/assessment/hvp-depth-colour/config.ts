export const HVP_DEPTH_COLOUR_COURSE_ID = 'human-visual-perception' as const;

export const HVP_DEPTH_COLOUR_MODULE_CONFIGS = {
  'hvp-depth-perception': {
    moduleId: 'hvp-depth-perception',
    experienceId: 'hvp-depth-perception-extension',
    routeSegment: 'hvp-depth-perception-practice',
    automaticBlueprintId: 'hvp-depth-perception-practice-50-v1',
    writtenBlueprintId: 'hvp-depth-perception-written-v1',
    practiceFamilyId: 'hvp-depth-perception-practice',
    title: 'Depth Perception',
    shortTitle: 'Depth Perception',
    fullDifficultyTargets: { foundation: 13, intermediate: 36, advanced: 1 },
    sectionLabels: {
      'depth-foundations': 'Depth foundations',
      'depth-overview': 'Monocular and binocular overview',
      'monocular-cues': 'Monocular depth cues',
      'depth-illusions': 'Depth and size illusions',
      'binocular-cues': 'Binocular cues',
      'retinal-disparity-panum': 'Retinal disparity and Panum’s space',
      stereopsis: 'Stereopsis',
      'clinical-stereopsis-testing': 'Clinical stereopsis testing',
      'practical-lab': 'Lab and applications',
    },
  },
  'hvp-colour-perception': {
    moduleId: 'hvp-colour-perception',
    experienceId: 'hvp-colour-perception-extension',
    routeSegment: 'hvp-colour-perception-practice',
    automaticBlueprintId: 'hvp-colour-perception-practice-50-v1',
    writtenBlueprintId: 'hvp-colour-perception-written-v1',
    practiceFamilyId: 'hvp-colour-perception-practice',
    title: 'Colour Perception',
    shortTitle: 'Colour Perception',
    fullDifficultyTargets: { foundation: 13, intermediate: 36, advanced: 1 },
    sectionLabels: {
      'colour-foundations': 'Colour foundations',
      'visible-spectrum-cones': 'Visible spectrum and cone coding',
      'importance-of-colour': 'Importance of colour',
      'colour-attributes': 'Hue, saturation and brightness',
      'colour-constancy': 'Colour constancy',
      'trichromatic-theory': 'Trichromatic theory',
      'opponent-process-theory': 'Opponent-process theory',
      'zone-model': 'Zone model',
      'clinical-considerations': 'Clinical considerations and limits',
    },
  },
} as const;

export type HvpDepthColourModuleId = keyof typeof HVP_DEPTH_COLOUR_MODULE_CONFIGS;

export function isHvpDepthColourExpansionEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION,
): boolean {
  return rawValue === 'true';
}
