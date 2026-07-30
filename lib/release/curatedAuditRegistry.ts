import { readFileSync } from 'node:fs';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import type { ReleaseProfileId } from '@/lib/release/types';

type BankQuestion = {
  id: string;
  sectionId: string;
  format: string;
  stem: string;
  explanation: string;
  correctOptionId?: string;
  correctOptionIds?: string[];
  correctOrder?: string[];
  correctRegionIds?: string[];
  correctMatches?: Record<string, string>;
  correctAnswers?: Record<string, string>;
  correctLabels?: Record<string, string>;
};

export type CuratedReleaseAuditDefinition = {
  experienceId: string;
  practiceEntry: string;
  progressEntry: string;
  authoredContentMarkers: () => string[];
  answerIdentityMarkers: () => string[];
  practiceUiMarkers: readonly string[];
  progressUiMarkers: readonly string[];
  allowedCrossBankMarkers: () => string[];
  excludedCrossBankMarkers: () => string[];
  enabledInProfile: (profile: ReleaseProfileId) => boolean;
};

function hvpMarkers() {
  const bank = JSON.parse(readFileSync(
    'content/question-bank/opt374/human-visual-perception/bank.json',
    'utf8',
  )) as { questions: BankQuestion[] };
  const sections = ['hvp-foundations', 'hvp-retina', 'hvp-lgn', 'hvp-extrastriate'];
  const authored = sections.flatMap((sectionId) => {
    const question = bank.questions.find((candidate) => (
      candidate.sectionId === sectionId && candidate.stem.length > 35
    ));
    if (!question) throw new Error(`HVP marker question is missing for ${sectionId}.`);
    return [question.stem, question.explanation];
  });
  const formats = [
    'single_best_answer',
    'multiple_response',
    'matching',
    'ordering',
    'image_hotspot',
    'image_label',
  ];
  const answers = formats.flatMap((format) => {
    const question = bank.questions.find((candidate) => candidate.format === format);
    if (!question) throw new Error(`HVP answer marker question is missing for ${format}.`);
    return [
      ...(question.correctOptionId ? [question.correctOptionId] : []),
      ...(question.correctOptionIds ?? []),
      ...(question.correctOrder ?? []),
      ...(question.correctRegionIds ?? []),
      ...Object.values(question.correctMatches ?? {}),
      ...Object.values(question.correctAnswers ?? {}),
      ...Object.values(question.correctLabels ?? {}),
    ];
  }).filter((value, index, values) => value.length > 5 && values.indexOf(value) === index)
    .slice(0, 12);
  return { authored, answers };
}

function tissueMarkers() {
  const bank = JSON.parse(readFileSync(
    'content/question-bank/opt376/tissue-foundations/bank.json',
    'utf8',
  )) as { questions: BankQuestion[] };
  const sections = [
    'tissue-nervous',
    'tissue-epithelium',
    'tissue-connective',
  ];
  const authored = sections.flatMap((sectionId) => {
    const question = bank.questions.find((candidate) => (
      candidate.sectionId === sectionId && candidate.stem.length > 35
    ));
    if (!question) {
      throw new Error(`Tissue marker question is missing for ${sectionId}.`);
    }
    return [question.stem, question.explanation];
  });
  const formats = [
    'single_best_answer',
    'multiple_response',
    'matching',
    'extended_matching',
    'ordering',
    'image_hotspot',
    'image_label',
  ];
  const answers = formats.flatMap((format) => {
    const question = bank.questions.find(
      (candidate) => candidate.format === format,
    );
    if (!question) {
      throw new Error(`Tissue answer marker question is missing for ${format}.`);
    }
    return [
      ...(question.correctOptionId ? [question.correctOptionId] : []),
      ...(question.correctOptionIds ?? []),
      ...(question.correctOrder ?? []),
      ...(question.correctRegionIds ?? []),
      ...Object.values(question.correctMatches ?? {}),
      ...Object.values(question.correctAnswers ?? {}),
      ...Object.values(question.correctLabels ?? {}),
    ];
  }).filter(
    (value, index, values) => value.length > 5 && values.indexOf(value) === index,
  ).slice(0, 12);
  return { authored, answers };
}

