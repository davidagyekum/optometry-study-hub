export const OPT370_COURSE_ID = 'dispensing-optics-ii' as const;

export const OPT370_MODULE_CONFIGS = {
  'schematic-eye-refractive-states': {
    moduleId: 'schematic-eye-refractive-states',
    experienceId: 'opt370-schematic-eye-refractive-states',
    routeSegment: 'opt370-schematic-eye-refractive-states-practice',
    automaticBlueprintId: 'schematic-eye-refractive-states-practice-50-v1',
    writtenBlueprintId: 'schematic-eye-refractive-states-written-v1',
    practiceFamilyId: 'schematic-eye-refractive-states-practice',
    title: 'Schematic Eye and Refractive States',
    shortTitle: 'Schematic Eye',
    flagName: 'NEXT_PUBLIC_ENABLE_OPT370_SCHEMATIC_EYE_REFRACTIVE_STATES',
    fullDifficultyTargets: { foundation: 14, intermediate: 28, advanced: 8 },
    sectionLabels: {
      'vergence-paraxial': 'Vergence and paraxial rays',
      'schematic-models': 'Schematic-eye models',
      emmetropia: 'Emmetropia and emmetropization',
      myopia: 'Myopia and minus correction',
      hyperopia: 'Hyperopia and plus correction',
      'far-point-axial': 'Far-point vergence and axial length',
    },
  },
  'multifocal-foundations': {
    moduleId: 'multifocal-foundations',
    experienceId: 'opt370-multifocal-foundations',
    routeSegment: 'opt370-multifocal-foundations-practice',
    automaticBlueprintId: 'multifocal-foundations-practice-50-v1',
    writtenBlueprintId: 'multifocal-foundations-written-v1',
    practiceFamilyId: 'multifocal-foundations-practice',
    title: 'Presbyopia, Bifocals and Trifocals',
    shortTitle: 'Multifocal Foundations',
    flagName: 'NEXT_PUBLIC_ENABLE_OPT370_MULTIFOCAL_FOUNDATIONS',
    fullDifficultyTargets: { foundation: 16, intermediate: 29, advanced: 5 },
    sectionLabels: {
      'presbyopia-add': 'Presbyopia and reading addition',
      'construction-types': 'Bifocal construction types',
      'segment-designs': 'Segment terminology and designs',
      'nvp-prism': 'Near visual point and prism',
      'jump-tca': 'Image jump and chromatic aberration',
      'bifocal-fitting': 'Bifocal fitting and placement',
      trifocals: 'Trifocal additions and ratios',
    },
  },
  'progressive-addition-lenses': {
    moduleId: 'progressive-addition-lenses',
    experienceId: 'opt370-progressive-addition-lenses',
    routeSegment: 'opt370-progressive-addition-lenses-practice',
    automaticBlueprintId: 'progressive-addition-lenses-practice-50-v1',
    writtenBlueprintId: 'progressive-addition-lenses-written-v1',
    practiceFamilyId: 'progressive-addition-lenses-practice',
    title: 'Progressive Addition Lenses',
    shortTitle: 'Progressive Lenses',
    flagName: 'NEXT_PUBLIC_ENABLE_OPT370_PROGRESSIVE_ADDITION_LENSES',
    fullDifficultyTargets: { foundation: 17, intermediate: 27, advanced: 6 },
    sectionLabels: {
      'pal-principles': 'Progressive lens principles',
      'pal-designs': 'PAL designs and task matching',
      'reference-markings': 'Reference markings and layout',
      'patient-frame': 'Patient and frame selection',
      'measure-order': 'Measurement and ordering',
      'verification-delivery': 'Verification and delivery',
      'pal-troubleshooting': 'Troubleshooting PAL complaints',
    },
  },
  'pd-and-dispensing': {
    moduleId: 'pd-and-dispensing',
    experienceId: 'opt370-pd-and-dispensing',
    routeSegment: 'opt370-pd-and-dispensing-practice',
    automaticBlueprintId: 'pd-and-dispensing-practice-50-v1',
    writtenBlueprintId: 'pd-and-dispensing-written-v1',
    practiceFamilyId: 'pd-and-dispensing-practice',
    title: 'Interpupillary Distance and Dispensing Quality',
    shortTitle: 'PD and Dispensing',
    flagName: 'NEXT_PUBLIC_ENABLE_OPT370_PD_AND_DISPENSING',
    fullDifficultyTargets: { foundation: 17, intermediate: 28, advanced: 5 },
    sectionLabels: {
      'quality-mistakes': 'Common dispensing mistakes',
      'pd-concepts': 'PD concepts and importance',
      'pd-rule-methods': 'Manual PD-rule methods',
      pupillometer: 'Pupillometer measurement',
      'near-pd': 'Near PD and convergence',
      'pd-prism': 'PD error and unwanted prism',
      'final-dispensing': 'Final dispensing and quality control',
    },
  },
  'special-lenses': {
    moduleId: 'special-lenses',
    experienceId: 'opt370-special-lenses',
    routeSegment: 'opt370-special-lenses-practice',
    automaticBlueprintId: 'special-lenses-practice-50-v1',
    writtenBlueprintId: 'special-lenses-written-v1',
    practiceFamilyId: 'special-lenses-practice',
    title: 'Special Ophthalmic Lenses',
    shortTitle: 'Special Lenses',
    flagName: 'NEXT_PUBLIC_ENABLE_OPT370_SPECIAL_LENSES',
    fullDifficultyTargets: { foundation: 19, intermediate: 25, advanced: 6 },
    sectionLabels: {
      'lenticular-aspheric': 'Lenticular and aspheric lenses',
      aniseikonia: 'Aniseikonia and iseikonic lenses',
      'spectacle-magnification': 'Spectacle magnification',
      'safety-filters': 'Safety lenses, filters and coatings',
      'fresnel-prism': 'Fresnel prism fitting',
      'slab-off': 'Bicentric grinding and slab-off',
    },
  },
} as const;

export type Opt370ModuleId = keyof typeof OPT370_MODULE_CONFIGS;
export type Opt370ModuleConfig = (typeof OPT370_MODULE_CONFIGS)[Opt370ModuleId];

export function isOpt370ExperienceEnabled(moduleId: Opt370ModuleId): boolean {
  switch (moduleId) {
    case 'schematic-eye-refractive-states':
      return process.env.NEXT_PUBLIC_ENABLE_OPT370_SCHEMATIC_EYE_REFRACTIVE_STATES === 'true';
    case 'multifocal-foundations':
      return process.env.NEXT_PUBLIC_ENABLE_OPT370_MULTIFOCAL_FOUNDATIONS === 'true';
    case 'progressive-addition-lenses':
      return process.env.NEXT_PUBLIC_ENABLE_OPT370_PROGRESSIVE_ADDITION_LENSES === 'true';
    case 'pd-and-dispensing':
      return process.env.NEXT_PUBLIC_ENABLE_OPT370_PD_AND_DISPENSING === 'true';
    case 'special-lenses':
      return process.env.NEXT_PUBLIC_ENABLE_OPT370_SPECIAL_LENSES === 'true';
  }
}
