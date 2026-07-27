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
  extended({ id: 'aqueous-flow-extended-001', familyId: 'aqueous-outflow-pathway-comparison', sectionId: 'flow', objectiveId: 'aqueous-trace-conventional-outflow', stimulusType: 'table', bloomLevel: 'analyze', difficulty: 'advanced', stem: 'Use the pathway table to assign the mutually exclusive route or downstream constraint best described by each observation.', explanation: 'The conventional and unconventional routes are distinct anatomical pathways. Raised episcleral venous pressure is classified separately as a downstream constraint on conventional outflow, not as a second name for the conventional route.', sources, misconceptionTags: ['outflow-split-invariant'], table: { caption: 'Contrasting aqueous outflow observations', columns: [{ id: 'observation', heading: 'Observation' }, { id: 'route-clue', heading: 'Route or constraint clue' }], rows: [{ id: 'row-a', cells: { observation: 'Tracer enters Schlemm canal', 'route-clue': 'Anatomical outflow route through the angle' } }, { id: 'row-b', cells: { observation: 'Tracer passes between ciliary muscle bundles', 'route-clue': 'Anatomical outflow route toward the suprachoroidal space' } }, { id: 'row-c', cells: { observation: 'Episcleral venous pressure rises', 'route-clue': 'Downstream pressure changes without defining a new anatomical route' } }] } }, [
    ['schlemm-tracer', 'Tracer is seen within Schlemm canal'],
    ['ciliary-tracer', 'Tracer passes between ciliary muscle bundles toward the suprachoroidal space'],
    ['venous-rise', 'Raised episcleral venous pressure impedes downstream drainage'],
  ], [
    ['conventional-route', 'Conventional trabecular outflow route', 'This anatomical route includes trabecular meshwork and Schlemm canal.'],
    ['unconventional-route', 'Unconventional uveoscleral outflow route', 'This anatomical route passes through ciliary muscle toward suprachoroidal tissues.'],
    ['venous-constraint', 'Downstream episcleral venous-pressure constraint', 'This pressure opposes conventional drainage but is not itself another anatomical route.'],
    ['vitreous-route', 'Vitreous-to-retinal fluid route', 'This is not an aqueous outflow route or downstream outflow constraint.', 'aqueous-vitreous-confusion'],
  ], { 'schlemm-tracer': 'conventional-route', 'ciliary-tracer': 'unconventional-route', 'venous-rise': 'venous-constraint' }, false),
];
