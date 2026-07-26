import { hotspot, mr, ordering, sba } from '../questionFactory';
import { aqueousLectureSource, eyeAnatomySource, openStaxVisionSource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const chamberImage = { src: '/images/modules/aqueous/01-media-chambers.webp', alt: 'Cross-section of the eye with neutral markers over anterior-segment spaces.', width: 1043, height: 577 };
const sources = [aqueousLectureSource, eyeAnatomySource];

export const mediaChambersQuestions: AssessmentQuestion[] = [
  sba({ id: 'aqueous-chambers-sba-002', familyId: 'aqueous-chamber-contents', sectionId: 'media-chambers', objectiveId: 'aqueous-identify-chambers', stimulusType: 'text', bloomLevel: 'remember', difficulty: 'foundation', stem: 'Which space lies behind the iris and in front of the lens and zonules?', explanation: 'The posterior chamber is the narrow aqueous-filled space between the posterior iris and the lens-zonular plane.', sources }, [
    ['posterior-chamber', 'Posterior chamber', 'This space has the stated boundaries.'],
    ['anterior-chamber', 'Anterior chamber', 'This lies between the cornea and iris.', 'chamber-boundary-confusion'],
    ['vitreous-cavity', 'Vitreous cavity', 'This large posterior space lies behind the lens.', 'aqueous-vitreous-confusion'],
    ['subretinal-space', 'Subretinal space', 'This is not an aqueous chamber.', 'ocular-space-confusion'],
  ], 'posterior-chamber'),
  sba({ id: 'aqueous-angle-sba-001', familyId: 'aqueous-angle-accessibility', sectionId: 'media-chambers', objectiveId: 'aqueous-analyze-chamber-angle-relationships', stimulusType: 'clinical_vignette', bloomLevel: 'analyze', difficulty: 'advanced', stem: 'Two eyes have the same measured IOP. Eye A has a markedly shallow peripheral anterior chamber, while Eye B has a deep chamber. Which interpretation best follows from their anatomy?', explanation: 'A shallow peripheral chamber places the iris closer to the trabecular region, so angle access may be narrower even when a single IOP reading matches.', sources, misconceptionTags: ['iop-equals-angle-status'] }, [
    ['angle-a-narrower', 'Eye A may have narrower access to the drainage angle', 'Peripheral iris-cornea proximity can narrow the angle.'],
    ['angle-b-narrower', 'Eye B must have narrower access to the drainage angle', 'A deeper chamber does not support this conclusion.', 'depth-direction-reversal'],
    ['same-angle', 'Their identical IOP proves identical angle anatomy', 'IOP alone does not define chamber configuration.', 'iop-equals-angle-status'],
    ['vitreous-determines', 'Vitreous volume alone determines which angle is open', 'Vitreous volume is not the direct comparison supplied.', 'aqueous-vitreous-confusion'],
  ], 'angle-a-narrower'),
  mr({ id: 'aqueous-chambers-mr-001', familyId: 'aqueous-chamber-boundaries', sectionId: 'media-chambers', objectiveId: 'aqueous-identify-chambers', stimulusType: 'comparison', bloomLevel: 'understand', difficulty: 'intermediate', stem: 'Select the statements that correctly distinguish the two aqueous chambers.', explanation: 'The cornea and iris bound the anterior chamber; the posterior chamber is behind the iris, communicates through the pupil, and lies before the lens-zonular plane.', sources, misconceptionTags: ['aqueous-chamber-boundaries'] }, [
    ['ac-cornea-iris', 'The anterior chamber lies chiefly between cornea and iris', 'This is the defining anterior-chamber relationship.'],
    ['pc-iris-lens', 'The posterior chamber lies between iris and lens-zonular structures', 'This is the defining posterior-chamber relationship.'],
    ['pupil-connects', 'The pupil connects the chambers', 'Aqueous passes through the pupil.'],
    ['lens-separates', 'The crystalline lens completely separates the chambers', 'The iris, not the lens, separates them except at the pupil.', 'lens-chamber-separator'],
  ], ['ac-cornea-iris', 'pc-iris-lens', 'pupil-connects']),
  ordering({ id: 'aqueous-chambers-ordering-001', familyId: 'aqueous-anterior-segment-route', sectionId: 'media-chambers', objectiveId: 'aqueous-analyze-chamber-angle-relationships', stimulusType: 'pathway', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Place these spaces or openings in the order encountered by newly formed aqueous before it reaches the drainage angle.', explanation: 'Aqueous enters the posterior chamber, crosses the pupil, circulates through the anterior chamber, then reaches the iridocorneal angle.', sources, misconceptionTags: ['aqueous-route-order'] }, [
    ['posterior-chamber', 'Posterior chamber', 'This receives newly secreted aqueous.'],
    ['pupil', 'Pupil', 'This opening connects the chambers.'],
    ['anterior-chamber', 'Anterior chamber', 'Aqueous enters this chamber after the pupil.'],
    ['iridocorneal-angle', 'Iridocorneal angle', 'This peripheral region contains the conventional outflow entrance.'],
  ], ['posterior-chamber', 'pupil', 'anterior-chamber', 'iridocorneal-angle']),
  hotspot({ id: 'aqueous-chambers-hotspot-001', familyId: 'aqueous-chamber-location', sectionId: 'media-chambers', objectiveId: 'aqueous-analyze-chamber-angle-relationships', stimulusType: 'diagram', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Select the marked space that represents the posterior chamber.', explanation: 'The posterior chamber is the narrow space immediately behind the iris and anterior to the lens.', sources: [aqueousLectureSource, openStaxVisionSource], misconceptionTags: ['aqueous-chamber-location'] }, chamberImage, [
    { id: 'anterior-space', label: 'Anterior chamber region', interactionLabel: 'Marker A in the broad front space', marker: 'A', x: 0.15, y: 0.38, width: 0.18, height: 0.18 },
    { id: 'posterior-space', label: 'Posterior chamber region', interactionLabel: 'Marker B in the narrow middle space', marker: 'B', x: 0.36, y: 0.40, width: 0.13, height: 0.16 },
    { id: 'vitreous-space', label: 'Vitreous cavity region', interactionLabel: 'Marker C in the large rear space', marker: 'C', x: 0.58, y: 0.30, width: 0.20, height: 0.28 },
  ], ['posterior-space']),
];
