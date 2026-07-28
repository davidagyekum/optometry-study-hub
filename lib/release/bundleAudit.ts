import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { RELEASE_BUDGETS, type ReleaseBudget } from '@/lib/release/budgets';
import {
  releaseBuildMetricsSchema,
  type ReleaseBuildMetrics,
  type ReleaseProfileId,
} from '@/lib/release/types';

type ViteManifestEntry = {
  file: string;
  imports?: string[];
  dynamicImports?: string[];
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  src?: string;
};

type ViteManifest = Record<string, ViteManifestEntry>;

export type BundleAuditResult = {
  profile: ReleaseProfileId;
  outputDirectory: string;
  fingerprint: string;
  metrics: ReleaseBuildMetrics;
  budget: ReleaseBudget;
  initialFiles: string[];
  hvpLazyFiles: string[];
  assertions: Array<{ id: string; passed: boolean; detail: string }>;
};

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function manifestClosure(
  manifest: ViteManifest,
  roots: string[],
  includeDynamicRoots: string[] = [],
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
  includeDynamicRoots.forEach(visit);
  return visited;
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

function scanText(outputDirectory: string, files: string[], markers: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const source = readFileSync(resolve(outputDirectory, 'client', file), 'utf8');
    for (const marker of markers) {
      if (source.includes(marker)) hits.push(`${file}: ${marker.slice(0, 72)}`);
    }
  }
  return hits;
}

