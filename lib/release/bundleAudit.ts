import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { relative, resolve } from 'node:path';
import {
  curatedReleaseAuditRegistry,
  type CuratedReleaseAuditDefinition,
} from '@/lib/release/curatedAuditRegistry';
import { RELEASE_BUDGETS, type ReleaseBudget } from '@/lib/release/budgets';
import {
  assertCleanReleaseTree,
  readReleaseBuildMetadata,
  releaseGitIdentity,
  releaseOutputDirectory,
  releaseOutputDirectoryId,
  releaseOutputFingerprint,
  type ReleaseGitIdentity,
} from '@/lib/release/buildIdentity';
import { assertReleaseProfile, RELEASE_PROFILES } from '@/lib/release/profile';
import {
  releaseBuildMetricsSchema,
  type ReleaseBuildMetadata,
  type ReleaseBuildMetrics,
  type ReleaseProfileId,
} from '@/lib/release/types';

export type ViteManifestEntry = {
  file: string;
  imports?: string[];
  dynamicImports?: string[];
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  src?: string;
};

export type ViteManifest = Record<string, ViteManifestEntry>;

export const HVP_CONTROLLED_ENTRY = curatedReleaseAuditRegistry[0].practiceEntry;
export const HVP_ANALYTICS_ENTRY = curatedReleaseAuditRegistry[0].progressEntry;

export type BundleAuditResult = {
  profile: ReleaseProfileId;
  outputDirectory: string;
  fingerprint: string;
  buildIdentity: ReleaseBuildMetadata;
  metrics: ReleaseBuildMetrics;
  budget: ReleaseBudget;
  initialFiles: string[];
  controlledHvpFiles: string[];
  hvpAnalyticsFiles: string[];
  combinedHvpFiles: string[];
  assertions: Array<{ id: string; passed: boolean; detail: string }>;
};

export type CuratedExperienceClosureAnalysis = {
  practice: Set<string>;
  progress: Set<string>;
  combined: Set<string>;
  incrementalPractice: Set<string>;
  incrementalProgress: Set<string>;
  incrementalCombined: Set<string>;
};

export type ReleaseClosureAnalysis = {
  initial: Set<string>;
  experiences: Record<string, CuratedExperienceClosureAnalysis>;
  allCurated: Set<string>;
  incrementalAllCurated: Set<string>;
  controlled: Set<string>;
  analytics: Set<string>;
  combined: Set<string>;
  incrementalControlled: Set<string>;
  incrementalAnalytics: Set<string>;
  incrementalCombined: Set<string>;
};

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(filePath) : [filePath];
  });
}

function manifestClosure(
  manifest: ViteManifest,
  roots: string[],
  additionalStaticRoots: string[] = [],
): Set<string> {
  const visited = new Set<string>();
  const visit = (key: string) => {
    if (visited.has(key)) return;
    const entry = manifest[key];
    if (!entry) throw new Error(`Build manifest entry is missing: ${key}`);
    visited.add(key);
    entry.imports?.forEach(visit);
  };
  roots.forEach(visit);
  additionalStaticRoots.forEach(visit);
  return visited;
}

function union(...sets: Set<string>[]): Set<string> {
  return new Set(sets.flatMap((set) => [...set]));
}

function subtract(source: Set<string>, excluded: Set<string>): Set<string> {
  return new Set([...source].filter((entry) => !excluded.has(entry)));
}

