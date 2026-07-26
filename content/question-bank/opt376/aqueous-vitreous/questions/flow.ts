import { extended, sba } from '../questionFactory';
import { aqueousLectureSource, aqueousPhysiologySource } from '../sources';
import type { AssessmentQuestion } from '@/lib/assessment/types';

const sources = [aqueousLectureSource, aqueousPhysiologySource];
export const flowQuestions: AssessmentQuestion[] = [
  sba({ id: 'aqueous-flow-sba-002', familyId: 'aqueous-outflow-resistance-application', sectionId: 'flow', objectiveId: 'aqueous-identify-outflow-resistance', stimulusType: 'pathway', bloomLevel: 'apply', difficulty: 'intermediate', stem: 'A tracer crosses the pupil normally but slows sharply before entering Schlemm canal. Which structure best localises the increased resistance?', explanation: 'The trabecular meshwork, especially its juxtacanalicular region, is the principal conventional resistance site before Schlemm canal.', sources, misconceptionTags: ['aqueous-route-order'] }, [
    ['trabecular-meshwork', 'Trabecular meshwork', 'The tracer slows at the principal pre-canal resistance site.'],
    ['pupil', 'Pupil', 'The scenario says passage through the pupil is normal.', 'route-clue-ignored'],
    ['collector-channels', 'Collector channels', 'These are downstream from Schlemm canal.', 'outflow-sequence-confusion'],
    ['uveoscleral-space', 'Uveoscleral pathway', 'This is an alternative route, not the stated pre-canal location.', 'pathway-confusion'],
  ], 'trabecular-meshwork'),
  extended({ id: 'aqueous-flow-extended-001', familyId: 'aqueous-outflow-pathway-comparison', sectionId: 'flow', objectiveId: 'aqueous-trace-conventional-outflow', stimulusType: 'table', bloomLevel: 'analyze', difficulty: 'advanced', stem: 'Use the pathway table to assign the route best described by each observation.', explanation: 'Conventional flow enters the trabecular-Schlemm-venous sequence, whereas unconventional flow passes through ciliary muscle and suprachoroidal routes; their proportions are variable rather than fixed.', sources, misconceptionTags: ['outflow-split-invariant'], table: { caption: 'Contrasting aqueous outflow observations', columns: [{ id: 'observation', heading: 'Observation' }, { id: 'route-clue', heading: 'Route clue' }], rows: [{ id: 'row-a', cells: { observation: 'Tracer in Schlemm canal', 'route-clue': 'Venous drainage' } }, { id: 'row-b', cells: { observation: 'Tracer between ciliary muscle bundles', 'route-clue': 'Suprachoroidal direction' } }, { id: 'row-c', cells: { observation: 'Raised downstream venous pressure', 'route-clue': 'Affects pressure-dependent drainage' } }] } }, [
    ['schlemm-tracer', 'Tracer is seen within Schlemm canal'],
    ['ciliary-tracer', 'Tracer passes between ciliary muscle bundles toward the suprachoroidal space'],
    ['venous-rise', 'Raised episcleral venous pressure impedes downstream drainage'],
  ], [
    ['conventional', 'Conventional trabecular pathway', 'This route includes trabecular meshwork and Schlemm canal.'],
    ['unconventional', 'Unconventional uveoscleral pathway', 'This route passes through ciliary muscle toward suprachoroidal tissues.'],
    ['conventional-pressure', 'Pressure-dependent conventional drainage', 'Episcleral venous pressure is downstream of conventional drainage.'],
    ['vitreous-route', 'Vitreous-to-retinal pathway', 'This is not an aqueous outflow route.', 'aqueous-vitreous-confusion'],
  ], { 'schlemm-tracer': 'conventional', 'ciliary-tracer': 'unconventional', 'venous-rise': 'conventional-pressure' }),
];
