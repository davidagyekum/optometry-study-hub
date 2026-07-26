import { matching, mr, sba } from '../questionFactory';
import { aqueousLectureSource, intraocularPressureSource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const sources = [aqueousLectureSource, intraocularPressureSource];
export const iopQuestions: AssessmentQuestion[] = [
  sba({ id: 'aqueous-iop-sba-001', familyId: 'iop-clinical-interpretation', sectionId: 'iop', objectiveId: 'aqueous-interpret-iop-measurement-context', stimulusType: 'clinical_vignette', bloomLevel: 'evaluate', difficulty: 'advanced', stem: 'A patient has one IOP reading of 22 mmHg and no optic-nerve, field, corneal, or angle information. Which conclusion is most defensible?', explanation: 'A single reading must be interpreted with measurement method, corneal and temporal context, and structural and functional findings; it does not by itself diagnose glaucoma.', sources, misconceptionTags: ['iop-alone-diagnoses-glaucoma'] }, [
    ['needs-context', 'The reading needs clinical and measurement context before diagnosis', 'This weighs the available evidence and its limitations.'],
    ['definite-glaucoma', 'The patient definitely has glaucoma', 'IOP alone is insufficient for that diagnosis.', 'iop-alone-diagnoses-glaucoma'],
    ['definite-normal', 'The eye is definitely normal because the value is close to a common range', 'A statistical range cannot establish individual health.', 'range-equals-health'],
    ['retinal-detachment', 'The reading proves retinal detachment', 'IOP does not establish that diagnosis.', 'unrelated-diagnosis'],
  ], 'needs-context'),
  sba({ id: 'aqueous-iop-sba-002', familyId: 'iop-time-posture-context', sectionId: 'iop', objectiveId: 'aqueous-interpret-iop-measurement-context', stimulusType: 'clinical_vignette', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'A seated afternoon IOP is lower than a supine early-morning reading in the same patient. What is the best next interpretation?', explanation: 'IOP varies with time and posture, so comparable technique and timing help determine whether the difference persists.', sources, misconceptionTags: ['iop-context-ignored'] }, [
    ['standardize-repeat', 'Repeat under comparable posture, time, and technique', 'Standardisation helps separate physiologic and measurement variation from a persistent change.'],
    ['average-diagnoses', 'Average the two values and diagnose from that number alone', 'A mean still lacks full clinical context.', 'iop-alone-diagnoses-glaucoma'],
    ['discard-both', 'Discard both because IOP can never be measured usefully', 'Variation does not make measurement useless.', 'measurement-nihilism'],
    ['vitreous-cause', 'Attribute the difference solely to vitreous liquefaction', 'The supplied variables more directly explain the difference.', 'aqueous-vitreous-confusion'],
  ], 'standardize-repeat'),
  mr({ id: 'aqueous-iop-mr-001', familyId: 'iop-measurement-factors', sectionId: 'iop', objectiveId: 'aqueous-identify-iop-measurement', stimulusType: 'comparison', bloomLevel: 'understand', difficulty: 'intermediate', stem: 'Select the factors that should be recorded or considered when comparing IOP measurements.', explanation: 'Time, posture, instrument or technique, and corneal properties can influence interpretation of a reading.', sources, misconceptionTags: ['iop-number-context-free'] }, [
    ['time', 'Recorded time of day', 'Diurnal variation can alter IOP.'],
    ['posture', 'Recorded patient posture', 'Supine and seated measurements can differ.'],
    ['method', 'Recorded instrument and technique', 'Different methods have different assumptions and limitations.'],
    ['iris-colour-only', 'Recorded iris colour as the sole determinant', 'Iris colour alone does not provide the needed measurement context.', 'irrelevant-measurement-factor'],
  ], ['time', 'posture', 'method']),
  matching({ id: 'aqueous-iop-matching-001', familyId: 'iop-determinant-errors', sectionId: 'iop', objectiveId: 'aqueous-relate-iop-determinants', stimulusType: 'error_analysis', bloomLevel: 'analyze', difficulty: 'advanced', stem: 'Match each mistaken interpretation to the determinant that the learner overlooked.', explanation: 'Formation, trabecular resistance, and episcleral venous pressure all contribute to pressure balance; measurement context remains separate from those physiologic determinants.', sources, misconceptionTags: ['iop-single-factor-model'] }, [
    ['secretion-only', 'â€œOnly secretion can raise IOP.â€'],
    ['meshwork-only', 'â€œAn open meshwork guarantees low IOP regardless of downstream pressure.â€'],
    ['one-reading', 'â€œOne tonometer value is a context-free diagnosis.â€'],
  ], [
    ['outflow-resistance', 'Outflow resistance also matters', 'Pressure can rise when drainage resistance increases.'],
    ['episcleral-pressure', 'Episcleral venous pressure also matters', 'Downstream venous pressure affects conventional drainage.'],
    ['measurement-context', 'Measurement and clinical context also matter', 'A reading must be interpreted rather than used alone.'],
  ], { 'secretion-only': 'outflow-resistance', 'meshwork-only': 'episcleral-pressure', 'one-reading': 'measurement-context' }),
];
