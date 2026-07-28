import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { relative, resolve } from 'node:path';
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

export const HVP_CONTROLLED_ENTRY =
  'components/assessment/hvp/HvpPracticeRouter.tsx';
export const HVP_ANALYTICS_ENTRY =
  'components/progress/HvpProgressPanel.tsx';

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

export type ReleaseClosureAnalysis = {
  initial: Set<string>;
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

export function analyzeReleaseClosures(manifest: ViteManifest): ReleaseClosureAnalysis {
  const browserEntry = Object.entries(manifest).find(([, entry]) => entry.isEntry)?.[0];
  if (!browserEntry) throw new Error('The client build has no browser entry.');
  for (const key of [HVP_CONTROLLED_ENTRY, HVP_ANALYTICS_ENTRY]) {
    if (!manifest[key]) throw new Error(`Build manifest entry is missing: ${key}`);
    if (!manifest[key].isDynamicEntry) {
      throw new Error(`HVP lazy entry is not dynamic: ${key}`);
    }
  }
  const initial = manifestClosure(manifest, [browserEntry], ['app/StudyApp.tsx']);
  if (initial.has(HVP_CONTROLLED_ENTRY) || initial.has(HVP_ANALYTICS_ENTRY)) {
    throw new Error('An HVP lazy entry unexpectedly entered the initial learner closure.');
  }
  const controlled = manifestClosure(manifest, [HVP_CONTROLLED_ENTRY]);
  const analytics = manifestClosure(manifest, [HVP_ANALYTICS_ENTRY]);
  const combined = union(controlled, analytics);
  return {
    initial,
    controlled,
    analytics,
    combined,
    incrementalControlled: subtract(controlled, initial),
    incrementalAnalytics: subtract(analytics, initial),
    incrementalCombined: subtract(combined, initial),
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

function stableMarkers() {
  const hvp = JSON.parse(readFileSync(
    'content/question-bank/opt374/human-visual-perception/bank.json',
    'utf8',
  )) as { questions: BankQuestion[] };
  const sections = ['hvp-foundations', 'hvp-retina', 'hvp-lgn', 'hvp-extrastriate'];
  const sectionQuestions = sections.map((sectionId) => {
    const question = hvp.questions.find((candidate) => (
      candidate.sectionId === sectionId && candidate.stem.length > 35
    ));
    if (!question) throw new Error(`HVP marker question is missing for ${sectionId}.`);
    return question;
  });
  const formats = [
    'single_best_answer',
    'multiple_response',
    'matching',
    'ordering',
    'image_hotspot',
    'image_label',
  ];
  const answerQuestions = formats.map((format) => {
    const question = hvp.questions.find((candidate) => candidate.format === format);
    if (!question) throw new Error(`HVP answer marker question is missing for ${format}.`);
    return question;
  });
  const answerIdentity = answerQuestions.flatMap((question) => [
    ...(question.correctOptionId ? [question.correctOptionId] : []),
    ...(question.correctOptionIds ?? []),
    ...(question.correctOrder ?? []),
    ...(question.correctRegionIds ?? []),
    ...Object.values(question.correctMatches ?? {}),
    ...Object.values(question.correctAnswers ?? {}),
    ...Object.values(question.correctLabels ?? {}),
  ]).filter((value, index, values) => value.length > 5 && values.indexOf(value) === index)
    .slice(0, 12);
  const aqueous = JSON.parse(readFileSync(
    'content/question-bank/opt376/aqueous-vitreous/bank.json',
    'utf8',
  )) as { questions: BankQuestion[] };
  const aqueousQuestions = aqueous.questions.slice(0, 3);
  return {
    hvpAuthored: sectionQuestions.flatMap((question) => [
      question.stem,
      question.explanation,
    ]),
    hvpAnswerIdentity: answerIdentity,
    controlledUi: ['Curated slide-aligned practice', 'Quick practice'],
    analyticsUi: ['Current-version mastery', 'Written practice'],
    aqueous: aqueousQuestions.flatMap((question) => [
      question.stem,
      question.explanation,
    ]),
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
  const contentMarkers = stableMarkers();
  const initialHvpAuthored = scanText(
    outputDirectory,
    initialFiles,
    contentMarkers.hvpAuthored,
  );
  const initialHvpAnswers = scanText(
    outputDirectory,
    initialFiles,
    contentMarkers.hvpAnswerIdentity,
  );
  const initialAqueous = scanText(outputDirectory, initialFiles, contentMarkers.aqueous);
  const controlledHvpAuthored = scanText(
    outputDirectory,
    controlledHvpFiles,
    contentMarkers.hvpAuthored,
  );
  const controlledHvpAnswers = scanText(
    outputDirectory,
    controlledHvpFiles,
    contentMarkers.hvpAnswerIdentity,
  );
  const analyticsHvpAuthored = scanText(
    outputDirectory,
    hvpAnalyticsFiles,
    contentMarkers.hvpAuthored,
  );
  const analyticsHvpAnswers = scanText(
    outputDirectory,
    hvpAnalyticsFiles,
    contentMarkers.hvpAnswerIdentity,
  );
  const controlledUi = scanText(
    outputDirectory,
    controlledHvpFiles,
    contentMarkers.controlledUi,
  );
  const analyticsUi = scanText(
    outputDirectory,
    hvpAnalyticsFiles,
    contentMarkers.analyticsUi,
  );
  const controlledAqueous = scanText(
    outputDirectory,
    controlledHvpFiles,
    contentMarkers.aqueous,
  );
  const analyticsAqueous = scanText(
    outputDirectory,
    hvpAnalyticsFiles,
    contentMarkers.aqueous,
  );
  const serverEntry = resolve(outputDirectory, 'server', 'index.js');
  const serverEntryText = existsSync(serverEntry) ? readFileSync(serverEntry, 'utf8') : '';
  const serverAnswerCount = contentMarkers.hvpAnswerIdentity.filter(
    (marker) => serverEntryText.includes(marker),
  ).length;
  const complete = (scan: MarkerScan) => (
    scan.matchedMarkerCount === scan.markerCount && scan.markerCount > 0
  );
  const empty = (scan: MarkerScan) => scan.matchedMarkerCount === 0;
  const describe = (scan: MarkerScan) => (
    `${scan.matchedMarkerCount}/${scan.markerCount} markers across ${scan.matchedFileCount} files`
  );
  const assertions = [
    {
      id: 'hvp-controlled-lazy-entry',
      passed: Boolean(manifest[HVP_CONTROLLED_ENTRY]?.isDynamicEntry),
      detail: 'Controlled HVP entry is present and dynamic.',
    },
    {
      id: 'hvp-analytics-lazy-entry',
      passed: Boolean(manifest[HVP_ANALYTICS_ENTRY]?.isDynamicEntry),
      detail: 'HVP analytics entry is present and dynamic.',
    },
    {
      id: 'hvp-lazy-entries-excluded-from-initial',
      passed: !closures.initial.has(HVP_CONTROLLED_ENTRY)
        && !closures.initial.has(HVP_ANALYTICS_ENTRY),
      detail: 'Both HVP lazy entries remain outside the initial learner closure.',
    },
    {
      id: 'initial-hvp-authored-isolation',
      passed: empty(initialHvpAuthored),
      detail: `Initial authored-content scan: ${describe(initialHvpAuthored)}.`,
    },
    {
      id: 'initial-hvp-answer-isolation',
      passed: empty(initialHvpAnswers),
      detail: `Initial answer-identity scan: ${describe(initialHvpAnswers)}.`,
    },
    {
      id: 'initial-aqueous-isolation',
      passed: empty(initialAqueous),
      detail: `Initial hidden-Aqueous scan: ${describe(initialAqueous)}.`,
    },
    {
      id: 'controlled-hvp-content-present',
      passed: complete(controlledHvpAuthored)
        && complete(controlledHvpAnswers)
        && complete(controlledUi),
      detail: `Controlled HVP scan: authored ${describe(controlledHvpAuthored)}; answer identity ${describe(controlledHvpAnswers)}; UI ${describe(controlledUi)}.`,
    },
    {
      id: 'analytics-hvp-content-present',
      passed: complete(analyticsHvpAuthored)
        && complete(analyticsHvpAnswers)
        && complete(analyticsUi),
      detail: `Analytics HVP scan: authored ${describe(analyticsHvpAuthored)}; answer identity ${describe(analyticsHvpAnswers)}; UI ${describe(analyticsUi)}.`,
    },
    {
      id: 'hvp-boundaries-exclude-aqueous',
      passed: empty(controlledAqueous) && empty(analyticsAqueous),
      detail: `Controlled ${describe(controlledAqueous)}; analytics ${describe(analyticsAqueous)}.`,
    },
    {
      id: 'server-entry-answer-isolation',
      passed: serverAnswerCount === 0,
      detail: `${serverAnswerCount}/${contentMarkers.hvpAnswerIdentity.length} HVP answer-identity markers in server entry.`,
    },
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
