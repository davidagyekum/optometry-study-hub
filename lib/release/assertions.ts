import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import hosting from '@/.openai/hosting.json';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousPilotBank } from '@/content/question-bank/opt376/aqueous-vitreous/pilotSubset';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { QUESTION_FORMATS, REVIEW_STATUSES } from '@/lib/assessment/constants';
import { AQUEOUS_PILOT_QUESTION_IDS } from '@/lib/assessment/pilot/blueprint';
import { questionsFor } from '@/lib/legacy/questionGenerator';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '@/lib/storage/keys';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { ReleaseAssertion } from '@/lib/release/types';

export const EXPECTED_HVP_CHECKSUM =
  '029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a';

export const EXPECTED_AQUEOUS_PILOT_HASHES: Record<string, string> = {
  'aqueous-flow-sba-001': 'fd062b040d1f52b25797007ba5e0c2abbbacb98d4c8903c0c988ea566fd8b0f4',
  'aqueous-production-mr-001': '778fe8252688ff8e131932b2c6e16c56552688ae08ddea12f74863e50ff42658',
  'aqueous-flow-ordering-001': '035f80ce118906ec2ef28891dd3145cbfef06e8c9d8f21ce7f5e89d8ee02d99c',
  'aqueous-flow-matching-001': '979a6dd62d8ae914616a3ae791342bbde5e9f8df706b2edaa9c2b6ec9d3760de',
  'aqueous-iop-extended-matching-001': '0bd008ecef504adbdf2c386ffcc53acfa05302bfc49ba6833f4d99257c74360c',
  'aqueous-flow-hotspot-001': '5630fd5c07ef3cc6aee2600b0002b15636642cb33789a8e217053b3ac03bccc8',
  'aqueous-chambers-label-001': '9e3ad1d763c431322ab537273c8b5f716ca6c4d8e879c28f4ee5cd36f951f6b1',
  'aqueous-iop-short-answer-001': '710510d2a2473130ddbcc8b9248e42a6ae92237f232d9564ce390747cbbdfff3',
  'vitreous-clinical-open-response-001':
    '17b6154fc7775e4385a9b3508fa94d37840f59b3e2bfdc9ba573c3b14bccabe6',
};

function assertion(id: string, passed: boolean, detail: string): ReleaseAssertion {
  return { id, passed, detail };
}

export function reviewStatusCounts(
  values: Array<{ reviewStatus: string }>,
): Record<(typeof REVIEW_STATUSES)[number], number> {
  return Object.fromEntries(REVIEW_STATUSES.map((status) => [
    status,
    values.filter((value) => value.reviewStatus === status).length,
  ])) as Record<(typeof REVIEW_STATUSES)[number], number>;
}

export function hvpChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/opt374/human-visual-perception/bank.json',
    ))
    .digest('hex');
}