function moduleMarkers(
  path: string,
  sectionIds: readonly string[],
  label: string,
) {
  const bank = JSON.parse(readFileSync(path, 'utf8')) as {
    questions: BankQuestion[];
  };
  const authored = sectionIds.flatMap((sectionId) => {
    const question = bank.questions.find((candidate) => (
      candidate.sectionId === sectionId && candidate.stem.length > 35
    ));
    if (!question) {
      throw new Error(`${label} marker question is missing for ${sectionId}.`);
    }
    return [question.stem, question.explanation];
  });
  const answerIds = bank.questions.flatMap((question) => [
    ...(question.correctOptionId ? [question.correctOptionId] : []),
    ...(question.correctOptionIds ?? []),
    ...(question.correctOrder ?? []),
    ...(question.correctRegionIds ?? []),
    ...Object.values(question.correctMatches ?? {}),
    ...Object.values(question.correctAnswers ?? {}),
    ...Object.values(question.correctLabels ?? {}),
  ]).filter(
    (value, index, values) => (
      value.length >= 18
      && !/^(?:option|choice|item|region|label|target|prompt|stem)-/.test(value)
      && values.indexOf(value) === index
    ),
  );
  // Some imported banks intentionally use generic answer IDs. Stable question IDs
  // are collision-resistant fallback markers for those banks; authored markers still
  // prove that the full question content is present only in the lazy closure.
  const answers = [
    ...answerIds,
    ...bank.questions.map((question) => question.id),
  ].filter((value, index, values) => values.indexOf(value) === index).slice(0, 12);
  if (answers.length < 12) {
    throw new Error(`${label} requires 12 collision-resistant answer markers.`);
  }
  return { authored, answers };
}

function ocularAdnexaMarkers() {
  return moduleMarkers(
    'content/question-bank/opt376/ocular-adnexa/bank.json',
    [
      'landmarks',
      'muscles',
      'tarsus-glands',
      'lower-lid-blood',
      'lacrimal-gland',
      'tears',
    ],
    'Ocular Adnexa',
  );
}

function bloodSupplyMarkers() {
  return moduleMarkers(
    'content/question-bank/opt376/blood-supply/bank.json',
    [
      'arterial-origins',
      'ciliary',
      'retinal',
      'barriers',
      'microcirculation',
      'clinical-blood',
    ],
    'Blood Supply',
  );
}

function aqueousCuratedMarkers() {
  return moduleMarkers(
    'content/question-bank/opt376/aqueous-vitreous/bank.json',
    [
      'media-chambers',
      'production',
      'flow',
      'iop',
      'vitreous-anatomy',
      'vitreous-clinical',
    ],
    'Aqueous and Vitreous',
  );
}
function aqueousMarkers(): string[] {
  return aqueousVitreousCandidateBank.questions.slice(0, 3).flatMap(
    (question) => [question.stem, question.explanation],
  );
}