export function analyzeReleaseClosures(
  manifest: ViteManifest,
  definitions: readonly CuratedReleaseAuditDefinition[] = curatedReleaseAuditRegistry,
): ReleaseClosureAnalysis {
  const browserEntry = Object.entries(manifest).find(([, entry]) => entry.isEntry)?.[0];
  if (!browserEntry) throw new Error('The client build has no browser entry.');
  const initial = manifestClosure(manifest, [browserEntry], ['app/StudyApp.tsx']);
  const experiences: Record<string, CuratedExperienceClosureAnalysis> = {};
  for (const definition of definitions) {
    for (const key of [definition.practiceEntry, definition.progressEntry]) {
      if (!manifest[key]) throw new Error(`Build manifest entry is missing: ${key}`);
      if (!manifest[key].isDynamicEntry) {
        throw new Error(`Curated lazy entry is not dynamic: ${key}`);
      }
      if (initial.has(key)) {
        throw new Error(
          `Curated lazy entry for ${definition.experienceId} entered the initial learner closure: ${key}`,
        );
      }
    }
    const practice = manifestClosure(manifest, [definition.practiceEntry]);
    const progress = manifestClosure(manifest, [definition.progressEntry]);
    const combined = union(practice, progress);
    experiences[definition.experienceId] = {
      practice,
      progress,
      combined,
      incrementalPractice: subtract(practice, initial),
      incrementalProgress: subtract(progress, initial),
      incrementalCombined: subtract(combined, initial),
    };
  }
  const first = experiences[curatedReleaseAuditRegistry[0].experienceId]
    ?? Object.values(experiences)[0];
  if (!first) throw new Error('No curated release-audit definitions are registered.');
  const allCurated = union(...Object.values(experiences).map(
    (experience) => experience.combined,
  ));
  return {
    initial,
    experiences,
    allCurated,
    incrementalAllCurated: subtract(allCurated, initial),
    controlled: first.practice,
    analytics: first.progress,
    combined: first.combined,
    incrementalControlled: first.incrementalPractice,
    incrementalAnalytics: first.incrementalProgress,
    incrementalCombined: first.incrementalCombined,
  };
}

function bytesForEntries(
  outputDirectory: string,
  manifest: ViteManifest,
  entries: Set<string>,
): number {
  return [...entries].reduce((total, key) => {
    const file = resolve(outputDirectory, 'client', manifest[key].file);
    return total + statSync(file).size;
  }, 0);
}

function filesForEntries(manifest: ViteManifest, entries: Set<string>): string[] {
  return [...entries].map((key) => manifest[key].file).sort();
}

type MarkerScan = {
  markerCount: number;
  matchedMarkerCount: number;
  matchedFileCount: number;
};

function scanText(
  outputDirectory: string,
  files: string[],
  markers: string[],
): MarkerScan {
  const matched = new Set<string>();
  const matchedFiles = new Set<string>();
  for (const file of files) {
    const source = readFileSync(resolve(outputDirectory, 'client', file), 'utf8');
    markers.forEach((marker, index) => {
      if (source.includes(marker)) {
        matched.add(String(index));
        matchedFiles.add(file);
      }
    });
  }
  return {
    markerCount: markers.length,
    matchedMarkerCount: matched.size,
    matchedFileCount: matchedFiles.size,
  };
}

function stableMarkers(
  definition: CuratedReleaseAuditDefinition = curatedReleaseAuditRegistry[0],
) {
  return {
    hvpAuthored: definition.authoredContentMarkers(),
    hvpAnswerIdentity: definition.answerIdentityMarkers(),
    controlledUi: [...definition.practiceUiMarkers],
    analyticsUi: [...definition.progressUiMarkers],
    allowedCrossBank: definition.allowedCrossBankMarkers(),
    aqueous: definition.excludedCrossBankMarkers(),
  };
}

export function calculateReleaseMetrics(
  outputDirectory: string,
  manifest: ViteManifest,
  closures: ReleaseClosureAnalysis,
  buildDurationMs: number,
): ReleaseBuildMetrics {
  const allFiles = filesUnder(outputDirectory);
  const clientJs = allFiles.filter((file) => (
    relative(outputDirectory, file).replaceAll('\\', '/').startsWith('client/assets/')
    && file.endsWith('.js')
  ));
  const initialWithAnalytics = union(closures.initial, closures.analytics);
  const largestAssetBytes = Math.max(...allFiles.map((file) => statSync(file).size), 0);
  return releaseBuildMetricsSchema.parse({
    totalOutputBytes: allFiles.reduce((total, file) => total + statSync(file).size, 0),
    clientJavaScriptBytes: clientJs.reduce((total, file) => total + statSync(file).size, 0),
    initialHomeJavaScriptBytes: bytesForEntries(outputDirectory, manifest, closures.initial),
    disabledPracticeHubJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      closures.initial,
    ),
    disabledProgressHubJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      closures.initial,
    ),
    hvpEnabledPracticeHubJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      initialWithAnalytics,
    ),
    hvpEnabledProgressHubJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      initialWithAnalytics,
    ),
    incrementalControlledHvpJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      closures.incrementalControlled,
    ),
    incrementalHvpAnalyticsJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      closures.incrementalAnalytics,
    ),
    combinedIncrementalHvpJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      closures.incrementalCombined,
    ),
    largestAssetBytes,
    buildDurationMs,
    fileCount: allFiles.length,
  });
}

