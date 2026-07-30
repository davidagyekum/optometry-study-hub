import { hotspot, matching, mr, sba, short, trueFalse } from '../questionFactory';
import {
  aqueousLectureSource,
  aqueousPhysiologySource,
  eyeAnatomySource,
  openStaxVisionSource,
} from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const anatomySources = [aqueousLectureSource, eyeAnatomySource, openStaxVisionSource];
const flowSources = [aqueousLectureSource, aqueousPhysiologySource, eyeAnatomySource];
const chamberFlowImage = {
  src: '/images/modules/aqueous/assessment/aqueous-chamber-flow.svg',
  alt: 'Neutral sagittal eye diagram with markers over the posterior chamber, pupil, anterior chamber, and iridocorneal angle.',
  width: 1200,
  height: 675,
};

export const curatedMediaChambersQuestions: AssessmentQuestion[] = [
  sba({
    id: 'aqueous-media-sba-003',
    familyId: 'aqueous-media-fluid-gel-comparison',
    sectionId: 'media-chambers',
    objectiveId: 'aqueous-identify-chambers',
    stimulusType: 'text',
    bloomLevel: 'understand',
    difficulty: 'foundation',
    stem: 'Which statement best distinguishes aqueous humour from the vitreous body?',
    explanation: 'Aqueous is a low-viscosity fluid in the chambers anterior to the lens, whereas the vitreous is a gel filling the cavity behind the lens and in front of the retina.',
    sources: anatomySources,
  }, [
    ['aqueous-front-vitreous-back', 'Aqueous is fluid in front of the lens; vitreous is gel behind the lens', 'This correctly distinguishes both location and physical state.'],
    ['both-anterior', 'Both are gels confined to the anterior chamber', 'The vitreous is posterior to the lens and aqueous is not a gel.', 'media-location-state-confusion'],
    ['aqueous-retina', 'Aqueous fills the retinal space while vitreous fills the posterior chamber', 'Both locations are reversed or incorrect.', 'media-location-reversal'],
    ['both-vascular', 'Both are vascular tissues that directly nourish the retina', 'They are transparent media, not vascular tissues.', 'media-tissue-confusion'],
  ], 'aqueous-front-vitreous-back'),
  trueFalse({
    id: 'aqueous-media-tf-001',
    familyId: 'aqueous-posterior-chamber-size',
    sectionId: 'media-chambers',
    objectiveId: 'aqueous-identify-chambers',
    stimulusType: 'text',
    bloomLevel: 'understand',
    difficulty: 'foundation',
    stem: 'The posterior chamber is the large cavity between the crystalline lens and the retina.',
    explanation: 'False. The posterior chamber is the narrow aqueous-filled space behind the iris and in front of the lens-zonular plane; the large space behind the lens is the vitreous cavity.',
    sources: anatomySources,
    misconceptionTags: ['posterior-chamber-vitreous-cavity-confusion'],
  }, false),
  mr({
    id: 'aqueous-media-mr-002',
    familyId: 'aqueous-pupil-block-relationships',
    sectionId: 'media-chambers',
    objectiveId: 'aqueous-analyze-chamber-angle-relationships',
    stimulusType: 'comparison',
    bloomLevel: 'apply',
    difficulty: 'intermediate',
    stem: 'Aqueous cannot pass normally through the pupil. Select the anatomical consequences that can follow from this block.',
    explanation: 'Pupillary block impedes posterior-to-anterior chamber flow, permits a pressure difference across the iris, and can bow the peripheral iris forward toward the drainage angle.',
    sources: flowSources,
    misconceptionTags: ['pupil-block-location', 'angle-pressure-relationship'],
  }, [
    ['posterior-pressure', 'Pressure can become higher behind the iris than in front of it', 'Blocked communication permits a pressure gradient across the iris.'],
    ['iris-forward', 'The peripheral iris can bow forward', 'The posterior pressure gradient can push the iris anteriorly.'],
    ['angle-narrows', 'Access to the iridocorneal angle can narrow', 'Forward peripheral iris movement can reduce angle access.'],
    ['vitreous-drains', 'The vitreous begins draining through Schlemm canal', 'Schlemm canal drains aqueous from the anterior chamber, not vitreous.', 'aqueous-vitreous-confusion'],
  ], ['posterior-pressure', 'iris-forward', 'angle-narrows']),
  matching({
    id: 'aqueous-media-matching-002',
    misconceptionTags: ['chamber-localization-confusion'],
    familyId: 'aqueous-space-observation-localization',
    sectionId: 'media-chambers',
    objectiveId: 'aqueous-analyze-chamber-angle-relationships',
    stimulusType: 'table',
    bloomLevel: 'analyze',
    difficulty: 'intermediate',
    stem: 'Match each observation to the anterior-segment location it identifies.',
    explanation: 'Cornea-to-iris identifies the anterior chamber, the narrow iris-to-lens space identifies the posterior chamber, and peripheral iris-cornea approximation identifies the iridocorneal angle.',
    sources: anatomySources,
    table: {
      caption: 'Anterior-segment observations',
      columns: [
        { id: 'observation', heading: 'Observation' },
        { id: 'relationship', heading: 'Anatomical relationship' },
      ],
      rows: [
        { id: 'obs-a', cells: { observation: 'A', relationship: 'Fluid lies between posterior cornea and anterior iris' } },
        { id: 'obs-b', cells: { observation: 'B', relationship: 'A narrow fluid space lies behind iris and before the lens-zonular plane' } },
        { id: 'obs-c', cells: { observation: 'C', relationship: 'Peripheral iris approaches the cornea where conventional outflow begins' } },
      ],
    },
  }, [
    ['obs-a', 'Observation A'],
    ['obs-b', 'Observation B'],
    ['obs-c', 'Observation C'],
  ], [
    ['anterior-chamber', 'Anterior chamber', 'This is the cornea-to-iris space.'],
    ['posterior-chamber', 'Posterior chamber', 'This is the narrow iris-to-lens-zonular space.'],
    ['iridocorneal-angle', 'Iridocorneal angle', 'This peripheral junction contains the conventional outflow entrance.'],
    ['vitreous-cavity', 'Vitreous cavity', 'This lies behind the lens and does not match the listed anterior-segment relationships.'],
  ], {
    'obs-a': 'anterior-chamber',
    'obs-b': 'posterior-chamber',
    'obs-c': 'iridocorneal-angle',
  }),
  hotspot({
    id: 'aqueous-media-hotspot-002',
    familyId: 'aqueous-angle-diagram-localization',
    sectionId: 'media-chambers',
    objectiveId: 'aqueous-analyze-chamber-angle-relationships',
    stimulusType: 'diagram',
    bloomLevel: 'apply',
    difficulty: 'intermediate',
    stem: 'A tracer has entered the chamber between the cornea and iris. Select the neutral marker within that chamber.',
    explanation: 'The anterior chamber is the broad aqueous-filled space between the posterior cornea and anterior iris.',
    sources: flowSources,
    misconceptionTags: ['angle-location-confusion'],
  }, chamberFlowImage, [
    { id: 'posterior-chamber', label: 'Posterior chamber marker', interactionLabel: 'Marker A behind the iris', marker: 'A', x: 0.34, y: 0.37, width: 0.10, height: 0.18 },
    { id: 'pupil', label: 'Pupil marker', interactionLabel: 'Marker B at the pupillary opening', marker: 'B', x: 0.43, y: 0.39, width: 0.10, height: 0.17 },
    { id: 'anterior-chamber', label: 'Anterior chamber marker', interactionLabel: 'Marker C in the central anterior chamber', marker: 'C', x: 0.23, y: 0.34, width: 0.14, height: 0.22 },
    { id: 'angle', label: 'Iridocorneal angle marker', interactionLabel: 'Marker D at the peripheral cornea-iris junction', marker: 'D', x: 0.15, y: 0.56, width: 0.12, height: 0.17 },
  ], ['anterior-chamber']),
  short({
    id: 'aqueous-media-short-001',
    misconceptionTags: ['chamber-communication-confusion'],
    familyId: 'aqueous-chamber-communication-opening',
    sectionId: 'media-chambers',
    objectiveId: 'aqueous-analyze-chamber-angle-relationships',
    stimulusType: 'clinical_vignette',
    bloomLevel: 'apply',
    difficulty: 'intermediate',
    stem: 'A tracer moves normally from the posterior chamber into the anterior chamber. Name the opening it must cross.',
    explanation: 'The pupil is the opening in the iris that connects the posterior and anterior chambers.',
    sources: flowSources,
  }, ['pupil', 'pupillary aperture', 'pupillary opening']),
];
