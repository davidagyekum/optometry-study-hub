import { matching, mr, sba } from '../questionFactory';
import { aqueousLectureSource, intraocularPressureSource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const sources = [aqueousLectureSource, intraocularPressureSource];
export const iopQuestions: AssessmentQuestion[] = [
  sba({ id: 'aqueous-iop-sba-001', familyId: 'iop-clinical-interpretation', sectionId: 'iop', objectiveId: 'aqueous-interpret-iop-measurement-context', stimulusType: 'clinical_vignette', bloomLevel: 'evaluate', difficulty: 'advanced', stem: 'A patient has one IOP reading of 22 mmHg and no optic-nerve, field, corneal, angle, time-of-day, or measurement-method information. Which conclusion is most defensible?', explanation: 'A single reading must be interpreted with measurement method, corneal and temporal context, and structural and functional findings; it does not by itself diagnose or exclude glaucoma.', sources, misconceptionTags: ['iop-alone-diagnoses-glaucoma'] }, [
    ['needs-context', 'Clinical and measurement context is required before diagnosis', 'This weighs both the reading and the missing evidence.'],
    ['diagnose-threshold', 'Glaucoma is confirmed because the result exceeds 21 mmHg', 'A statistical cutoff cannot establish glaucoma without the rest of the assessment.', 'iop-alone-diagnoses-glaucoma'],
    ['exclude-below-24', 'Glaucoma is excluded because the result is below 24 mmHg', 'No isolated threshold safely excludes glaucoma.', 'range-equals-health'],
    ['treat-without-repeat', 'Immediate treatment is warranted without confirming technique or ocular findings', 'Management should not be based on an uncontextualized single value.', 'measurement-context-ignored'],
  ], 'needs-context'),
  sba({ id: 'aqueous-iop-sba-002', familyId: 'iop-time-posture-context', sectionId: 'iop', objectiveId: 'aqueous-interpret-iop-measurement-context', stimulusType: 'clinical_vignette', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'A seated afternoon IOP is lower than a supine early-morning reading in the same patient. What is the best next interpretation?', explanation: 'IOP varies with time and posture, so comparable technique and timing help determine whether the difference persists.', sources, misconceptionTags: ['iop-context-ignored'] }, [
    ['standardize-repeat', 'Repeat the measurements under comparable posture, time, and technique', 'Standardization helps separate physiologic and measurement variation from a persistent change.'],
    ['average-diagnoses', 'Average the values and diagnose solely from the mean', 'A mean still lacks comparable measurement conditions and full clinical context.', 'iop-alone-diagnoses-glaucoma'],
    ['morning-invalid', 'Discard every early-morning value as inherently invalid', 'Time-related variation does not make a measurement invalid.', 'iop-context-ignored'],
    ['supine-diagnostic', 'Treat the supine value as the only diagnostically valid value', 'Posture should be recorded and standardized rather than privileged without context.', 'posture-context-ignored'],
  ], 'standardize-repeat'),
  mr({ id: 'aqueous-iop-mr-001', familyId: 'iop-measurement-factors', sectionId: 'iop', objectiveId: 'aqueous-identify-iop-measurement', stimulusType: 'comparison', bloomLevel: 'understand', difficulty: 'intermediate', stem: 'Select the factors that should be recorded or considered when comparing IOP measurements.', explanation: 'Time, posture, instrument or technique, and relevant corneal measurement context such as central corneal thickness can influence interpretation of a reading.', sources, misconceptionTags: ['iop-number-context-free'] }, [
    ['time', 'Recorded time of day', 'Diurnal variation can alter IOP.'],
    ['posture', 'Recorded patient posture', 'Supine and seated measurements can differ.'],
    ['method', 'Recorded instrument and technique', 'Different methods have different assumptions and limitations.'],
    ['central-corneal-thickness', 'Recorded central corneal thickness', 'Corneal properties can affect the interpretation of applanation-based readings.'],
    ['iris-colour-only', 'Iris colour as the sole correction factor', 'Iris colour is not a stand-alone correction for the measurement.', 'irrelevant-measurement-factor'],
  ], ['time', 'posture', 'method', 'central-corneal-thickness']),
  matching({ id: 'aqueous-iop-matching-001', familyId: 'iop-determinant-errors', sectionId: 'iop', objectiveId: 'aqueous-relate-iop-determinants', stimulusType: 'error_analysis', bloomLevel: 'analyze', difficulty: 'advanced', stem: 'Match each mistaken interpretation to the one determinant or context that the learner overlooked.', explanation: 'Formation, trabecular resistance, and episcleral venous pressure contribute to pressure balance; measurement context is separate from those physiologic determinants.', sources, misconceptionTags: ['iop-single-factor-model'] }, [
    ['formation-normal', '“Aqueous formation and episcleral venous pressure are unchanged, so IOP cannot rise.”'],
    ['meshwork-low', '“Aqueous formation and trabecular resistance are unchanged, so IOP cannot rise.”'],
    ['one-reading', '“One tonometer value is a context-free diagnosis.”'],
  ], [
    ['outflow-resistance', 'Trabecular outflow resistance', 'Raised resistance can elevate IOP even when formation is normal.'],
    ['episcleral-pressure', 'Episcleral venous pressure', 'Raised downstream venous pressure can elevate IOP despite low trabecular resistance.'],
    ['measurement-context', 'Measurement and clinical context', 'A reading must be interpreted with technique and ocular findings.'],
  ], { 'formation-normal': 'outflow-resistance', 'meshwork-low': 'episcleral-pressure', 'one-reading': 'measurement-context' }),
];