export function validateBuildIdentity(
  profile: ReleaseProfileId,
  outputDirectory: string,
  metadata: ReleaseBuildMetadata,
  currentGit: ReleaseGitIdentity,
  fingerprint: string,
): void {
  assertCleanReleaseTree(currentGit);
  assertReleaseProfile(metadata.profile, metadata.flags);
  if (metadata.profile !== profile) {
    throw new Error(
      `Release build metadata profile ${metadata.profile} does not match requested profile ${profile}.`,
    );
  }
  const expectedFlags = RELEASE_PROFILES[profile];
  if (
    metadata.flags.assessmentPilot !== expectedFlags.assessmentPilot
    || metadata.flags.hvpCuratedPractice !== expectedFlags.hvpCuratedPractice
    || metadata.flags.tissueFoundationsCuratedPractice
      !== expectedFlags.tissueFoundationsCuratedPractice
  ) {
    throw new Error(`Release build metadata flags do not match profile ${profile}.`);
  }
  if (metadata.commitSha !== currentGit.commitSha) {
    throw new Error('Release build metadata commit does not match current HEAD.');
  }
  if (metadata.treeSha !== currentGit.treeSha) {
    throw new Error('Release build metadata tree does not match current HEAD tree.');
  }
  const directoryId = releaseOutputDirectoryId(outputDirectory);
  if (metadata.outputDirectory !== directoryId) {
    throw new Error(
      `Release build metadata belongs to ${metadata.outputDirectory}, not ${directoryId}.`,
    );
  }
  if (metadata.outputFingerprint !== fingerprint) {
    throw new Error('Release output fingerprint does not match build metadata.');
  }
}