export const curatedReleaseAuditRegistry: readonly CuratedReleaseAuditDefinition[] = Object.freeze([
  Object.freeze({
    experienceId: 'human-visual-perception',
    practiceEntry: 'components/assessment/hvp/HvpPracticeRouter.tsx',
    progressEntry: 'components/progress/HvpProgressPanel.tsx',
    authoredContentMarkers: () => hvpMarkers().authored,
    answerIdentityMarkers: () => hvpMarkers().answers,
    practiceUiMarkers: ['Curated slide-aligned practice', 'Quick practice'],
    progressUiMarkers: ['Current-version mastery', 'Written practice'],
    allowedCrossBankMarkers: () => [],
    excludedCrossBankMarkers: () => [
      ...aqueousMarkers(),
      ...aqueousCuratedMarkers().authored,
      ...aqueousCuratedMarkers().answers,
      ...ocularAdnexaMarkers().authored,
      ...ocularAdnexaMarkers().answers,
      ...tissueMarkers().authored,
      ...tissueMarkers().answers,
      ...bloodSupplyMarkers().authored,
      ...bloodSupplyMarkers().answers,
    ],
    enabledInProfile: (profile: ReleaseProfileId) => (
      profile === 'hvp-public-beta' || profile === 'hvp-tissue-preview'
    ),
  }),
  Object.freeze({
    experienceId: 'opt376-tissue-foundations-curated-v1',
    practiceEntry: 'lib/assessment/tissue-foundations/definition.tsx',
    progressEntry: 'lib/progress/tissueFoundationsProgressModule.tsx',
    authoredContentMarkers: () => tissueMarkers().authored,
    answerIdentityMarkers: () => tissueMarkers().answers,
    practiceUiMarkers: [
      'Curated slide-aligned practice',
      'Quick practice',
    ],
    progressUiMarkers: ['Current-version mastery', 'Written practice'],
    allowedCrossBankMarkers: () => [],
    excludedCrossBankMarkers: () => [
      ...aqueousMarkers(),
      ...aqueousCuratedMarkers().authored,
      ...aqueousCuratedMarkers().answers,
      ...ocularAdnexaMarkers().authored,
      ...ocularAdnexaMarkers().answers,
      ...hvpMarkers().authored,
      ...hvpMarkers().answers,
      ...bloodSupplyMarkers().authored,
      ...bloodSupplyMarkers().answers,
    ],
    enabledInProfile: (profile: ReleaseProfileId) => (
      profile === 'tissue-foundations-preview'
      || profile === 'hvp-tissue-preview'
    ),
  }),
  Object.freeze({
    experienceId: 'ocular-adnexa',
    practiceEntry: 'lib/assessment/ocular-adnexa/definition.tsx',
    progressEntry: 'lib/progress/ocularAdnexaProgressModule.tsx',
    authoredContentMarkers: () => ocularAdnexaMarkers().authored,
    answerIdentityMarkers: () => ocularAdnexaMarkers().answers,
    practiceUiMarkers: ['Curated slide-aligned practice', 'Quick practice'],
    progressUiMarkers: ['Current-version mastery', 'Written practice'],
    allowedCrossBankMarkers: () => [],
    excludedCrossBankMarkers: () => [
      ...aqueousMarkers(),
      ...aqueousCuratedMarkers().authored,
      ...aqueousCuratedMarkers().answers,
      ...hvpMarkers().authored,
      ...hvpMarkers().answers,
      ...tissueMarkers().authored,
      ...tissueMarkers().answers,
      ...bloodSupplyMarkers().authored,
      ...bloodSupplyMarkers().answers,
    ],
    enabledInProfile: () => false,
  }),
  Object.freeze({
    experienceId: 'aqueous-vitreous-curated',
    practiceEntry: 'lib/assessment/aqueous-vitreous-curated/definition.tsx',
    progressEntry: 'lib/progress/aqueousVitreousCuratedProgressModule.tsx',
    authoredContentMarkers: () => aqueousCuratedMarkers().authored,
    answerIdentityMarkers: () => aqueousCuratedMarkers().answers,
    practiceUiMarkers: ['Curated slide-aligned practice', 'Quick practice'],
    progressUiMarkers: ['Current-version mastery', 'Written practice'],
    allowedCrossBankMarkers: () => [],
    excludedCrossBankMarkers: () => [
      ...hvpMarkers().authored,
      ...hvpMarkers().answers,
      ...tissueMarkers().authored,
      ...tissueMarkers().answers,
      ...ocularAdnexaMarkers().authored,
      ...ocularAdnexaMarkers().answers,
      ...bloodSupplyMarkers().authored,
      ...bloodSupplyMarkers().answers,
    ],
    enabledInProfile: () => false,
  }),
  Object.freeze({
    experienceId: 'blood-supply',
    practiceEntry: 'lib/assessment/blood-supply/definition.tsx',
    progressEntry: 'lib/progress/bloodSupplyProgressModule.tsx',
    authoredContentMarkers: () => bloodSupplyMarkers().authored,
    answerIdentityMarkers: () => bloodSupplyMarkers().answers,
    practiceUiMarkers: ['Curated slide-aligned practice', 'Quick practice'],
    progressUiMarkers: ['Current-version mastery', 'Written practice'],
    allowedCrossBankMarkers: () => [],
    excludedCrossBankMarkers: () => [
      ...aqueousMarkers(),
      ...aqueousCuratedMarkers().authored,
      ...aqueousCuratedMarkers().answers,
      ...hvpMarkers().authored,
      ...hvpMarkers().answers,
      ...tissueMarkers().authored,
      ...tissueMarkers().answers,
      ...ocularAdnexaMarkers().authored,
      ...ocularAdnexaMarkers().answers,
    ],
    enabledInProfile: () => false,
  }),
]);
