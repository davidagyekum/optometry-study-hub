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
      ...tissueMarkers().authored,
      ...tissueMarkers().answers,
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
      ...hvpMarkers().authored,
      ...hvpMarkers().answers,
    ],
    enabledInProfile: (profile: ReleaseProfileId) => (
      profile === 'tissue-foundations-preview'
      || profile === 'hvp-tissue-preview'
    ),
  }),
]);
