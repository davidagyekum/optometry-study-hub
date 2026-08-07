import colourObjectives from '@/content/question-bank/opt374/hvp-colour-perception/objectives.json';
import depthObjectives from '@/content/question-bank/opt374/hvp-depth-perception/objectives.json';
import type { Figure, Module, Section } from '@/lib/legacy/types';

const imageRoot = '/images/courses/visual-perception/assessment';

function figure(file: string, alt: string, caption: string): Figure {
  return {
    src: `${imageRoot}/${file}`,
    width: 800,
    height: 450,
    alt,
    caption,
    credit: 'Original diagram supplied with the HVP Depth + Colour extension package',
  };
}

function section(
  id: string,
  title: string,
  image: Figure,
): Section {
  return {
    id,
    title,
    summary: 'Use the authored Notes V3 section for the full source-grounded explanation.',
    bullets: [
      'Core definitions and perceptual relationships',
      'Lecture-aligned examples and distinctions',
      'Limits and clinical implications where the supplied source supports them',
    ],
    terms: ['See Notes V3 key terms'],
    clinical:
      'This draft extension follows the supplied lecture wording and does not add unsupported clinical protocols.',
    image,
  };
}

const depthCues = figure(
  'hvp-depth-cues-scene.svg',
  'Illustrated scene showing monocular depth cues.',
  'Monocular depth cues in a scene.',
);
const panum = figure(
  'hvp-panum-disparity.svg',
  'Diagram of retinal disparity and Panum’s fusional space.',
  'Retinal disparity and Panum’s fusional space.',
);
const stereotests = figure(
  'hvp-stereotest-taxonomy.svg',
  'Diagram grouping clinical stereotest families.',
  'Near and distance stereotest families.',
);
const chromostereopsis = figure(
  'hvp-chromostereopsis.svg',
  'Diagram illustrating a chromostereopsis prompt.',
  'Chromostereopsis teaching prompt.',
);
const colourDimensions = figure(
  'hvp-colour-dimensions.svg',
  'Diagram comparing hue, saturation and brightness.',
  'Three perceptual dimensions of colour.',
);
const colourConstancy = figure(
  'hvp-colour-constancy.svg',
  'Diagram illustrating colour constancy across illuminants.',
  'Colour constancy and illumination.',
);
const opponentChannels = figure(
  'hvp-opponent-channels.svg',
  'Diagram of red-green, blue-yellow and achromatic opponent channels.',
  'Opponent-process colour channels.',
);
const zoneModel = figure(
  'hvp-colour-zone-model.svg',
  'Diagram linking cone coding to opponent processing.',
  'Zone model of colour processing.',
);

export const hvpDepthColourModules: Module[] = [
  {
    id: 'hvp-depth-perception',
    courseId: 'human-visual-perception',
    number: '05',
    title: 'Depth Perception',
    shortTitle: 'Depth Perception',
    description:
      'Absolute and relative depth, monocular and binocular cues, illusions, stereopsis, stereotests and lab applications.',
    tone: 'blue',
    sourceNote:
      'Draft extension rewritten only from the supplied 77-slide Depth Perception lecture deck; lecturer review is pending.',
    coverImage: depthCues,
    objectives: depthObjectives.map((objective) => objective.statement),
    sections: [
      section('depth-foundations', 'Depth foundations', depthCues),
      section('depth-overview', 'Monocular and binocular overview', depthCues),
      section('monocular-cues', 'Monocular depth cues', depthCues),
      section('depth-illusions', 'Depth and size illusions', depthCues),
      section('binocular-cues', 'Binocular cues', panum),
      section('retinal-disparity-panum', 'Retinal disparity and Panum’s space', panum),
      section('stereopsis', 'Stereopsis', stereotests),
      section('clinical-stereopsis-testing', 'Clinical stereopsis testing', stereotests),
      section('practical-lab', 'Lab and applications', chromostereopsis),
    ],
    facts: [],
  },
  {
    id: 'hvp-colour-perception',
    courseId: 'human-visual-perception',
    number: '06',
    title: 'Colour Perception',
    shortTitle: 'Colour Perception',
    description:
      'Colour foundations, perceptual dimensions, constancy, trichromatic and opponent theories, the zone model and source-limited clinical considerations.',
    tone: 'violet',
    sourceNote:
      'Draft extension rewritten only from the supplied 44-slide Colour Perception lecture deck; lecturer review is pending.',
    coverImage: colourDimensions,
    objectives: colourObjectives.map((objective) => objective.statement),
    sections: [
      section('colour-foundations', 'Colour foundations', colourDimensions),
      section('visible-spectrum-cones', 'Visible spectrum and cone coding', colourDimensions),
      section('importance-of-colour', 'Importance of colour', colourConstancy),
      section('colour-attributes', 'Hue, saturation and brightness', colourDimensions),
      section('colour-constancy', 'Colour constancy', colourConstancy),
      section('trichromatic-theory', 'Trichromatic theory', zoneModel),
      section('opponent-process-theory', 'Opponent-process theory', opponentChannels),
      section('zone-model', 'Zone model', zoneModel),
      section('clinical-considerations', 'Clinical considerations and limits', opponentChannels),
    ],
    facts: [],
  },
];
