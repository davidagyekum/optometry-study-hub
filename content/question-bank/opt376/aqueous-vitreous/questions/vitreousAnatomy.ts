import { hotspot, label, matching, ordering, sba } from '../questionFactory';
import { aqueousLectureSource, eyeAnatomySource, posteriorVitreousDetachmentSource, vitreousCompositionSource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const anatomySources = [aqueousLectureSource, eyeAnatomySource, vitreousCompositionSource];
const structureSources = [aqueousLectureSource, posteriorVitreousDetachmentSource, vitreousCompositionSource];
const vitreousImage = { src: '/images/modules/aqueous/05-vitreous-anatomy.webp', alt: 'Eye cross-section with neutral markers around the posterior cavity and anterior vitreous.', width: 1049, height: 1200 };

export const vitreousAnatomyQuestions: AssessmentQuestion[] = [
  sba({ id: 'vitreous-anatomy-sba-001', familyId: 'vitreous-boundaries', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-identify-anatomy', stimulusType: 'text', bloomLevel: 'remember', difficulty: 'foundation', stem: 'Where is the vitreous body located?', explanation: 'The vitreous fills the posterior segment behind the lens and in front of the retina.', sources: anatomySources }, [
    ['lens-retina', 'Behind the lens and in front of the retina', 'These are the principal anterior and posterior relationships.'],
    ['cornea-iris', 'The cornea-to-iris space', 'That is the anterior chamber.', 'aqueous-vitreous-confusion'],
    ['iris-lens', 'The iris-to-lens space', 'That is the posterior chamber.', 'aqueous-vitreous-confusion'],
    ['retina-sclera', 'The retina-to-sclera space', 'This is not the vitreous cavity.', 'posterior-layer-confusion'],
  ], 'lens-retina'),
  sba({ id: 'vitreous-structure-sba-001', familyId: 'vitreous-gel-properties', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-explain-structure-attachments', stimulusType: 'comparison', bloomLevel: 'understand', difficulty: 'intermediate', stem: 'Why can a material that is approximately 98â€“99% water behave as a transparent gel rather than free liquid?', explanation: 'A sparse collagen network and hyaluronic acid organise and retain water, producing the vitreous gel structure.', sources: structureSources, misconceptionTags: ['water-means-free-liquid'] }, [
    ['collagen-ha-network', 'Collagen and hyaluronic acid organise the water', 'This macromolecular network gives the hydrated gel its structure.'],
    ['aqueous-mixing', 'Continuous mixing with aqueous makes it solid', 'Aqueous mixing does not create vitreous gel structure.', 'aqueous-vitreous-confusion'],
    ['retinal-blood', 'Retinal blood vessels fill the cavity', 'Vessels do not account for the transparent gel.', 'vascular-content-confusion'],
    ['lens-fibres', 'Lens fibres extend throughout the cavity', 'Lens fibres remain within the lens.', 'lens-vitreous-confusion'],
  ], 'collagen-ha-network'),
  ordering({ id: 'vitreous-anatomy-ordering-001', familyId: 'vitreous-anterior-posterior-landmarks', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-explain-structure-attachments', stimulusType: 'pathway', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Arrange these landmarks from anterior to posterior along the visual axis.', explanation: 'The lens is anterior, the hyaloid fossa receives its posterior surface, the vitreous body fills the cavity, and the optic disc lies at the posterior fundus.', sources: structureSources, misconceptionTags: ['vitreous-landmark-order'] }, [
    ['lens', 'Crystalline lens', 'The lens lies anterior to the vitreous.'],
    ['hyaloid-fossa', 'Hyaloid fossa', 'This anterior vitreous depression accommodates the lens.'],
    ['central-vitreous', 'Central vitreous body', 'This occupies the posterior cavity.'],
    ['optic-disc', 'Optic disc region', 'This landmark lies at the posterior fundus.'],
  ], ['lens', 'hyaloid-fossa', 'central-vitreous', 'optic-disc']),
  matching({ id: 'vitreous-anatomy-matching-001', familyId: 'vitreous-attachment-landmarks', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-identify-anatomy', stimulusType: 'table', bloomLevel: 'understand', difficulty: 'foundation', stem: 'Match each vitreous landmark to its defining relationship.', explanation: 'The vitreous base is the strongest peripheral attachment, the hyaloid fossa receives the lens, and the hyaloid canal marks the fetal vascular course.', sources: anatomySources, table: { caption: 'Vitreous landmarks', columns: [{ id: 'landmark', heading: 'Landmark' }, { id: 'relationship', heading: 'Relationship' }], rows: [{ id: 'base-row', cells: { landmark: 'Vitreous base', relationship: 'Near ora serrata' } }, { id: 'fossa-row', cells: { landmark: 'Hyaloid fossa', relationship: 'Anterior depression' } }, { id: 'canal-row', cells: { landmark: 'Hyaloid canal', relationship: 'Fetal vessel course' } }] } }, [
    ['base', 'Vitreous base'],
    ['fossa', 'Hyaloid fossa'],
    ['canal', 'Hyaloid canal'],
  ], [
    ['strong-attachment', 'Strongest peripheral attachment near the ora serrata', 'The vitreous base is the most secure attachment zone.'],
    ['lens-depression', 'Depression accommodating the posterior lens', 'The hyaloid fossa forms this anterior contour.'],
    ['fetal-route', 'Course of the fetal hyaloid artery', 'The canal persists as a transparent central tract.'],
  ], { base: 'strong-attachment', fossa: 'lens-depression', canal: 'fetal-route' }),
  hotspot({ id: 'vitreous-anatomy-hotspot-001', familyId: 'vitreous-base-location', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-explain-structure-attachments', stimulusType: 'diagram', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Select the marked region corresponding to the vitreous base, the strongest peripheral attachment.', explanation: 'The vitreous base straddles the ora serrata in the peripheral retina and pars plana region.', sources: structureSources, misconceptionTags: ['vitreous-attachment-strength'] }, vitreousImage, [
    { id: 'anterior-periphery', label: 'Vitreous base region', interactionLabel: 'Marker A at the anterior peripheral cavity', marker: 'A', x: 0.19, y: 0.38, width: 0.18, height: 0.16 },
    { id: 'central-cavity', label: 'Central vitreous region', interactionLabel: 'Marker B in the central cavity', marker: 'B', x: 0.44, y: 0.42, width: 0.18, height: 0.18 },
    { id: 'posterior-pole', label: 'Posterior pole region', interactionLabel: 'Marker C at the rear wall', marker: 'C', x: 0.68, y: 0.40, width: 0.16, height: 0.18 },
  ], ['anterior-periphery']),
  label({ id: 'vitreous-anatomy-label-001', familyId: 'vitreous-landmark-labelling', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-explain-structure-attachments', stimulusType: 'diagram', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Assign each label to its neutral target on the vitreous diagram.', explanation: 'The hyaloid fossa is anterior, the central vitreous fills the main cavity, and the posterior cortical vitreous lies adjacent to retina.', sources: structureSources, misconceptionTags: ['vitreous-landmark-order'] }, vitreousImage, [
    { id: 'target-a', label: 'Anterior depression target', x: 0.28, y: 0.42 },
    { id: 'target-b', label: 'Central cavity target', x: 0.50, y: 0.47 },
    { id: 'target-c', label: 'Posterior boundary target', x: 0.72, y: 0.45 },
  ], [
    ['hyaloid-fossa', 'Hyaloid fossa', 'This depression receives the posterior lens.'],
    ['central-vitreous', 'Central vitreous', 'This occupies the main posterior cavity.'],
    ['posterior-cortex', 'Posterior vitreous cortex', 'This is adjacent to the retinal surface.'],
  ], { 'target-a': 'hyaloid-fossa', 'target-b': 'central-vitreous', 'target-c': 'posterior-cortex' }),
];
