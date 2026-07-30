import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import hosting from '@/.openai/hosting.json';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousPilotBank } from '@/content/question-bank/opt376/aqueous-vitreous/pilotSubset';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import { QUESTION_FORMATS, REVIEW_STATUSES } from '@/lib/assessment/constants';
import { AQUEOUS_PILOT_QUESTION_IDS } from '@/lib/assessment/pilot/blueprint';
import { questionsFor } from '@/lib/legacy/questionGenerator';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '@/lib/storage/keys';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { ReleaseAssertion } from '@/lib/release/types';

export const EXPECTED_HVP_CHECKSUM =
  '029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a';

export const EXPECTED_TISSUE_CHECKSUM =
  '500454bab37a5846ed46efd442149c105cbaf6ea5c9dd270ba3605170a2d9c08';

export const EXPECTED_OCULAR_ADNEXA_CHECKSUM =
  'fe96d664bdad67b40a4711332612e59e26a2b5a2c3844aae279dc71f662ecb9f';

export const EXPECTED_AQUEOUS_VITREOUS_CHECKSUM =
  '97c1bc76cbae20681b1c4494bb7d35d282420f8c03a9181927720e024ae9dccb';

export const EXPECTED_BLOOD_SUPPLY_CHECKSUM =
  '1ce2628c3c74ac124b7034d7c34efba63a10dc4d6dcaab079e5eed73a01ccf8d';

export const EXPECTED_ENVIRONMENTAL_VISION_CHECKSUM =
  'cd453b8dd2f691db44bc93eb550f290d0c7213e44f16dc1913e5d75559b99385';

export const EXPECTED_AUTONOMIC_PHARMACOLOGY_CHECKSUM =
  '7f8c0d7915bccd3c3ffcf2ac96bc44758366928198ec55e68ee5e5c55d43e143';

export const EXPECTED_SYSTEMIC_PATHOLOGY_CHECKSUM =
  '06ed91a7323147e8eb9ce1fe6d4813209d986d0b4e4664d55136a012d544b379';

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

export function tissueChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/opt376/tissue-foundations/bank.json',
    ))
    .digest('hex');
}

export function ocularAdnexaChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/opt376/ocular-adnexa/bank.json',
    ))
    .digest('hex');
}

export function bloodSupplyChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/opt376/blood-supply/bank.json',
    ))
    .digest('hex');
}

export function environmentalVisionChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/opt508/environmental-vision/bank.json',
    ))
    .digest('hex');
}

export function autonomicPharmacologyChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/pharmacology/autonomic-pharmacology/bank.json',
    ))
    .digest('hex');
}

export function systemicPathologyChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/systemic-pathology/systemic-pathology/bank.json',
    ))
    .digest('hex');
}

export function aqueousVitreousChecksum(): string {
  return createHash('sha256')
    .update(readFileSync(
      'content/question-bank/opt376/aqueous-vitreous/bank.json',
    ))
    .digest('hex');
}