export function trackedEnabledReleaseEnvironmentFiles(): string[] {
  const files = execFileSync('git', ['ls-files', '--', '.env*', '*.env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).split(/\r?\n/).filter(Boolean);
  return files.filter((file) => /NEXT_PUBLIC_ENABLE_(?:ASSESSMENT_PILOT|HVP_CURATED_PRACTICE)=true/.test(
    readFileSync(file, 'utf8'),
  ));
}

export function aqueousPilotHashes(): Record<string, string> {
  return Object.fromEntries(aqueousVitreousPilotBank.questions.map((question) => [
    question.id,
    createHash('sha256').update(JSON.stringify(question)).digest('hex'),
  ]));
}

export function collectReleaseAssertions(): ReleaseAssertion[] {
  const sectionCount = modules.reduce((total, module) => total + module.sections.length, 0);
  const legacyQuestionCount = modules.reduce(
    (total, module) => total + questionsFor(module).length,
    0,
  );
  const hvpSvgCount = new Set(humanVisualPerceptionCandidateBank.questions.flatMap(
    (question) => ('image' in question && question.image.src.endsWith('.svg')
      ? [question.image.src]
      : []),
  )).size;
  const envExample = readFileSync('.env.example', 'utf8');
  const pilotHashes = aqueousPilotHashes();

  return [
    assertion('courses', courses.length === 5, `${courses.length} courses`),
    assertion('modules', modules.length === 8, `${modules.length} modules`),
    assertion('study-sections', sectionCount === 39, `${sectionCount} study sections`),
    assertion(
      'legacy-questions',
      legacyQuestionCount === 400
        && modules.every((module) => questionsFor(module).length === 50),
      `${legacyQuestionCount} total; ${modules.map((module) => questionsFor(module).length).join(', ')} by module`,
    ),
    assertion(
      'aqueous-content',
      aqueousVitreousCandidateBank.questions.length === 36
        && aqueousVitreousCandidateBank.objectives.length === 13,
      `${aqueousVitreousCandidateBank.questions.length} questions; ${aqueousVitreousCandidateBank.objectives.length} objectives`,
    ),
    assertion(
      'aqueous-pilot',
      JSON.stringify(aqueousVitreousPilotBank.questions.map((question) => question.id))
        === JSON.stringify(AQUEOUS_PILOT_QUESTION_IDS)
        && JSON.stringify(pilotHashes) === JSON.stringify(EXPECTED_AQUEOUS_PILOT_HASHES),
      'Nine ordered pilot questions retain their reviewed semantic identities.',
    ),
    assertion(
      'hvp-content',
      humanVisualPerceptionCandidateBank.questions.length === 120
        && humanVisualPerceptionCandidateBank.objectives.length === 23
        && humanVisualPerceptionCandidateBank.sources.length === 19,
      `${humanVisualPerceptionCandidateBank.questions.length} questions; ${humanVisualPerceptionCandidateBank.objectives.length} objectives; ${humanVisualPerceptionCandidateBank.sources.length} sources`,
    ),
    assertion('hvp-svg-assets', hvpSvgCount === 6, `${hvpSvgCount} unique SVG diagrams`),
    assertion(
      'assessment-formats',
      QUESTION_FORMATS.length === 10,
      `${QUESTION_FORMATS.length} supported formats`,
    ),
    assertion(
      'hvp-checksum',
      hvpChecksum() === EXPECTED_HVP_CHECKSUM,
      `SHA-256 ${hvpChecksum()}`,
    ),
    assertion(
      'draft-status',
      aqueousVitreousCandidateBank.questions.every((question) => question.reviewStatus === 'draft')
        && aqueousVitreousCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')
        && humanVisualPerceptionCandidateBank.questions.every((question) => question.reviewStatus === 'draft')
        && humanVisualPerceptionCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft'),
      'All Aqueous and HVP questions and objectives remain draft.',
    ),
    assertion(
      'storage-identity',
      STORAGE_KEY === 'optometry-study-hub:v2'
        && LEGACY_STORAGE_KEY === 'opt376-study-state:v1',
      `StoreV2 ${STORAGE_KEY}; rollback ${LEGACY_STORAGE_KEY}`,
    ),
    assertion(
      'storage-schema-version',
      createEmptyStoreV2().version === 2,
      `Store schema version ${createEmptyStoreV2().version}`,
    ),
    assertion(
      'hosting-bindings',
      hosting.project_id === 'appgprj_6a5614a4d1288191966f6f3570f99f22'
        && hosting.d1 === null
        && hosting.r2 === null,
      `Sites project ${hosting.project_id}; D1 disabled; R2 disabled`,
    ),
    assertion(
      'tracked-release-environments',
      trackedEnabledReleaseEnvironmentFiles().length === 0,
      trackedEnabledReleaseEnvironmentFiles().length
        ? `Tracked production enablement: ${trackedEnabledReleaseEnvironmentFiles().join(', ')}`
        : 'No tracked environment file enables a controlled assessment.',
    ),
    assertion(
      'committed-feature-defaults',
      envExample.includes('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false')
        && envExample.includes('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false')
        && !envExample.includes('=true'),
      'Both committed feature defaults are false.',
    ),
  ];
}

export function assertReleaseAssertions(
  assertions: ReleaseAssertion[] = collectReleaseAssertions(),
): ReleaseAssertion[] {
  const failed = assertions.filter((item) => !item.passed);
  if (failed.length) {
    throw new Error(
      `Release assertions failed:\n${failed.map((item) => `- ${item.id}: ${item.detail}`).join('\n')}`,
    );
  }
  return assertions;
}
