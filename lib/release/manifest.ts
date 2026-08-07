import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import hosting from '@/.openai/hosting.json';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import {
  assertReleaseAssertions,
  EXPECTED_HVP_CHECKSUM,
  EXPECTED_TISSUE_CHECKSUM,
  EXPECTED_OCULAR_ADNEXA_CHECKSUM,
  EXPECTED_AQUEOUS_VITREOUS_CHECKSUM,
  EXPECTED_BLOOD_SUPPLY_CHECKSUM,
  EXPECTED_ENVIRONMENTAL_VISION_CHECKSUM,
  EXPECTED_AUTONOMIC_PHARMACOLOGY_CHECKSUM,
  EXPECTED_SYSTEMIC_PATHOLOGY_CHECKSUM,
  EXPECTED_OPT370_CHECKSUMS,
  OPT370_BANKS,
  reviewStatusCounts,
} from '@/lib/release/assertions';
import type { BundleAuditResult } from '@/lib/release/bundleAudit';
import {
  assertCleanReleaseTree,
  releaseGitIdentity,
  type ReleaseGitIdentity,
} from '@/lib/release/buildIdentity';
import { RELEASE_PROFILES } from '@/lib/release/profile';
import {
  releaseManifestSchema,
  type ReleaseManifest,
  type ReleaseProfileId,
} from '@/lib/release/types';

export {
  assertCleanReleaseTree,
  releaseGitIdentity,
} from '@/lib/release/buildIdentity';

export const RELEASE_PUBLIC_ROUTES = [
  '/',
  '/practice',
  '/progress',
  '/progress/:moduleId',
  '/course/:courseId',
  '/study/:moduleId',
  '/quiz/:moduleId',
  '/results/:moduleId',
] as const;

export const RELEASE_CONTROLLED_ROUTES = [
  '/practice/:experienceId',
  '/assessment/:attemptId',
  '/assessment-result/:resultId',
  '/pilot/aqueous-vitreous',
] as const;

export type CreateReleaseManifestOptions = {
  profile: ReleaseProfileId;
  audit: BundleAuditResult;
  git?: ReleaseGitIdentity;
};

function sameFlags(
  left: {
    assessmentPilot: boolean;
    hvpCuratedPractice: boolean;
    tissueFoundationsCuratedPractice: boolean;
    ocularAdnexaCuratedPractice: boolean;
    aqueousVitreousCuratedPractice: boolean;
    bloodSupplyCuratedPractice: boolean;
    environmentalVisionCuratedPractice: boolean;
    autonomicPharmacologyCuratedPractice: boolean;
    systemicPathologyCuratedPractice: boolean;
  },
  right: {
    assessmentPilot: boolean;
    hvpCuratedPractice: boolean;
    tissueFoundationsCuratedPractice: boolean;
    ocularAdnexaCuratedPractice: boolean;
    aqueousVitreousCuratedPractice: boolean;
    bloodSupplyCuratedPractice: boolean;
    environmentalVisionCuratedPractice: boolean;
    autonomicPharmacologyCuratedPractice: boolean;
    systemicPathologyCuratedPractice: boolean;
  },
): boolean {
  return left.assessmentPilot === right.assessmentPilot
    && left.hvpCuratedPractice === right.hvpCuratedPractice
    && left.tissueFoundationsCuratedPractice
      === right.tissueFoundationsCuratedPractice
    && left.ocularAdnexaCuratedPractice
      === right.ocularAdnexaCuratedPractice
    && left.aqueousVitreousCuratedPractice
      === right.aqueousVitreousCuratedPractice
    && left.bloodSupplyCuratedPractice
      === right.bloodSupplyCuratedPractice
    && left.environmentalVisionCuratedPractice
      === right.environmentalVisionCuratedPractice
    && left.autonomicPharmacologyCuratedPractice
      === right.autonomicPharmacologyCuratedPractice
    && left.systemicPathologyCuratedPractice
      === right.systemicPathologyCuratedPractice;
}

