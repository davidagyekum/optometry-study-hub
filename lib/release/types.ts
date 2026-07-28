import { z } from 'zod';
import { QUESTION_FORMATS, REVIEW_STATUSES } from '@/lib/assessment/constants';

export const RELEASE_PROFILE_IDS = ['disabled', 'hvp-public-beta'] as const;
export const releaseProfileIdSchema = z.enum(RELEASE_PROFILE_IDS);
export type ReleaseProfileId = z.infer<typeof releaseProfileIdSchema>;

export const releaseFlagsSchema = z.strictObject({
  assessmentPilot: z.boolean(),
  hvpCuratedPractice: z.boolean(),
});
export type ReleaseFlags = z.infer<typeof releaseFlagsSchema>;

export const releaseAssertionSchema = z.strictObject({
  id: z.string().min(1),
  passed: z.boolean(),
  detail: z.string().min(1),
});
export type ReleaseAssertion = z.infer<typeof releaseAssertionSchema>;

export const releaseBuildMetricsSchema = z.strictObject({
  totalOutputBytes: z.number().int().nonnegative(),
  clientJavaScriptBytes: z.number().int().nonnegative(),
  initialHomeJavaScriptBytes: z.number().int().nonnegative(),
  practiceHubJavaScriptBytes: z.number().int().nonnegative(),
  progressHubJavaScriptBytes: z.number().int().nonnegative(),
  lazyHvpJavaScriptBytes: z.number().int().nonnegative(),
  largestAssetBytes: z.number().int().nonnegative(),
  buildDurationMs: z.number().int().nonnegative(),
  fileCount: z.number().int().nonnegative(),
});
export type ReleaseBuildMetrics = z.infer<typeof releaseBuildMetricsSchema>;

const reviewCountsSchema = z.record(
  z.enum(REVIEW_STATUSES),
  z.number().int().nonnegative(),
);

export const releaseManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  releaseProfile: releaseProfileIdSchema,
  git: z.strictObject({
    commitSha: z.string().regex(/^[0-9a-f]{40}$/),
    treeSha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
    dirty: z.boolean(),
  }),
  builtAt: z.iso.datetime(),
  runtime: z.strictObject({
    node: z.string().min(1),
    npm: z.string().min(1),
  }),
  hosting: z.strictObject({
    projectId: z.string().min(1),
    d1: z.literal(null),
    r2: z.literal(null),
  }),
  flags: releaseFlagsSchema,
  storage: z.strictObject({
    version: z.literal(2),
    key: z.literal('optometry-study-hub:v2'),
    rollbackKey: z.literal('opt376-study-state:v1'),
    migrationAddedByRelease: z.literal(false),
  }),
  content: z.strictObject({
    courses: z.literal(5),
    modules: z.literal(8),
    studySections: z.literal(39),
    legacyQuestions: z.literal(400),
    aqueousQuestions: z.literal(36),
    aqueousObjectives: z.literal(13),
    hvpQuestions: z.literal(120),
    hvpObjectives: z.literal(23),
    hvpSources: z.literal(19),
    hvpSvgDiagrams: z.literal(6),
    hvpChecksum: z.literal(
      '029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a',
    ),
    reviewStatuses: z.strictObject({
      aqueousQuestions: reviewCountsSchema,
      aqueousObjectives: reviewCountsSchema,
      hvpQuestions: reviewCountsSchema,
      hvpObjectives: reviewCountsSchema,
    }),
    academicStatus: z.literal(
      'Curated draft educational practice; not lecturer-approved examination items.',
    ),
  }),
  assessment: z.strictObject({
    supportedFormats: z.tuple(QUESTION_FORMATS.map((format) => z.literal(format)) as [
      z.ZodLiteral<(typeof QUESTION_FORMATS)[0]>,
      ...z.ZodLiteral<(typeof QUESTION_FORMATS)[number]>[],
    ]),
    aqueousEnabled: z.literal(false),
  }),
  routes: z.strictObject({
    public: z.array(z.string().startsWith('/')).min(1),
    controlled: z.array(z.string().startsWith('/')).min(1),
  }),
  build: z.strictObject({
    outputFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
    metrics: releaseBuildMetricsSchema,
  }),
  assertions: z.array(releaseAssertionSchema).min(1),
});

export type ReleaseManifest = z.infer<typeof releaseManifestSchema>;
