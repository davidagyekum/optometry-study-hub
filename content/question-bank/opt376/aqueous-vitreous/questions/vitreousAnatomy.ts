import { hotspot, label, matching, ordering, sba } from '../questionFactory';
import { aqueousLectureSource, eyeAnatomySource, posteriorVitreousDetachmentSource, vitreousCompositionSource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const anatomySources = [aqueousLectureSource, eyeAnatomySource, vitreousCompositionSource];
const structureSources = [aqueousLectureSource, posteriorVitreousDetachmentSource, vitreousCompositionSource];
const vitreousImage = { src: '/images/modules/aqueous/05-vitreous-anatomy.webp', alt: 'Eye cross-section with neutral markers around the posterior cavity and anterior vitreous.', width: 1049, height: 1200 };

export const vitreousAnatomyQuestions: AssessmentQuestion[] = [
  sba({ id: 'vitreous-anatomy-sba-001', familyId: 'vitreous-boundaries', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-identify-anatomy', stimulusType: 'text', bloomLevel: 'remember', difficulty: 'foundation', stem: 'Where is the vitreous body located?', explanation: 'The vitreous fills the posterior segment behind the lens and in front of the retina.', sources: anatomySources }, [
    ['lens-retina', 'Posterior to the lens and anterior to the retina', 'These are the principal anterior and posterior relationships.'],
    ['cornea-iris', 'The cornea–iris interval', 'That is the anterior chamber.', 'aqueous-vitreous-confusion'],
    ['iris-lens', 'The iris–lens interval', 'That is the posterior chamber.', 'aqueous-vitreous-confusion'],
    ['retina-sclera', 'The retina–sclera interval', 'This is not the vitreous cavity.', 'posterior-layer-confusion'],
  ], 'lens-retina'),
  sba({ id: 'vitreous-structure-sba-001', familyId: 'vitreous-gel-properties', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-explain-structure-attachments', stimulusType: 'comparison', bloomLevel: 'understand', difficulty: 'intermediate', stem: 'Why can a material that is approximately 98–99% water behave as a transparent gel rather than free liquid?', explanation: 'A sparse collagen network and hyaluronic acid organize and retain water, producing the vitreous gel structure.', sources: structureSources, misconceptionTags: ['water-means-free-liquid'] }, [
    ['collagen-ha-network', 'Collagen and hyaluronic acid organize the water', 'This macromolecular network gives the hydrated gel its structure.'],
    ['aqueous-mixing', 'Continuous mixing with aqueous converts the water into gel', 'Aqueous mixing does not create vitreous gel structure.', 'aqueous-vitreous-confusion'],
    ['protein-concentration', 'A high concentration of soluble protein alone solidifies the water', 'The gel depends on the organized collagen-hyaluronan network, not a dense soluble-protein mass.', 'vitreous-composition-confusion'],
    ['lens-fibres', 'Lens fibres extend through the posterior cavity and bind the water', 'Lens fibres remain within the lens.', 'lens-vitreous-confusion'],
  ], 'collagen-ha-network'),
  ordering({ id: 'vitreous-anatomy-ordering-001', familyId: 'vitreous-anterior-posterior-landmarks', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-explain-structure-attachments', stimulusType: 'pathway', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Arrange these relationships from the posterior surface of the lens toward the retinal boundary of the vitreous cavity.', explanation: 'The posterior lens surface fits into the hyaloid fossa, followed by central vitreous and then posterior vitreous cortex adjacent to the retina.', sources: structureSources, misconceptionTags: ['vitreous-landmark-order'] }, [
    ['posterior-lens', 'Posterior lens surface', 'This is the anterior starting relationship.'],
    ['hyaloid-fossa', 'Anterior hyaloid fossa', 'This anterior vitreous depression accommodates the posterior lens.'],
    ['central-vitreous', 'Central vitreous body', 'This occupies the main posterior cavity.'],
    ['posterior-cortex', 'Posterior vitreous cortex', 'This forms the posterior vitreous boundary.'],
  ], ['posterior-lens', 'hyaloid-fossa', 'central-vitreous', 'posterior-cortex']),
  matching({ id: 'vitreous-anatomy-matching-001', familyId: 'vitreous-attachment-landmarks', sectionId: 'vitreous-anatomy', objectiveId: 'vitreous-identify-anatomy', stimulusType: 'table', bloomLevel: 'understand', difficulty: 'foundation', stem: 'Infer the vitreous landmark represented by each neutral specimen description.', explanation: 'The vitreous base is the strongest peripheral attachment, the hyaloid fossa receives the lens, and the hyaloid canal marks the fetal vascular course.', sources: anatomySources, table: { caption: 'Neutral vitreous specimen descriptions', columns: [{ id: 'specimen', heading: 'Specimen' }, { id: 'observation', heading: 'Observed relationship' }], rows: [{ id: 'specimen-a', cells: { specimen: 'Specimen A', observation: 'A firm peripheral adhesion straddles the ora serrata' } }, { id: 'specimen-b', cells: { specimen: 'Specimen B', observation: 'An anterior depression conforms to the posterior lens surface' } }, { id: 'specimen-c', cells: { specimen: 'Specimen C', observation: 'A transparent central tract follows the former fetal vascular route' } }] } }, [
    ['specimen-a', 'Specimen A'],
    ['specimen-b', 'Specimen B'],
    ['specimen-c', 'Specimen C'],
  ], [
    ['vitreous-base', 'Vitreous base', 'This is the strongest peripheral attachment around the ora serrata.'],
    ['hyaloid-fossa', 'Hyaloid fossa', 'This anterior depression accommodates the posterior lens.'],
    ['hyaloid-canal', 'Hyaloid canal', 'This central tract marks the fetal hyaloid artery course.'],
  ], { 'specimen-a': 'vitreous-base', 'specimen-b': 'hyaloid-fossa', 'specimen-c': 'hyaloid-canal' }),
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
