import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import hosting from '@/.openai/hosting.json';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import {
  assertReleaseAssertions,
  EXPECTED_HVP_CHECKSUM,
  EXPECTED_TISSUE_CHECKSUM,
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
  },
  right: {
    assessmentPilot: boolean;
    hvpCuratedPractice: boolean;
    tissueFoundationsCuratedPractice: boolean;
  },
): boolean {
  return left.assessmentPilot === right.assessmentPilot
    && left.hvpCuratedPractice === right.hvpCuratedPractice
    && left.tissueFoundationsCuratedPractice
      === right.tissueFoundationsCuratedPractice;
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
      aqueousQuestions: aqueousVitreousCandidateBank.questions.length,
      aqueousObjectives: aqueousVitreousCandidateBank.objectives.length,
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
      reviewStatuses: {
        aqueousQuestions: reviewStatusCounts(aqueousVitreousCandidateBank.questions),
        aqueousObjectives: reviewStatusCounts(aqueousVitreousCandidateBank.objectives),
        hvpQuestions: reviewStatusCounts(humanVisualPerceptionCandidateBank.questions),
        hvpObjectives: reviewStatusCounts(humanVisualPerceptionCandidateBank.objectives),
        tissueQuestions: reviewStatusCounts(tissueFoundationsCandidateBank.questions),
        tissueObjectives: reviewStatusCounts(tissueFoundationsCandidateBank.objectives),
      },
      academicStatus:
        'Curated draft educational practice; not lecturer-approved examination items.',
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
- Build flags: Aqueous \`${manifest.build.identity.flags.assessmentPilot}\`, HVP \`${manifest.build.identity.flags.hvpCuratedPractice}\`, Tissue \`${manifest.build.identity.flags.tissueFoundationsCuratedPractice}\`
- Build fingerprint: \`${manifest.build.identity.outputFingerprint}\`
- Build runtime: Node \`${manifest.build.identity.nodeVersion}\`, npm \`${manifest.build.identity.npmVersion}\`
- Manifest SHA-256: \`${manifestChecksum}\`
- Sites project: \`${manifest.hosting.projectId}\`
- Aqueous pilot: disabled
- HVP curated practice: ${manifest.flags.hvpCuratedPractice ? 'enabled' : 'disabled'}
- Tissue Foundations curated practice: ${manifest.flags.tissueFoundationsCuratedPractice ? 'enabled' : 'disabled'}
- Storage: \`${manifest.storage.key}\` with rollback key \`${manifest.storage.rollbackKey}\`
- HVP bank SHA-256: \`${manifest.content.hvpChecksum}\`
- Academic status: ${manifest.content.academicStatus}

## Content identity

- ${manifest.content.courses} courses
- ${manifest.content.modules} modules
- ${manifest.content.studySections} study sections
- ${manifest.content.legacyQuestions} legacy questions
- ${manifest.content.aqueousQuestions} Aqueous questions and ${manifest.content.aqueousObjectives} objectives
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

This exact output fingerprint was built from this exact clean Git commit and tree using this exact release profile and feature-flag pair.

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