export function trackedEnabledReleaseEnvironmentFiles(): string[] {
  const files = execFileSync('git', ['ls-files', '--', '.env*', '*.env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).split(/\r?\n/).filter(Boolean);
  return files.filter((file) => /NEXT_PUBLIC_ENABLE_(?:ASSESSMENT_PILOT|HVP_CURATED_PRACTICE|TISSUE_FOUNDATIONS_CURATED_PRACTICE|OCULAR_ADNEXA_CURATED_PRACTICE|AQUEOUS_VITREOUS_CURATED_PRACTICE|BLOOD_SUPPLY_CURATED_PRACTICE|ENVIRONMENTAL_VISION_CURATED_PRACTICE|AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE|SYSTEMIC_PATHOLOGY_CURATED_PRACTICE)=true/.test(
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
  const curatedQuestionCount = [
    aqueousVitreousCandidateBank,
    humanVisualPerceptionCandidateBank,
    tissueFoundationsCandidateBank,
    ocularAdnexaCandidateBank,
    bloodSupplyCandidateBank,
    environmentalVisionCandidateBank,
    autonomicPharmacologyCandidateBank,
    systemicPathologyCandidateBank,
  ].reduce((total, bank) => total + bank.questions.length, 0);
  const hvpSvgCount = new Set(humanVisualPerceptionCandidateBank.questions.flatMap(
    (question) => ('image' in question && question.image.src.endsWith('.svg')
      ? [question.image.src]
      : []),
  )).size;
  const tissueSvgCount = new Set(tissueFoundationsCandidateBank.questions.flatMap(
    (question) => ('image' in question && question.image.src.endsWith('.svg')
      ? [question.image.src]
      : []),
  )).size;
  const ocularAdnexaSvgCount = new Set(ocularAdnexaCandidateBank.questions.flatMap(
    (question) => ('image' in question && question.image.src.endsWith('.svg')
      ? [question.image.src]
      : []),
  )).size;
  const aqueousVitreousSvgCount = new Set(aqueousVitreousCandidateBank.questions.flatMap(
    (question) => ('image' in question && question.image.src.endsWith('.svg')
      ? [question.image.src]
      : []),
  )).size;
  const bloodSupplySvgCount = new Set(bloodSupplyCandidateBank.questions.flatMap(
    (question) => ('image' in question && question.image.src.endsWith('.svg')
      ? [question.image.src]
      : []),
  )).size;
  const environmentalVisionSvgCount = new Set(
    environmentalVisionCandidateBank.questions.flatMap(
      (question) => ('image' in question && question.image.src.endsWith('.svg')
        ? [question.image.src]
        : []),
    ),
  ).size;
  const autonomicPharmacologySvgCount = new Set(
    autonomicPharmacologyCandidateBank.questions.flatMap(
      (question) => ('image' in question && question.image.src.endsWith('.svg')
        ? [question.image.src]
        : []),
    ),
  ).size;
  const systemicPathologySvgCount = new Set(
    systemicPathologyCandidateBank.questions.flatMap(
      (question) => ('image' in question && question.image.src.endsWith('.svg')
        ? [question.image.src]
        : []),
    ),
  ).size;
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
    assertion('curated-questions', curatedQuestionCount === 680, String(curatedQuestionCount) + ' curated questions across eight modules'),
    assertion(
      'aqueous-content',
      aqueousVitreousCandidateBank.questions.length === 80
        && aqueousVitreousCandidateBank.objectives.length === 13
        && aqueousVitreousCandidateBank.sources.length === 8,
      `${aqueousVitreousCandidateBank.questions.length} questions; ${aqueousVitreousCandidateBank.objectives.length} objectives; ${aqueousVitreousCandidateBank.sources.length} sources`,
    ),
    assertion(
      'aqueous-svg-assets',
      aqueousVitreousSvgCount === 4,
      `${aqueousVitreousSvgCount} unique SVG diagrams`,
    ),
    assertion(
      'aqueous-checksum',
      aqueousVitreousChecksum() === EXPECTED_AQUEOUS_VITREOUS_CHECKSUM,
      `SHA-256 ${aqueousVitreousChecksum()}`,
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
      'tissue-content',
      tissueFoundationsCandidateBank.questions.length === 80
        && tissueFoundationsCandidateBank.objectives.length === 18
        && tissueFoundationsCandidateBank.sources.length === 10,
      `${tissueFoundationsCandidateBank.questions.length} questions; ${tissueFoundationsCandidateBank.objectives.length} objectives; ${tissueFoundationsCandidateBank.sources.length} sources`,
    ),
    assertion(
      'tissue-svg-assets',
      tissueSvgCount === 4,
      `${tissueSvgCount} unique SVG diagrams`,
    ),
    assertion(
      'ocular-adnexa-content',
      ocularAdnexaCandidateBank.questions.length === 80
        && ocularAdnexaCandidateBank.objectives.length === 18
        && ocularAdnexaCandidateBank.sources.length === 8,
      `${ocularAdnexaCandidateBank.questions.length} questions; ${ocularAdnexaCandidateBank.objectives.length} objectives; ${ocularAdnexaCandidateBank.sources.length} sources`,
    ),
    assertion(
      'ocular-adnexa-svg-assets',
      ocularAdnexaSvgCount === 5,
      `${ocularAdnexaSvgCount} unique SVG diagrams`,
    ),
    assertion(
      'ocular-adnexa-checksum',
      ocularAdnexaChecksum() === EXPECTED_OCULAR_ADNEXA_CHECKSUM,
      `SHA-256 ${ocularAdnexaChecksum()}`,
    ),
    assertion(
      'blood-supply-content',
      bloodSupplyCandidateBank.questions.length === 80
        && bloodSupplyCandidateBank.objectives.length === 18
        && bloodSupplyCandidateBank.sources.length === 8,
      `${bloodSupplyCandidateBank.questions.length} questions; ${bloodSupplyCandidateBank.objectives.length} objectives; ${bloodSupplyCandidateBank.sources.length} sources`,
    ),
    assertion(
      'blood-supply-svg-assets',
      bloodSupplySvgCount === 5,
      `${bloodSupplySvgCount} unique SVG diagrams`,
    ),
    assertion(
      'blood-supply-checksum',
      bloodSupplyChecksum() === EXPECTED_BLOOD_SUPPLY_CHECKSUM,
      `SHA-256 ${bloodSupplyChecksum()}`,
    ),
    assertion(
      'environmental-vision-content',
      environmentalVisionCandidateBank.questions.length === 80
        && environmentalVisionCandidateBank.objectives.length === 18
        && environmentalVisionCandidateBank.sources.length === 21,
      `${environmentalVisionCandidateBank.questions.length} questions; ${environmentalVisionCandidateBank.objectives.length} objectives; ${environmentalVisionCandidateBank.sources.length} sources`,
    ),
    assertion(
      'environmental-vision-svg-assets',
      environmentalVisionSvgCount === 5,
      `${environmentalVisionSvgCount} unique SVG diagrams`,
    ),
    assertion(
      'environmental-vision-checksum',
      environmentalVisionChecksum() === EXPECTED_ENVIRONMENTAL_VISION_CHECKSUM,
      `SHA-256 ${environmentalVisionChecksum()}`,
    ),
    assertion(
      'autonomic-pharmacology-content',
      autonomicPharmacologyCandidateBank.questions.length === 80
        && autonomicPharmacologyCandidateBank.objectives.length === 20
        && autonomicPharmacologyCandidateBank.sources.length === 18,
      `${autonomicPharmacologyCandidateBank.questions.length} questions; ${autonomicPharmacologyCandidateBank.objectives.length} objectives; ${autonomicPharmacologyCandidateBank.sources.length} sources`,
    ),
    assertion(
      'autonomic-pharmacology-svg-assets',
      autonomicPharmacologySvgCount === 5,
      `${autonomicPharmacologySvgCount} unique SVG diagrams`,
    ),
    assertion(
      'autonomic-pharmacology-checksum',
      autonomicPharmacologyChecksum() === EXPECTED_AUTONOMIC_PHARMACOLOGY_CHECKSUM,
      `SHA-256 ${autonomicPharmacologyChecksum()}`,
    ),
    assertion(
      'systemic-pathology-content',
      systemicPathologyCandidateBank.questions.length === 80
        && systemicPathologyCandidateBank.objectives.length === 20
        && systemicPathologyCandidateBank.sources.length === 19,
      `${systemicPathologyCandidateBank.questions.length} questions; ${systemicPathologyCandidateBank.objectives.length} objectives; ${systemicPathologyCandidateBank.sources.length} sources`,
    ),
    assertion(
      'systemic-pathology-svg-assets',
      systemicPathologySvgCount === 5,
      `${systemicPathologySvgCount} unique SVG diagrams`,
    ),
    assertion(
      'systemic-pathology-checksum',
      systemicPathologyChecksum() === EXPECTED_SYSTEMIC_PATHOLOGY_CHECKSUM,
      `SHA-256 ${systemicPathologyChecksum()}`,
    ),
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
      'tissue-checksum',
      tissueChecksum() === EXPECTED_TISSUE_CHECKSUM,
      `SHA-256 ${tissueChecksum()}`,
    ),
    assertion(
      'draft-status',
      aqueousVitreousCandidateBank.questions.every((question) => question.reviewStatus === 'draft')
        && aqueousVitreousCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')
        && humanVisualPerceptionCandidateBank.questions.every((question) => question.reviewStatus === 'draft')
        && humanVisualPerceptionCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')
        && tissueFoundationsCandidateBank.questions.every((question) => question.reviewStatus === 'draft')
        && tissueFoundationsCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')
        && ocularAdnexaCandidateBank.questions.every((question) => question.reviewStatus === 'draft')
        && ocularAdnexaCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')
        && bloodSupplyCandidateBank.questions.every((question) => question.reviewStatus === 'draft')
        && bloodSupplyCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')
        && environmentalVisionCandidateBank.questions.every(
          (question) => question.reviewStatus === 'draft',
        )
        && environmentalVisionCandidateBank.objectives.every(
          (objective) => objective.reviewStatus === 'draft',
        )
        && autonomicPharmacologyCandidateBank.questions.every(
          (question) => question.reviewStatus === 'draft',
        )
        && autonomicPharmacologyCandidateBank.objectives.every(
          (objective) => objective.reviewStatus === 'draft',
        )
        && systemicPathologyCandidateBank.questions.every(
          (question) => question.reviewStatus === 'draft',
        )
        && systemicPathologyCandidateBank.objectives.every(
          (objective) => objective.reviewStatus === 'draft',
        ),
      'All curated questions and objectives remain draft.',
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
        && envExample.includes(
          'NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE=false',
        )
        && envExample.includes(
          'NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE=false',
        )
        && envExample.includes(
          'NEXT_PUBLIC_ENABLE_AQUEOUS_VITREOUS_CURATED_PRACTICE=false',
        )
        && envExample.includes(
          'NEXT_PUBLIC_ENABLE_BLOOD_SUPPLY_CURATED_PRACTICE=false',
        )
        && envExample.includes(
          'NEXT_PUBLIC_ENABLE_ENVIRONMENTAL_VISION_CURATED_PRACTICE=false',
        )
        && envExample.includes(
          'NEXT_PUBLIC_ENABLE_AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE=false',
        )
        && envExample.includes(
          'NEXT_PUBLIC_ENABLE_SYSTEMIC_PATHOLOGY_CURATED_PRACTICE=false',
        )
        && !envExample.includes('=true'),
      'All committed feature defaults are false.',
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
