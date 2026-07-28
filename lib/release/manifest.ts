import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import hosting from '@/.openai/hosting.json';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import {
  assertReleaseAssertions,
  EXPECTED_HVP_CHECKSUM,
  reviewStatusCounts,
} from '@/lib/release/assertions';
import type { BundleAuditResult } from '@/lib/release/bundleAudit';
import { RELEASE_PROFILES } from '@/lib/release/profile';
import {
  releaseManifestSchema,
  type ReleaseManifest,
  type ReleaseProfileId,
} from '@/lib/release/types';

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

type ManifestGitIdentity = {
  commitSha: string;
  treeSha?: string;
  dirty: boolean;
};

export type CreateReleaseManifestOptions = {
  profile: ReleaseProfileId;
  audit: BundleAuditResult;
  git?: ManifestGitIdentity;
  builtAt?: string;
  nodeVersion?: string;
  npmVersion?: string;
};

function command(command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`,
    );
  }
  return result.stdout.trim();
}

export function releaseGitIdentity(): ManifestGitIdentity {
  const commitSha = command('git', ['rev-parse', 'HEAD']);
  const treeSha = command('git', ['rev-parse', 'HEAD^{tree}']);
  const dirty = command('git', ['status', '--porcelain']).length > 0;
  return { commitSha, treeSha, dirty };
}

export function assertCleanReleaseTree(identity: ManifestGitIdentity): void {
  if (identity.dirty) {
    throw new Error(
      'A final release manifest requires a clean Git working tree.',
    );
  }
}

function detectedNpmVersion(): string {
  if (process.env.npm_execpath) {
    return command(process.execPath, [process.env.npm_execpath, '--version']);
  }
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return command(npmCommand, ['--version']);
}

export function createReleaseManifest(
  options: CreateReleaseManifestOptions,
): ReleaseManifest {
  const git = options.git ?? releaseGitIdentity();
  assertCleanReleaseTree(git);
  const assertions = assertReleaseAssertions();
  const flags = RELEASE_PROFILES[options.profile];
  const sectionCount = modules.reduce((total, module) => total + module.sections.length, 0);
  const legacyQuestionCount = modules.reduce(
    (total, module) => total + module.facts.length,
    0,
  );
  const manifest = {
    schemaVersion: 1,
    releaseProfile: options.profile,
    git,
    builtAt: options.builtAt ?? new Date().toISOString(),
    runtime: {
      node: options.nodeVersion ?? process.version,
      npm: options.npmVersion ?? detectedNpmVersion(),
    },
    hosting: {
      projectId: hosting.project_id,
      d1: hosting.d1,
      r2: hosting.r2,
    },
    flags,
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
      reviewStatuses: {
        aqueousQuestions: reviewStatusCounts(aqueousVitreousCandidateBank.questions),
        aqueousObjectives: reviewStatusCounts(aqueousVitreousCandidateBank.objectives),
        hvpQuestions: reviewStatusCounts(humanVisualPerceptionCandidateBank.questions),
        hvpObjectives: reviewStatusCounts(humanVisualPerceptionCandidateBank.objectives),
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
      outputFingerprint: options.audit.fingerprint,
      metrics: options.audit.metrics,
    },
    assertions: [
      ...assertions,
      ...options.audit.assertions.map((item) => ({
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
- Tree: \`${manifest.git.treeSha ?? 'unavailable'}\`
- Built: ${manifest.builtAt}
- Manifest SHA-256: \`${manifestChecksum}\`
- Sites project: \`${manifest.hosting.projectId}\`
- Aqueous pilot: disabled
- HVP curated practice: ${manifest.flags.hvpCuratedPractice ? 'enabled' : 'disabled'}
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
- ${manifest.assessment.supportedFormats.length} supported assessment formats

## Build metrics

- Total output: ${manifest.build.metrics.totalOutputBytes} bytes
- Client JavaScript: ${manifest.build.metrics.clientJavaScriptBytes} bytes
- Initial Home route JavaScript: ${manifest.build.metrics.initialHomeJavaScriptBytes} bytes
- Practice Hub JavaScript: ${manifest.build.metrics.practiceHubJavaScriptBytes} bytes
- Progress Hub JavaScript: ${manifest.build.metrics.progressHubJavaScriptBytes} bytes
- Lazy HVP JavaScript: ${manifest.build.metrics.lazyHvpJavaScriptBytes} bytes
- Largest emitted asset: ${manifest.build.metrics.largestAssetBytes} bytes
- Build duration: ${manifest.build.metrics.buildDurationMs} ms
- Output fingerprint: \`${manifest.build.outputFingerprint}\`

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