export function createReleaseManifest(
  options: CreateReleaseManifestOptions,
): ReleaseManifest {
  const git = options.git ?? releaseGitIdentity();
  assertCleanReleaseTree(git);
  const { audit } = options;
  const identity = audit.buildIdentity;
  const expectedFlags = RELEASE_PROFILES[options.profile];
  if (audit.profile !== options.profile) {
    throw new Error('Release manifest profile does not match the supplied bundle audit.');
  }
  if (identity.profile !== options.profile) {
    throw new Error('Release manifest profile does not match the audited build identity.');
  }
  if (!sameFlags(identity.flags, expectedFlags)) {
    throw new Error('Audited build flags do not match the requested release profile.');
  }
  if (identity.flags.assessmentPilot) {
    throw new Error('The Aqueous engineering pilot must remain disabled.');
  }
  if (identity.commitSha !== git.commitSha || identity.treeSha !== git.treeSha) {
    throw new Error('Audited build Git identity does not match the manifest Git identity.');
  }
  if (
    audit.fingerprint !== identity.outputFingerprint
    || audit.fingerprint !== audit.buildIdentity.outputFingerprint
  ) {
    throw new Error('Audited output fingerprint does not match the build identity.');
  }
  if (identity.dirty || git.dirty) {
    throw new Error('Release manifest identity must be clean.');
  }

  const assertions = assertReleaseAssertions();
  const sectionCount = modules.reduce((total, module) => total + module.sections.length, 0);
  const legacyQuestionCount = modules.reduce(
    (total, module) => total + module.facts.length,
    0,
  );
  const establishedCuratedQuestionCount = [
    aqueousVitreousCandidateBank,
    humanVisualPerceptionCandidateBank,
    tissueFoundationsCandidateBank,
    ocularAdnexaCandidateBank,
    bloodSupplyCandidateBank,
    environmentalVisionCandidateBank,
    autonomicPharmacologyCandidateBank,
    systemicPathologyCandidateBank,
  ].reduce((total, bank) => total + bank.questions.length, 0);
  const opt370Questions = OPT370_BANKS.flatMap((bank) => [...bank.questions]);
  const opt370Objectives = OPT370_BANKS.flatMap((bank) => [...bank.objectives]);
  const manifest = {
    schemaVersion: 1,
    releaseProfile: options.profile,
    git,
    builtAt: identity.builtAt,
    runtime: {
      node: identity.nodeVersion,
      npm: identity.npmVersion,
    },
    hosting: {
      projectId: hosting.project_id,
      d1: hosting.d1,
      r2: hosting.r2,
    },
    flags: identity.flags,
    storage: {
      version: 2,
      key: 'optometry-study-hub:v2',
      rollbackKey: 'opt376-study-state:v1',
      migrationAddedByRelease: false,
    },
    content: {
      courses: courses.length,
      modules: modules.length,
      studySections: sectionCount,
      legacyQuestions: legacyQuestionCount,
      curatedQuestions: establishedCuratedQuestionCount,
      curatedQuestionsScope: 'established-eight-bank-release',
      opt370DraftQuestions: opt370Questions.length,
      opt370DraftObjectives: opt370Objectives.length,
      opt370DraftModules: OPT370_BANKS.length,
      courseAlignedQuestionRecords:
        establishedCuratedQuestionCount + opt370Questions.length,
      opt370Checksums: EXPECTED_OPT370_CHECKSUMS,
      aqueousQuestions: aqueousVitreousCandidateBank.questions.length,
      aqueousObjectives: aqueousVitreousCandidateBank.objectives.length,
      aqueousSources: aqueousVitreousCandidateBank.sources.length,
      aqueousSvgDiagrams: new Set(aqueousVitreousCandidateBank.questions.flatMap(
        (question) => ('image' in question && question.image.src.endsWith('.svg')
          ? [question.image.src]
          : []),
      )).size,
      aqueousChecksum: EXPECTED_AQUEOUS_VITREOUS_CHECKSUM,
      hvpQuestions: humanVisualPerceptionCandidateBank.questions.length,
      hvpObjectives: humanVisualPerceptionCandidateBank.objectives.length,
      hvpSources: humanVisualPerceptionCandidateBank.sources.length,
      hvpSvgDiagrams: new Set(humanVisualPerceptionCandidateBank.questions.flatMap(
        (question) => ('image' in question && question.image.src.endsWith('.svg')
          ? [question.image.src]
          : []),
      )).size,
      hvpChecksum: EXPECTED_HVP_CHECKSUM,
      tissueQuestions: tissueFoundationsCandidateBank.questions.length,
      tissueObjectives: tissueFoundationsCandidateBank.objectives.length,
      tissueSources: tissueFoundationsCandidateBank.sources.length,
      tissueSvgDiagrams: new Set(tissueFoundationsCandidateBank.questions.flatMap(
        (question) => ('image' in question && question.image.src.endsWith('.svg')
          ? [question.image.src]
          : []),
      )).size,
      tissueChecksum: EXPECTED_TISSUE_CHECKSUM,
      ocularAdnexaQuestions: ocularAdnexaCandidateBank.questions.length,
      ocularAdnexaObjectives: ocularAdnexaCandidateBank.objectives.length,
      ocularAdnexaSources: ocularAdnexaCandidateBank.sources.length,
      ocularAdnexaSvgDiagrams: new Set(ocularAdnexaCandidateBank.questions.flatMap(
        (question) => ('image' in question && question.image.src.endsWith('.svg')
          ? [question.image.src]
          : []),
      )).size,
      ocularAdnexaChecksum: EXPECTED_OCULAR_ADNEXA_CHECKSUM,
      bloodSupplyQuestions: bloodSupplyCandidateBank.questions.length,
      bloodSupplyObjectives: bloodSupplyCandidateBank.objectives.length,
      bloodSupplySources: bloodSupplyCandidateBank.sources.length,
      bloodSupplySvgDiagrams: new Set(bloodSupplyCandidateBank.questions.flatMap(
        (question) => ('image' in question && question.image.src.endsWith('.svg')
          ? [question.image.src]
          : []),
      )).size,
      bloodSupplyChecksum: EXPECTED_BLOOD_SUPPLY_CHECKSUM,
      environmentalVisionQuestions: environmentalVisionCandidateBank.questions.length,
      environmentalVisionObjectives: environmentalVisionCandidateBank.objectives.length,
      environmentalVisionSources: environmentalVisionCandidateBank.sources.length,
      environmentalVisionSvgDiagrams: new Set(
        environmentalVisionCandidateBank.questions.flatMap(
          (question) => ('image' in question && question.image.src.endsWith('.svg')
            ? [question.image.src]
            : []),
        ),
      ).size,
      environmentalVisionChecksum: EXPECTED_ENVIRONMENTAL_VISION_CHECKSUM,
      autonomicPharmacologyQuestions: autonomicPharmacologyCandidateBank.questions.length,
      autonomicPharmacologyObjectives: autonomicPharmacologyCandidateBank.objectives.length,
      autonomicPharmacologySources: autonomicPharmacologyCandidateBank.sources.length,
      autonomicPharmacologySvgDiagrams: new Set(
        autonomicPharmacologyCandidateBank.questions.flatMap(
          (question) => ('image' in question && question.image.src.endsWith('.svg')
            ? [question.image.src]
            : []),
        ),
      ).size,
      autonomicPharmacologyChecksum: EXPECTED_AUTONOMIC_PHARMACOLOGY_CHECKSUM,
      systemicPathologyQuestions: systemicPathologyCandidateBank.questions.length,
      systemicPathologyObjectives: systemicPathologyCandidateBank.objectives.length,
      systemicPathologySources: systemicPathologyCandidateBank.sources.length,
      systemicPathologySvgDiagrams: new Set(
        systemicPathologyCandidateBank.questions.flatMap(
          (question) => ('image' in question && question.image.src.endsWith('.svg')
            ? [question.image.src]
            : []),
        ),
      ).size,
      systemicPathologyChecksum: EXPECTED_SYSTEMIC_PATHOLOGY_CHECKSUM,
      reviewStatuses: {
        aqueousQuestions: reviewStatusCounts(aqueousVitreousCandidateBank.questions),
        aqueousObjectives: reviewStatusCounts(aqueousVitreousCandidateBank.objectives),
        hvpQuestions: reviewStatusCounts(humanVisualPerceptionCandidateBank.questions),
        hvpObjectives: reviewStatusCounts(humanVisualPerceptionCandidateBank.objectives),
        tissueQuestions: reviewStatusCounts(tissueFoundationsCandidateBank.questions),
        tissueObjectives: reviewStatusCounts(tissueFoundationsCandidateBank.objectives),
        ocularAdnexaQuestions: reviewStatusCounts(ocularAdnexaCandidateBank.questions),
        ocularAdnexaObjectives: reviewStatusCounts(ocularAdnexaCandidateBank.objectives),
        bloodSupplyQuestions: reviewStatusCounts(bloodSupplyCandidateBank.questions),
        bloodSupplyObjectives: reviewStatusCounts(bloodSupplyCandidateBank.objectives),
        environmentalVisionQuestions: reviewStatusCounts(
          environmentalVisionCandidateBank.questions,
        ),
        environmentalVisionObjectives: reviewStatusCounts(
          environmentalVisionCandidateBank.objectives,
        ),
        autonomicPharmacologyQuestions: reviewStatusCounts(
          autonomicPharmacologyCandidateBank.questions,
        ),
        autonomicPharmacologyObjectives: reviewStatusCounts(
          autonomicPharmacologyCandidateBank.objectives,
        ),
        systemicPathologyQuestions: reviewStatusCounts(
          systemicPathologyCandidateBank.questions,
        ),
        systemicPathologyObjectives: reviewStatusCounts(
          systemicPathologyCandidateBank.objectives,
        ),
        opt370Questions: reviewStatusCounts(opt370Questions),
        opt370Objectives: reviewStatusCounts(opt370Objectives),
      },
      academicStatus:
        'Established curated and OPT 370 course-aligned questions remain draft educational practice; not lecturer-approved examination items.',
    },
    assessment: {
      supportedFormats: [...QUESTION_FORMATS],
      aqueousEnabled: false,
    },
    routes: {
      public: [...RELEASE_PUBLIC_ROUTES],
      controlled: [...RELEASE_CONTROLLED_ROUTES],
    },
    build: {
      outputFingerprint: audit.fingerprint,
      identity,
      metrics: audit.metrics,
    },
    assertions: [
      ...assertions,
      ...audit.assertions.map((item) => ({
        id: `bundle-${item.id}`,
        passed: item.passed,
        detail: item.detail,
      })),
    ],
  };
  return releaseManifestSchema.parse(manifest);
}