function outputFingerprint(outputDirectory: string): string {
  const hash = createHash('sha256');
  for (const file of filesUnder(outputDirectory).sort()) {
    hash.update(relative(outputDirectory, file).replaceAll('\\', '/'));
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function readBuildDuration(profile: ReleaseProfileId): number {
  const path = resolve('tmp', 'release', 'build-metadata', `${profile}.json`);
  if (!existsSync(path)) return 0;
  const value = JSON.parse(readFileSync(path, 'utf8')) as { buildDurationMs?: unknown };
  return typeof value.buildDurationMs === 'number' ? value.buildDurationMs : 0;
}

function markers() {
  const hvp = JSON.parse(readFileSync(
    'content/question-bank/opt374/human-visual-perception/bank.json',
    'utf8',
  )) as {
    questions: Array<{
      stem: string;
      explanation: string;
      options?: Array<{ text: string }>;
    }>;
    objectives: Array<{ statement: string }>;
  };
  const hvpQuestion = hvp.questions.find((question) => question.stem.length > 45)
    ?? hvp.questions[0];
  const hvpOption = hvpQuestion.options?.find((option) => option.text.length > 20)?.text;
  const aqueousMarker =
    'Aqueous humour reaches its principal resistance site at which structure?';
  return {
    hvp: [
      hvpQuestion.stem,
      hvpQuestion.explanation,
      hvp.objectives[0].statement,
      ...(hvpOption ? [hvpOption] : []),
    ],
    aqueous: [
      aqueousMarker,
      'This is the principal resistance site in conventional outflow.',
    ],
  };
}

export function auditReleaseBundle(
  profile: ReleaseProfileId,
  outputDirectory = resolve('tmp', 'release', 'builds', profile),
): BundleAuditResult {
  const manifestPath = resolve(outputDirectory, 'client', '.vite', 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Release build is missing for ${profile}: ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ViteManifest;
  const browserEntry = Object.entries(manifest).find(([, entry]) => entry.isEntry)?.[0];
  if (!browserEntry) throw new Error('The client build has no browser entry.');
  const initialEntries = manifestClosure(
    manifest,
    [browserEntry],
    ['app/StudyApp.tsx'],
  );
  const hvpEntry = 'components/assessment/hvp/HvpPracticeRouter.tsx';
  const hvpEntries = manifestClosure(manifest, [hvpEntry]);
  const incrementalHvpEntries = new Set(
    [...hvpEntries].filter((entry) => !initialEntries.has(entry)),
  );
  const allFiles = filesUnder(outputDirectory);
  const clientJs = allFiles.filter((file) => (
    relative(outputDirectory, file).replaceAll('\\', '/').startsWith('client/assets/')
    && file.endsWith('.js')
  ));
  const largestAssetBytes = Math.max(...allFiles.map((file) => statSync(file).size), 0);
  const metrics = releaseBuildMetricsSchema.parse({
    totalOutputBytes: allFiles.reduce((total, file) => total + statSync(file).size, 0),
    clientJavaScriptBytes: clientJs.reduce((total, file) => total + statSync(file).size, 0),
    initialHomeJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      initialEntries,
    ),
    practiceHubJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      initialEntries,
    ),
    progressHubJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      initialEntries,
    ),
    lazyHvpJavaScriptBytes: bytesForEntries(
      outputDirectory,
      manifest,
      incrementalHvpEntries,
    ),
    largestAssetBytes,
    buildDurationMs: readBuildDuration(profile),
    fileCount: allFiles.length,
  });
  const budget = RELEASE_BUDGETS[profile];
  const initialFiles = filesForEntries(manifest, initialEntries);
  const hvpLazyFiles = filesForEntries(manifest, incrementalHvpEntries);
  const contentMarkers = markers();
  const initialHvpHits = scanText(outputDirectory, initialFiles, contentMarkers.hvp);
  const initialAqueousHits = scanText(outputDirectory, initialFiles, contentMarkers.aqueous);
  const hvpLazyAqueousHits = scanText(
    outputDirectory,
    hvpLazyFiles,
    contentMarkers.aqueous,
  );
  const hvpLazyHvpHits = scanText(outputDirectory, hvpLazyFiles, contentMarkers.hvp);
  const serverEntry = resolve(outputDirectory, 'server', 'index.js');
  const serverEntryText = existsSync(serverEntry) ? readFileSync(serverEntry, 'utf8') : '';
  const serverAnswerHits = contentMarkers.hvp.filter((marker) => serverEntryText.includes(marker));
  const assertions = [
    {
      id: 'hvp-lazy-entry',
      passed: Boolean(manifest[hvpEntry]?.isDynamicEntry),
      detail: manifest[hvpEntry]?.file ?? 'missing dynamic HVP entry',
    },
    {
      id: 'initial-hvp-isolation',
      passed: initialHvpHits.length === 0,
      detail: initialHvpHits.length ? initialHvpHits.join('; ') : 'No HVP authored content in initial learner JavaScript.',
    },
    {
      id: 'initial-aqueous-isolation',
      passed: initialAqueousHits.length === 0,
      detail: initialAqueousHits.length ? initialAqueousHits.join('; ') : 'No hidden Aqueous content in initial learner JavaScript.',
    },
    {
      id: 'hvp-boundary-contains-content',
      passed: hvpLazyHvpHits.length > 0,
      detail: hvpLazyHvpHits.length ? 'HVP authored content is confined to the lazy boundary.' : 'HVP content marker missing from lazy boundary.',
    },
    {
      id: 'hvp-boundary-excludes-aqueous',
      passed: hvpLazyAqueousHits.length === 0,
      detail: hvpLazyAqueousHits.length ? hvpLazyAqueousHits.join('; ') : 'Lazy HVP boundary excludes hidden Aqueous content.',
    },
    {
      id: 'server-entry-answer-isolation',
      passed: serverAnswerHits.length === 0,
      detail: serverAnswerHits.length ? serverAnswerHits.join('; ') : 'Server entry contains no HVP authored answer content.',
    },
    ...Object.entries(budget).map(([key, limit]) => ({
      id: `budget-${key}`,
      passed: metrics[key as keyof ReleaseBudget] <= limit,
      detail: `${metrics[key as keyof ReleaseBudget]} / ${limit} bytes`,
    })),
  ];
  const result = {
    profile,
    outputDirectory,
    fingerprint: outputFingerprint(outputDirectory),
    metrics,
    budget,
    initialFiles,
    hvpLazyFiles,
    assertions,
  };
  const failed = assertions.filter((item) => !item.passed);
  if (failed.length) {
    throw new Error(
      `Release bundle audit failed for ${profile}:\n${failed.map((item) => `- ${item.id}: ${item.detail}`).join('\n')}`,
    );
  }
  return result;
}

export function writeBundleAudit(result: BundleAuditResult, path: string): void {
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}
