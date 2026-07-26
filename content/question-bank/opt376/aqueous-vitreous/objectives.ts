import { aqueousLectureSource, aqueousPhysiologySource, eyeAnatomySource, intraocularPressureSource, neiVitreousDetachmentSource, openStaxVisionSource, posteriorVitreousDetachmentSource, vitreousCompositionSource } from './sources';
import type { LearningObjective } from '@/lib/assessment/types';

const objective = (id: string, sectionId: string, statement: string, targetBloomLevels: LearningObjective['targetBloomLevels'], sourceIds: string[]): LearningObjective => ({ schemaVersion: 1, id, courseId: 'neuro-anatomy', moduleId: 'aqueous-vitreous', sectionId, statement, targetBloomLevels, tags: sectionId.startsWith('vitreous') ? ['vitreous', sectionId] : ['aqueous', sectionId], sourceIds, reviewStatus: 'draft' });

export const aqueousVitreousObjectives: LearningObjective[] = [
  objective('aqueous-identify-chambers', 'media-chambers', 'Identify the boundaries and contents of the anterior and posterior chambers.', ['remember', 'understand'], [aqueousLectureSource.id, openStaxVisionSource.id, eyeAnatomySource.id]),
  objective('aqueous-analyze-chamber-angle-relationships', 'media-chambers', 'Relate chamber configuration to access at the iridocorneal angle.', ['apply', 'analyze'], [aqueousLectureSource.id, eyeAnatomySource.id]),
  objective('aqueous-explain-production', 'production', 'Explain aqueous secretion, filtration or diffusion, and support of avascular tissues.', ['remember', 'understand', 'apply'], [aqueousLectureSource.id, aqueousPhysiologySource.id]),
  objective('aqueous-predict-production-barrier-change', 'production', 'Predict consequences of altered secretion or blood-aqueous barrier integrity.', ['analyze'], [aqueousLectureSource.id, aqueousPhysiologySource.id]),
  objective('aqueous-identify-outflow-resistance', 'flow', 'Identify and apply the principal resistance site in conventional aqueous outflow.', ['remember', 'apply'], [aqueousLectureSource.id, aqueousPhysiologySource.id]),
  objective('aqueous-trace-conventional-outflow', 'flow', 'Trace conventional outflow and compare it with unconventional outflow.', ['understand', 'apply', 'analyze'], [aqueousLectureSource.id, aqueousPhysiologySource.id]),
  objective('aqueous-relate-iop-determinants', 'iop', 'Relate formation, outflow resistance, and episcleral venous pressure to IOP.', ['apply', 'analyze'], [aqueousLectureSource.id, aqueousPhysiologySource.id, intraocularPressureSource.id]),
  objective('aqueous-identify-iop-measurement', 'iop', 'Identify IOP measurement terminology and factors that affect readings.', ['remember', 'understand'], [aqueousLectureSource.id, intraocularPressureSource.id]),
  objective('aqueous-interpret-iop-measurement-context', 'iop', 'Interpret IOP in the context of time, posture, method, and clinical limitations.', ['apply', 'evaluate'], [intraocularPressureSource.id]),
  objective('vitreous-identify-anatomy', 'vitreous-anatomy', 'Identify vitreous boundaries, attachments, and internal landmarks.', ['remember', 'understand'], [aqueousLectureSource.id, openStaxVisionSource.id, eyeAnatomySource.id, vitreousCompositionSource.id]),
  objective('vitreous-explain-structure-attachments', 'vitreous-anatomy', 'Explain gel properties and relate them to vitreous structure and attachments.', ['understand', 'apply'], [aqueousLectureSource.id, posteriorVitreousDetachmentSource.id, vitreousCompositionSource.id]),
  objective('vitreous-interpret-clinical-change', 'vitreous-clinical', 'Interpret ageing, syneresis, traction, flashes, and floaters.', ['remember', 'apply', 'analyze'], [aqueousLectureSource.id, posteriorVitreousDetachmentSource.id]),
  objective('vitreous-evaluate-retinal-warning-signs', 'vitreous-clinical', 'Evaluate warning patterns that require urgent retinal assessment.', ['apply', 'evaluate', 'create'], [neiVitreousDetachmentSource.id, posteriorVitreousDetachmentSource.id]),
];