export function releaseManifestIdentity(manifest: ReleaseManifest): string {
  const deterministic = {
    ...manifest,
    builtAt: '<timestamp>',
    runtime: { ...manifest.runtime, node: '<node>', npm: '<npm>' },
    build: {
      ...manifest.build,
      identity: {
        ...manifest.build.identity,
        builtAt: '<timestamp>',
        nodeVersion: '<node>',
        npmVersion: '<npm>',
        buildDurationMs: 0,
      },
      metrics: { ...manifest.build.metrics, buildDurationMs: 0 },
    },
  };
  return createHash('sha256')
    .update(JSON.stringify(deterministic))
    .digest('hex');
}

export function releaseManifestChecksum(manifest: ReleaseManifest): string {
  return createHash('sha256')
    .update(`${JSON.stringify(manifest, null, 2)}\n`)
    .digest('hex');
}

export function renderReleaseReport(
  manifest: ReleaseManifest,
  manifestChecksum = releaseManifestChecksum(manifest),
): string {
  const checks = manifest.assertions.map((item) => (
    `- [${item.passed ? 'x' : ' '}] ${item.id}: ${item.detail}`
  )).join('\n');
  return `# Optometry Study Hub release candidate

- Profile: \`${manifest.releaseProfile}\`
- Commit: \`${manifest.git.commitSha}\`
- Tree: \`${manifest.git.treeSha}\`
- Built: ${manifest.builtAt}
- Build profile: \`${manifest.build.identity.profile}\`
- Build flags: Aqueous pilot \`${manifest.build.identity.flags.assessmentPilot}\`, HVP \`${manifest.build.identity.flags.hvpCuratedPractice}\`, Tissue \`${manifest.build.identity.flags.tissueFoundationsCuratedPractice}\`, Ocular Adnexa \`${manifest.build.identity.flags.ocularAdnexaCuratedPractice}\`, Aqueous curated \`${manifest.build.identity.flags.aqueousVitreousCuratedPractice}\`, Blood Supply \`${manifest.build.identity.flags.bloodSupplyCuratedPractice}\`, Environmental Vision \`${manifest.build.identity.flags.environmentalVisionCuratedPractice}\`
- Build fingerprint: \`${manifest.build.identity.outputFingerprint}\`
- Build runtime: Node \`${manifest.build.identity.nodeVersion}\`, npm \`${manifest.build.identity.npmVersion}\`
- Manifest SHA-256: \`${manifestChecksum}\`
- Sites project: \`${manifest.hosting.projectId}\`
- Aqueous pilot: disabled
- HVP curated practice: ${manifest.flags.hvpCuratedPractice ? 'enabled' : 'disabled'}
- Tissue Foundations curated practice: ${manifest.flags.tissueFoundationsCuratedPractice ? 'enabled' : 'disabled'}
- Ocular Adnexa curated practice: ${manifest.flags.ocularAdnexaCuratedPractice ? 'enabled' : 'disabled'}
- Aqueous and Vitreous curated practice: ${manifest.flags.aqueousVitreousCuratedPractice ? 'enabled' : 'disabled'}
- Blood Supply curated practice: ${manifest.flags.bloodSupplyCuratedPractice ? 'enabled' : 'disabled'}
- Environmental Vision curated practice: ${manifest.flags.environmentalVisionCuratedPractice ? 'enabled' : 'disabled'}
- Autonomic Pharmacology curated practice: ${manifest.flags.autonomicPharmacologyCuratedPractice ? 'enabled' : 'disabled'}
- Systemic Pathology curated practice: ${manifest.flags.systemicPathologyCuratedPractice ? 'enabled' : 'disabled'}
- Storage: \`${manifest.storage.key}\` with rollback key \`${manifest.storage.rollbackKey}\`
- HVP bank SHA-256: \`${manifest.content.hvpChecksum}\`
- Ocular Adnexa bank SHA-256: \`${manifest.content.ocularAdnexaChecksum}\`
- Aqueous and Vitreous bank SHA-256: \`${manifest.content.aqueousChecksum}\`
- Blood Supply bank SHA-256: \`${manifest.content.bloodSupplyChecksum}\`
- Environmental Vision bank SHA-256: \`${manifest.content.environmentalVisionChecksum}\`
- OPT 370 bank SHA-256 values: ${Object.values(manifest.content.opt370Checksums).join(', ')}
- Academic status: ${manifest.content.academicStatus}

## Content identity

- ${manifest.content.courses} courses
- ${manifest.content.modules} modules
- ${manifest.content.studySections} study sections
- ${manifest.content.legacyQuestions} frozen legacy compatibility questions
- ${manifest.content.curatedQuestions} established curated questions across eight modules
- ${manifest.content.opt370DraftQuestions} OPT 370 draft questions, ${manifest.content.opt370DraftObjectives} objectives, and ${manifest.content.opt370DraftModules} modules
- ${manifest.content.courseAlignedQuestionRecords} course-aligned question records (${manifest.content.curatedQuestions} established curated + ${manifest.content.opt370DraftQuestions} OPT 370 draft)
- ${manifest.content.aqueousQuestions} Aqueous questions and ${manifest.content.aqueousObjectives} objectives
- ${manifest.content.bloodSupplyQuestions} Blood Supply questions, ${manifest.content.bloodSupplyObjectives} objectives, ${manifest.content.bloodSupplySources} sources and ${manifest.content.bloodSupplySvgDiagrams} SVG diagrams
- ${manifest.content.environmentalVisionQuestions} Environmental Vision questions, ${manifest.content.environmentalVisionObjectives} objectives, ${manifest.content.environmentalVisionSources} sources and ${manifest.content.environmentalVisionSvgDiagrams} SVG diagrams
- ${manifest.content.autonomicPharmacologyQuestions} Autonomic Pharmacology questions, ${manifest.content.autonomicPharmacologyObjectives} objectives, ${manifest.content.autonomicPharmacologySources} sources and ${manifest.content.autonomicPharmacologySvgDiagrams} SVG diagrams
- ${manifest.content.systemicPathologyQuestions} Systemic Pathology questions, ${manifest.content.systemicPathologyObjectives} objectives, ${manifest.content.systemicPathologySources} sources and ${manifest.content.systemicPathologySvgDiagrams} SVG diagrams
- ${manifest.content.hvpQuestions} HVP questions, ${manifest.content.hvpObjectives} objectives, ${manifest.content.hvpSources} sources
- ${manifest.content.hvpSvgDiagrams} HVP SVG diagrams
- ${manifest.content.tissueQuestions} Tissue questions, ${manifest.content.tissueObjectives} objectives,
${manifest.content.tissueSources} sources and ${manifest.content.tissueSvgDiagrams} SVG diagrams
- Tissue bank SHA-256: \`${manifest.content.tissueChecksum}\`
- ${manifest.assessment.supportedFormats.length} supported assessment formats

## Build metrics

- Total output: ${manifest.build.metrics.totalOutputBytes} bytes
- Client JavaScript: ${manifest.build.metrics.clientJavaScriptBytes} bytes
- Initial Home JavaScript: ${manifest.build.metrics.initialHomeJavaScriptBytes} bytes
- Disabled Practice Hub JavaScript: ${manifest.build.metrics.disabledPracticeHubJavaScriptBytes} bytes
- Disabled Progress Hub JavaScript: ${manifest.build.metrics.disabledProgressHubJavaScriptBytes} bytes
- HVP-enabled Practice Hub JavaScript including analytics: ${manifest.build.metrics.hvpEnabledPracticeHubJavaScriptBytes} bytes
- HVP-enabled Progress Hub JavaScript including analytics: ${manifest.build.metrics.hvpEnabledProgressHubJavaScriptBytes} bytes
- Incremental controlled HVP JavaScript: ${manifest.build.metrics.incrementalControlledHvpJavaScriptBytes} bytes
- Incremental HVP analytics JavaScript: ${manifest.build.metrics.incrementalHvpAnalyticsJavaScriptBytes} bytes
- Combined incremental HVP JavaScript: ${manifest.build.metrics.combinedIncrementalHvpJavaScriptBytes} bytes
- Largest emitted asset: ${manifest.build.metrics.largestAssetBytes} bytes
- Build duration: ${manifest.build.metrics.buildDurationMs} ms
- Output fingerprint: \`${manifest.build.outputFingerprint}\`

This exact output fingerprint was built from this exact clean Git commit and tree using this exact release profile and feature-flag set.

## Release assertions

${checks}
`;
}

export function assertManifestHasNoSensitivePaths(manifest: ReleaseManifest): void {
  const serialized = JSON.stringify(manifest);
  const forbidden = [
    process.cwd(),
    readFileSync('.env.example', 'utf8').trim(),
    'C:\\Users\\',
    '/Users/',
    '/home/',
  ];
  if (forbidden.some((value) => value && serialized.includes(value))) {
    throw new Error('Release manifest contains a local path or environment content.');
  }
}