export function auditReleaseBundle(
  profile: ReleaseProfileId,
  outputDirectory = releaseOutputDirectory(profile),
): BundleAuditResult {
  if (!existsSync(outputDirectory)) {
    throw new Error(`Release output directory is missing for ${profile}: ${outputDirectory}`);
  }
  const manifestPath = resolve(outputDirectory, 'client', '.vite', 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Release build manifest is missing for ${profile}: ${manifestPath}`);
  }
  const metadata = readReleaseBuildMetadata(profile);
  const fingerprint = releaseOutputFingerprint(outputDirectory);
  validateBuildIdentity(
    profile,
    outputDirectory,
    metadata,
    releaseGitIdentity(),
    fingerprint,
  );

  let manifest: ViteManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ViteManifest;
  } catch (error) {
    throw new Error(
      `Vite release manifest is malformed for ${profile}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const closures = analyzeReleaseClosures(manifest);
  const metrics = calculateReleaseMetrics(
    outputDirectory,
    manifest,
    closures,
    metadata.buildDurationMs,
  );
  const budget = RELEASE_BUDGETS[profile];
  const initialFiles = filesForEntries(manifest, closures.initial);
  const controlledHvpFiles = filesForEntries(manifest, closures.incrementalControlled);
  const hvpAnalyticsFiles = filesForEntries(manifest, closures.incrementalAnalytics);
  const combinedHvpFiles = filesForEntries(manifest, closures.incrementalCombined);
  const serverEntry = resolve(outputDirectory, 'server', 'index.js');
  const serverEntryText = existsSync(serverEntry) ? readFileSync(serverEntry, 'utf8') : '';
  const complete = (scan: MarkerScan) => (
    scan.matchedMarkerCount === scan.markerCount && scan.markerCount > 0
  );
  const empty = (scan: MarkerScan) => scan.matchedMarkerCount === 0;
  const describe = (scan: MarkerScan) => (
    `${scan.matchedMarkerCount}/${scan.markerCount} markers across ${scan.matchedFileCount} files`
  );
  const curatedAssertions = curatedReleaseAuditRegistry.flatMap((definition) => {
    const closure = closures.experiences[definition.experienceId];
    if (!closure) {
      return [{
        id: `${definition.experienceId}-closure-present`,
        passed: false,
        detail: 'No closure was produced for the registered curated experience.',
      }];
    }
    const markers = stableMarkers(definition);
    const practiceFiles = filesForEntries(manifest, closure.incrementalPractice);
    const progressFiles = filesForEntries(manifest, closure.incrementalProgress);
    const initialAuthored = scanText(outputDirectory, initialFiles, markers.hvpAuthored);
    const initialAnswers = scanText(outputDirectory, initialFiles, markers.hvpAnswerIdentity);
    const initialExcluded = scanText(outputDirectory, initialFiles, markers.aqueous);
    const practiceAuthored = scanText(outputDirectory, practiceFiles, markers.hvpAuthored);
    const practiceAnswers = scanText(outputDirectory, practiceFiles, markers.hvpAnswerIdentity);
    const practiceUi = scanText(outputDirectory, practiceFiles, markers.controlledUi);
    const progressAuthored = scanText(outputDirectory, progressFiles, markers.hvpAuthored);
    const progressAnswers = scanText(outputDirectory, progressFiles, markers.hvpAnswerIdentity);
    const progressUi = scanText(outputDirectory, progressFiles, markers.analyticsUi);
    const practiceExcluded = scanText(outputDirectory, practiceFiles, markers.aqueous);
    const progressExcluded = scanText(outputDirectory, progressFiles, markers.aqueous);
    const serverAnswerCount = markers.hvpAnswerIdentity.filter(
      (marker) => serverEntryText.includes(marker),
    ).length;
    return [
      {
        id: `${definition.experienceId}-profile-enablement-declared`,
        passed: typeof definition.enabledInProfile(profile) === 'boolean',
        detail: `Registry enablement for ${profile}: ${definition.enabledInProfile(profile)}.`,
      },
      {
        id: `${definition.experienceId}-practice-lazy-entry`,
        passed: Boolean(manifest[definition.practiceEntry]?.isDynamicEntry),
        detail: 'Registered curated practice entry is present and dynamic.',
      },
      {
        id: `${definition.experienceId}-progress-lazy-entry`,
        passed: Boolean(manifest[definition.progressEntry]?.isDynamicEntry),
        detail: 'Registered curated progress entry is present and dynamic.',
      },
      {
        id: `${definition.experienceId}-lazy-isolation`,
        passed: !closures.initial.has(definition.practiceEntry)
          && !closures.initial.has(definition.progressEntry),
        detail: 'Registered lazy entries remain outside the initial learner closure.',
      },
      {
        id: `${definition.experienceId}-initial-content-isolation`,
        passed: empty(initialAuthored) && empty(initialAnswers) && empty(initialExcluded),
        detail: `Initial scans: authored ${describe(initialAuthored)}; answers ${describe(initialAnswers)}; excluded bank ${describe(initialExcluded)}.`,
      },
      {
        id: `${definition.experienceId}-practice-content-present`,
        passed: complete(practiceAuthored) && complete(practiceAnswers) && complete(practiceUi),
        detail: `Practice scans: authored ${describe(practiceAuthored)}; answers ${describe(practiceAnswers)}; UI ${describe(practiceUi)}.`,
      },
      {
        id: `${definition.experienceId}-progress-content-present`,
        passed: complete(progressAuthored) && complete(progressAnswers) && complete(progressUi),
        detail: `Progress scans: authored ${describe(progressAuthored)}; answers ${describe(progressAnswers)}; UI ${describe(progressUi)}.`,
      },
      {
        id: `${definition.experienceId}-cross-bank-isolation`,
        passed: empty(practiceExcluded) && empty(progressExcluded),
        detail: `Practice ${describe(practiceExcluded)}; progress ${describe(progressExcluded)}.`,
      },
      {
        id: `${definition.experienceId}-server-answer-isolation`,
        passed: serverAnswerCount === 0,
        detail: `${serverAnswerCount}/${markers.hvpAnswerIdentity.length} answer-identity markers in server entry.`,
      },
    ];
  });
  const assertions = [
    ...curatedAssertions,
    ...Object.entries(budget).map(([key, limit]) => ({
      id: `budget-${key}`,
      passed: metrics[key as keyof ReleaseBudget] <= limit,
      detail: `${metrics[key as keyof ReleaseBudget]} / ${limit} bytes`,
    })),
  ];
  const result = {
    profile,
    outputDirectory: releaseOutputDirectoryId(outputDirectory),
    fingerprint,
    buildIdentity: metadata,
    metrics,
    budget,
    initialFiles,
    controlledHvpFiles,
    hvpAnalyticsFiles,
    combinedHvpFiles,
    assertions,
  };
  const failed = assertions.filter((item) => !item.passed);
  if (failed.length) {
    throw new Error(
      `Release bundle audit failed for ${profile}:\n${
        failed.map((item) => `- ${item.id}: ${item.detail}`).join('\n')
      }`,
    );
  }
  return result;
}

export function writeBundleAudit(result: BundleAuditResult, filePath: string): void {
  writeFileSync(filePath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}
