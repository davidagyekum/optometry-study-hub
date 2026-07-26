import { matching, mr, ordering, sba } from '../questionFactory';
import { aqueousLectureSource, aqueousPhysiologySource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const sources = [aqueousLectureSource, aqueousPhysiologySource];

export const productionQuestions: AssessmentQuestion[] = [
  sba({ id: 'aqueous-production-sba-001', familyId: 'aqueous-production-mechanisms', sectionId: 'production', objectiveId: 'aqueous-explain-production', stimulusType: 'text', bloomLevel: 'remember', difficulty: 'foundation', stem: 'Which ciliary epithelial layer directly secretes aqueous into the posterior chamber?', explanation: 'The non-pigmented ciliary epithelium forms the inner secretory layer facing the posterior chamber.', sources }, [
    ['non-pigmented', 'Non-pigmented ciliary epithelium', 'This layer directly faces and secretes into the posterior chamber.'],
    ['pigmented', 'Pigmented ciliary epithelium', 'It participates in the epithelial bilayer but is not the final secretory surface.', 'ciliary-layer-reversal'],
    ['corneal-endothelium', 'Corneal endothelium', 'It maintains corneal hydration rather than producing aqueous.', 'anterior-tissue-confusion'],
    ['trabecular-endothelium', 'Trabecular meshwork endothelium', 'This participates in outflow, not production.', 'production-outflow-confusion'],
  ], 'non-pigmented'),
  sba({ id: 'aqueous-barrier-sba-001', familyId: 'blood-aqueous-barrier-change', sectionId: 'production', objectiveId: 'aqueous-predict-production-barrier-change', stimulusType: 'clinical_vignette', bloomLevel: 'analyze', difficulty: 'intermediate', stem: 'Inflammation disrupts the blood-aqueous barrier. Which anterior-chamber finding is the most direct predicted consequence?', explanation: 'Barrier disruption permits increased protein and inflammatory cells to enter aqueous, producing flare and cells on examination.', sources, misconceptionTags: ['barrier-pressure-only'] }, [
    ['cells-protein', 'Increased cells and protein in aqueous', 'This follows directly from loss of selective barrier integrity.'],
    ['retina-avascular', 'Immediate loss of all retinal vessels', 'Retinal vascular anatomy is not created by the blood-aqueous barrier.', 'barrier-retina-confusion'],
    ['vitreous-solid', 'Conversion of vitreous into a solid mass', 'This is unrelated to anterior-segment barrier leakage.', 'aqueous-vitreous-confusion'],
    ['pupil-disappears', 'Anatomical disappearance of the pupil', 'Barrier disruption does not remove the iris aperture.', 'barrier-anatomy-confusion'],
  ], 'cells-protein'),
  mr({ id: 'aqueous-production-mr-002', familyId: 'aqueous-production-misconceptions', sectionId: 'production', objectiveId: 'aqueous-explain-production', stimulusType: 'error_analysis', bloomLevel: 'understand', difficulty: 'intermediate', stem: 'A learner says, “Aqueous is formed only by passive filtration.” Select the corrections that should be made.', explanation: 'Formation includes active secretion as the major mechanism, with diffusion and ultrafiltration also contributing.', sources, misconceptionTags: ['production-passive-only'] }, [
    ['active-major', 'Active secretion is a major component', 'Ion transport by ciliary epithelium drives much formation.'],
    ['diffusion-contributes', 'Diffusion can contribute', 'Lipid-soluble substances may cross by diffusion.'],
    ['ultrafiltration-contributes', 'Ultrafiltration can contribute', 'Hydrostatic and osmotic forces contribute across ciliary capillaries.'],
    ['trabecular-produces', 'The trabecular meshwork is the main secretory tissue', 'The meshwork is chiefly an outflow structure.', 'production-outflow-confusion'],
  ], ['active-major', 'diffusion-contributes', 'ultrafiltration-contributes']),
  matching({ id: 'aqueous-production-matching-001', familyId: 'aqueous-production-evidence', sectionId: 'production', objectiveId: 'aqueous-predict-production-barrier-change', stimulusType: 'table', bloomLevel: 'analyze', difficulty: 'foundation', stem: 'Use the accessible table to match each altered process to its most direct consequence.', explanation: 'The consequences distinguish secretion, barrier integrity, and drainage rather than treating all changes as the same mechanism.', sources, table: { caption: 'Anterior-segment process changes', columns: [{ id: 'change', heading: 'Change' }, { id: 'observation', heading: 'Likely observation' }], rows: [{ id: 'row-one', cells: { change: 'Reduced active ion transport', observation: 'Lower formation tendency' } }, { id: 'row-two', cells: { change: 'Barrier disruption', observation: 'More protein and cells' } }, { id: 'row-three', cells: { change: 'Outflow obstruction', observation: 'Greater drainage resistance' } }] } }, [
    ['reduced-transport', 'Reduced active ciliary ion transport'],
    ['barrier-loss', 'Blood-aqueous barrier disruption'],
    ['meshwork-block', 'Trabecular obstruction'],
  ], [
    ['less-formation', 'Reduced aqueous formation tendency', 'Active secretion depends on epithelial ion transport.'],
    ['cells-flare', 'More protein and cells in aqueous', 'Barrier loss increases permeability.'],
    ['higher-resistance', 'Increased conventional outflow resistance', 'Meshwork obstruction impedes drainage.'],
  ], { 'reduced-transport': 'less-formation', 'barrier-loss': 'cells-flare', 'meshwork-block': 'higher-resistance' }),
  ordering({ id: 'aqueous-production-ordering-001', familyId: 'aqueous-secretion-sequence', sectionId: 'production', objectiveId: 'aqueous-explain-production', stimulusType: 'pathway', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Arrange the simplified active-secretion pathway from ciliary blood supply to newly formed aqueous.', explanation: 'Solutes move from ciliary capillary plasma through the epithelial bilayer; osmotic water movement then produces aqueous at the non-pigmented surface.', sources, misconceptionTags: ['ciliary-secretion-order'] }, [
    ['ciliary-capillaries', 'Solutes available from ciliary capillaries', 'The ciliary circulation supplies starting material.'],
    ['epithelial-transport', 'Ion transport across the ciliary epithelial bilayer', 'Active transport establishes gradients.'],
    ['water-follows', 'Water follows the osmotic gradient', 'Water movement accompanies transported solute.'],
    ['posterior-release', 'Aqueous enters the posterior chamber', 'The non-pigmented surface releases newly formed aqueous here.'],
  ], ['ciliary-capillaries', 'epithelial-transport', 'water-follows', 'posterior-release']),
];
