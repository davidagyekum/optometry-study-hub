import { extended, open, sba, short } from '../questionFactory';
import { aqueousLectureSource, neiVitreousDetachmentSource, posteriorVitreousDetachmentSource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const changeSources = [aqueousLectureSource, posteriorVitreousDetachmentSource];
const warningSources = [neiVitreousDetachmentSource, posteriorVitreousDetachmentSource];
export const vitreousClinicalQuestions: AssessmentQuestion[] = [
  sba({ id: 'vitreous-clinical-sba-001', familyId: 'vitreous-retinal-warning-triage', sectionId: 'vitreous-clinical', objectiveId: 'vitreous-evaluate-retinal-warning-signs', stimulusType: 'clinical_vignette', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'A patient reports a sudden shower of new floaters with repeated flashes. What is the safest next step within this module’s scope?', explanation: 'Acute flashes and new floaters can accompany vitreoretinal traction or a retinal tear and warrant urgent dilated retinal assessment.', sources: warningSources, misconceptionTags: ['benign-floater-assumption'] }, [
    ['urgent-dilated-exam', 'Arrange urgent dilated retinal assessment', 'The symptom pattern may signal a retinal tear or detachment.'],
    ['routine-dilated-exam', 'Arrange only a routine dilated examination at the next annual visit', 'The acute symptom pattern warrants more urgent assessment.', 'benign-floater-assumption'],
    ['non-dilated-check', 'Perform a non-dilated anterior-segment check and discharge', 'This does not adequately evaluate the peripheral retina.', 'anterior-only-assessment'],
    ['telephone-review', 'Offer telephone review in one month without an ocular examination', 'Delay could miss sight-threatening retinal disease.', 'symptom-dismissal'],
  ], 'urgent-dilated-exam'),
  sba({ id: 'vitreous-clinical-sba-002', familyId: 'vitreous-syneresis-definition', sectionId: 'vitreous-clinical', objectiveId: 'vitreous-interpret-clinical-change', stimulusType: 'text', bloomLevel: 'remember', difficulty: 'foundation', stem: 'Which term specifically describes age-related liquefaction that creates fluid-filled pockets within the vitreous gel?', explanation: 'Synchysis denotes vitreous liquefaction; it commonly accompanies structural collapse and aggregation described as syneresis.', sources: changeSources }, [
    ['synchysis', 'Synchysis', 'This term denotes liquefaction of vitreous gel.'],
    ['posterior-detachment', 'Posterior vitreous detachment', 'This is separation of posterior vitreous cortex from retina, not the liquefaction itself.', 'vitreous-term-confusion'],
    ['vitreous-haemorrhage', 'Vitreous haemorrhage', 'This is blood within the vitreous cavity.', 'vitreous-term-confusion'],
    ['asteroid-hyalosis', 'Asteroid hyalosis', 'This describes suspended vitreous opacities rather than gel liquefaction.', 'vitreous-term-confusion'],
  ], 'synchysis'),
  extended({ id: 'vitreous-clinical-extended-001', familyId: 'vitreous-warning-pattern-evaluation', sectionId: 'vitreous-clinical', objectiveId: 'vitreous-evaluate-retinal-warning-signs', stimulusType: 'clinical_vignette', bloomLevel: 'evaluate', difficulty: 'advanced', stem: 'For each presentation, choose the most appropriate urgency category.', explanation: 'Sudden flashes, a shower of floaters, or a curtain-like field defect require urgent retinal assessment; stable long-standing symptoms without change are less urgent but still need appropriate routine review.', sources: warningSources, misconceptionTags: ['retinal-warning-triage'] }, [
    ['curtain', 'New curtain-like field loss after flashes'],
    ['stable-floater', 'One unchanged floater present for years with no flashes'],
    ['new-shower', 'Sudden shower of floaters today'],
  ], [
    ['emergency', 'Immediate emergency retinal pathway', 'Curtain-like loss is compatible with retinal detachment.'],
    ['urgent', 'Urgent dilated retinal assessment', 'Acute new floaters can signal a tear.'],
    ['routine', 'Routine non-emergency review', 'Stable symptoms without change do not carry the same acute pattern.'],
    ['no-review', 'No eye assessment ever required', 'Symptoms should not be categorically dismissed.', 'symptom-dismissal'],
  ], { curtain: 'emergency', 'stable-floater': 'routine', 'new-shower': 'urgent' }),
  short({ id: 'vitreous-clinical-short-001', familyId: 'vitreous-misconception-correction', sectionId: 'vitreous-clinical', objectiveId: 'vitreous-interpret-clinical-change', stimulusType: 'error_analysis', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'A learner labels a 67-year-old’s gradually increasing mobile floaters as posterior vitreous detachment, but examination shows fluid-filled pockets without retinal separation. Correct the learner by supplying the single term for the gel change.', explanation: 'The findings describe synchysis, the liquefaction of vitreous gel.', sources: changeSources, misconceptionTags: ['vitreous-term-confusion'] }, ['synchysis']),
  open({ id: 'vitreous-clinical-open-response-002', familyId: 'vitreous-safety-message-design', sectionId: 'vitreous-clinical', objectiveId: 'vitreous-evaluate-retinal-warning-signs', stimulusType: 'error_analysis', bloomLevel: 'create', difficulty: 'advanced', stem: 'Rewrite this unsafe message into a concise patient-safety message: “New flashes and floaters are normal ageing, so wait a month.”', explanation: 'A safe message distinguishes common vitreous ageing from retinal risk and gives clear, urgent action for sudden flashes, floaters, or a curtain-like field defect.', sources: warningSources, misconceptionTags: ['benign-floater-assumption'] }, 'Sudden new flashes, a shower of floaters, or a curtain or shadow in vision can indicate a retinal tear or detachment. Seek urgent dilated eye assessment rather than waiting.', [
    'States that acute symptoms can indicate a retinal tear or detachment.',
    'Names at least two warning patterns, including sudden flashes, new floaters, or a curtain-like defect.',
    'Gives an unambiguous instruction to obtain urgent retinal assessment.',
    'Avoids claiming that every floater is an emergency or providing treatment advice.',
  ]),
];
