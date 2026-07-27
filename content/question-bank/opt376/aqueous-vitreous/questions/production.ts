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
  sba({ id: 'aqueous-barrier-sba-001', familyId: 'blood-aqueous-barrier-change', sectionId: 'production', objectiveId: 'aqueous-predict-production-barrier-change', stimulusType: 'clinical_vignette', bloomLevel: 'analyze', difficulty: 'intermediate', stem: 'During anterior inflammation, slit-lamp examination shows cells and flare in an otherwise formed anterior chamber. Which mechanism best explains those findings?', explanation: 'Disruption of the blood-aqueous barrier permits increased protein and inflammatory cells to enter aqueous, producing flare and cells.', sources, misconceptionTags: ['barrier-pressure-only'] }, [
    ['barrier-leak', 'Loss of tight-junction barrier integrity in iris vessels and ciliary epithelium', 'This directly permits protein and inflammatory cells to enter aqueous.'],
    ['endothelial-pump', 'Increased corneal endothelial pump activity clearing fluid from stroma', 'This affects corneal hydration and does not generate aqueous cells and flare.', 'barrier-cornea-confusion'],
    ['trabecular-resistance', 'Isolated trabecular resistance with an intact blood-aqueous barrier', 'Resistance may alter IOP but does not by itself account for protein and cells.', 'barrier-pressure-only'],
    ['lens-displacement', 'Anterior displacement of the crystalline lens without inflammation', 'Lens position may change chamber depth but does not cause inflammatory cells and flare.', 'barrier-anatomy-confusion'],
  ], 'barrier-leak'),
  mr({ id: 'aqueous-production-mr-002', familyId: 'aqueous-production-misconceptions', sectionId: 'production', objectiveId: 'aqueous-explain-production', stimulusType: 'error_analysis', bloomLevel: 'understand', difficulty: 'intermediate', stem: 'A learner says, “Aqueous is formed only by passive filtration.” Select the corrections that should be made.', explanation: 'Formation includes active secretion as the major mechanism, with diffusion and ultrafiltration also contributing.', sources, misconceptionTags: ['production-passive-only'] }, [
    ['active-major', 'Active secretion is a major component', 'Ion transport by ciliary epithelium drives much formation.'],
    ['diffusion-contributes', 'Diffusion can contribute', 'Lipid-soluble substances may cross by diffusion.'],
    ['ultrafiltration-contributes', 'Ultrafiltration can contribute', 'Hydrostatic and osmotic forces contribute across ciliary capillaries.'],
    ['trabecular-produces', 'The trabecular meshwork is the main secretory tissue', 'The meshwork is chiefly an outflow structure.', 'production-outflow-confusion'],
  ], ['active-major', 'diffusion-contributes', 'ultrafiltration-contributes']),
  matching({ id: 'aqueous-production-matching-001', familyId: 'aqueous-production-evidence', sectionId: 'production', objectiveId: 'aqueous-predict-production-barrier-change', stimulusType: 'table', bloomLevel: 'analyze', difficulty: 'foundation', stem: 'Use the experimental observations to infer the primary altered process in each trial.', explanation: 'The pattern of inflow, aqueous contents, and the pressure gradient distinguishes reduced secretion, barrier leakage, and impaired conventional drainage.', sources, table: { caption: 'Anonymized anterior-segment trials', columns: [{ id: 'trial', heading: 'Trial' }, { id: 'intervention', heading: 'Intervention or finding' }, { id: 'measurement', heading: 'Measured result' }], rows: [{ id: 'trial-a', cells: { trial: 'Trial A', intervention: 'Ciliary epithelial ion transport is inhibited', measurement: 'Tracer-estimated inflow falls' } }, { id: 'trial-b', cells: { trial: 'Trial B', intervention: 'Anterior inflammation develops', measurement: 'Aqueous protein and cell counts rise' } }, { id: 'trial-c', cells: { trial: 'Trial C', intervention: 'Particles accumulate before Schlemm canal', measurement: 'The pressure gradient across that region rises' } }] } }, [
    ['trial-a', 'Trial A'],
    ['trial-b', 'Trial B'],
    ['trial-c', 'Trial C'],
  ], [
    ['reduced-secretion', 'Reduced active aqueous secretion', 'Ion transport inhibition lowers the secretory contribution to inflow.'],
    ['barrier-leakage', 'Blood-aqueous barrier leakage', 'Inflammatory protein and cells indicate increased barrier permeability.'],
    ['outflow-resistance', 'Increased conventional outflow resistance', 'Pre-canal material with a raised pressure gradient indicates resistance.'],
  ], { 'trial-a': 'reduced-secretion', 'trial-b': 'barrier-leakage', 'trial-c': 'outflow-resistance' }),
  ordering({ id: 'aqueous-production-ordering-001', familyId: 'aqueous-secretion-sequence', sectionId: 'production', objectiveId: 'aqueous-explain-production', stimulusType: 'pathway', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'Arrange the simplified active-secretion pathway from ciliary blood supply to newly formed aqueous.', explanation: 'Solutes move from ciliary capillary plasma through the epithelial bilayer; osmotic water movement then produces aqueous at the non-pigmented surface.', sources, misconceptionTags: ['ciliary-secretion-order'] }, [
    ['ciliary-capillaries', 'Solutes available from ciliary capillaries', 'The ciliary circulation supplies starting material.'],
    ['epithelial-transport', 'Ion transport across the ciliary epithelial bilayer', 'Active transport establishes gradients.'],
    ['water-follows', 'Water follows the osmotic gradient', 'Water movement accompanies transported solute.'],
    ['posterior-release', 'Aqueous enters the posterior chamber', 'The non-pigmented surface releases newly formed aqueous here.'],
  ], ['ciliary-capillaries', 'epithelial-transport', 'water-follows', 'posterior-release']),
];
