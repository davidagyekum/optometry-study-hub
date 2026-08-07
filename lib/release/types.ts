import { z } from 'zod';
import { QUESTION_FORMATS, REVIEW_STATUSES } from '@/lib/assessment/constants';

export const RELEASE_PROFILE_IDS = [
  'disabled',
  'hvp-public-beta',
  'tissue-foundations-preview',
  'hvp-tissue-preview',
  'neuro-anatomy-preview',
  'environmental-vision-preview',
  'autonomic-pharmacology-preview',
  'systemic-pathology-preview',
  'full-curated-preview',
  'full-curated-public-beta',
] as const;
export const releaseProfileIdSchema = z.enum(RELEASE_PROFILE_IDS);
export type ReleaseProfileId = z.infer<typeof releaseProfileIdSchema>;

export const releaseFlagsSchema = z.strictObject({
  assessmentPilot: z.boolean(),
  hvpCuratedPractice: z.boolean(),
  tissueFoundationsCuratedPractice: z.boolean(),
  ocularAdnexaCuratedPractice: z.boolean(),
  aqueousVitreousCuratedPractice: z.boolean(),
  bloodSupplyCuratedPractice: z.boolean(),
  environmentalVisionCuratedPractice: z.boolean(),
  autonomicPharmacologyCuratedPractice: z.boolean(),
  systemicPathologyCuratedPractice: z.boolean(),
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
  disabledPracticeHubJavaScriptBytes: z.number().int().nonnegative(),
  disabledProgressHubJavaScriptBytes: z.number().int().nonnegative(),
  hvpEnabledPracticeHubJavaScriptBytes: z.number().int().nonnegative(),
  hvpEnabledProgressHubJavaScriptBytes: z.number().int().nonnegative(),
  incrementalControlledHvpJavaScriptBytes: z.number().int().nonnegative(),
  incrementalHvpAnalyticsJavaScriptBytes: z.number().int().nonnegative(),
  combinedIncrementalHvpJavaScriptBytes: z.number().int().nonnegative(),
  largestAssetBytes: z.number().int().nonnegative(),
  buildDurationMs: z.number().int().nonnegative(),
  fileCount: z.number().int().nonnegative(),
});
export type ReleaseBuildMetrics = z.infer<typeof releaseBuildMetricsSchema>;

export const releaseBuildMetadataSchema = z.strictObject({
  schemaVersion: z.literal(1),
  profile: releaseProfileIdSchema,
  flags: releaseFlagsSchema,
  commitSha: z.string().regex(/^[0-9a-f]{40}$/),
  treeSha: z.string().regex(/^[0-9a-f]{40}$/),
  dirty: z.literal(false),
  nodeVersion: z.string().min(1),
  npmVersion: z.string().min(1),
  builtAt: z.iso.datetime(),
  buildDurationMs: z.number().finite().nonnegative(),
  outputFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
  outputDirectory: z.string().regex(
    /^tmp\/release\/builds\/(disabled|hvp-public-beta|tissue-foundations-preview|hvp-tissue-preview|neuro-anatomy-preview|environmental-vision-preview|autonomic-pharmacology-preview|systemic-pathology-preview|full-curated-preview|full-curated-public-beta)$/,
  ),
});
export type ReleaseBuildMetadata = z.infer<typeof releaseBuildMetadataSchema>;

const reviewCountsSchema = z.record(
  z.enum(REVIEW_STATUSES),
  z.number().int().nonnegative(),
);

export const releaseManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  releaseProfile: releaseProfileIdSchema,
  git: z.strictObject({
    commitSha: z.string().regex(/^[0-9a-f]{40}$/),
    treeSha: z.string().regex(/^[0-9a-f]{40}$/),
    dirty: z.literal(false),
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
    courses: z.literal(6),
    modules: z.literal(13),
    studySections: z.literal(72),
    legacyQuestions: z.literal(400),
    curatedQuestions: z.literal(680),
    curatedQuestionsScope: z.literal('established-eight-bank-release'),
    opt370DraftQuestions: z.literal(400),
    opt370DraftObjectives: z.literal(66),
    opt370DraftModules: z.literal(5),
    courseAlignedQuestionRecords: z.literal(1080),
    opt370Checksums: z.strictObject({
      schematicEyeRefractiveStates: z.literal(
        '602b831f1206dedac93785041c13e8165370a19701ddf401908eb86503efc46a',
      ),
      multifocalFoundations: z.literal(
        '69ab5ea52c27977d78618c36f50aad1a5e46ccfdfcb1aca1082283bb4b3dee56',
      ),
      progressiveAdditionLenses: z.literal(
        'd9c5cc2df7a59275a0a397f90e052638727ce453f4a4e8a676b1dc4f54057906',
      ),
      pdAndDispensing: z.literal(
        'a9d29778d94101a883de9214f4a33b6883e9dd23951b150b3ddceb61f778e3e4',
      ),
      specialLenses: z.literal(
        '15c09a647968ab5a341992e194041ae955e5de40ef9439b086630c918249fc5a',
      ),
    }),
    aqueousQuestions: z.literal(80),
    aqueousObjectives: z.literal(13),
    aqueousSources: z.literal(8),
    aqueousSvgDiagrams: z.literal(4),
    aqueousChecksum: z.literal(
      '97c1bc76cbae20681b1c4494bb7d35d282420f8c03a9181927720e024ae9dccb',
    ),
    hvpQuestions: z.literal(120),
    hvpObjectives: z.literal(23),
    hvpSources: z.literal(19),
    hvpSvgDiagrams: z.literal(6),
    hvpChecksum: z.literal(
      '029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a',
    ),
    tissueQuestions: z.literal(80),
    tissueObjectives: z.literal(18),
    tissueSources: z.literal(10),
    tissueSvgDiagrams: z.literal(4),
    tissueChecksum: z.literal(
      '500454bab37a5846ed46efd442149c105cbaf6ea5c9dd270ba3605170a2d9c08',
    ),
    ocularAdnexaQuestions: z.literal(80),
    ocularAdnexaObjectives: z.literal(18),
    ocularAdnexaSources: z.literal(8),
    ocularAdnexaSvgDiagrams: z.literal(5),
    ocularAdnexaChecksum: z.literal(
      'fe96d664bdad67b40a4711332612e59e26a2b5a2c3844aae279dc71f662ecb9f',
    ),
    bloodSupplyQuestions: z.literal(80),
    bloodSupplyObjectives: z.literal(18),
    bloodSupplySources: z.literal(8),
    bloodSupplySvgDiagrams: z.literal(5),
    bloodSupplyChecksum: z.literal(
      '1ce2628c3c74ac124b7034d7c34efba63a10dc4d6dcaab079e5eed73a01ccf8d',
    ),
    environmentalVisionQuestions: z.literal(80),
    environmentalVisionObjectives: z.literal(18),
    environmentalVisionSources: z.literal(21),
    environmentalVisionSvgDiagrams: z.literal(5),
    autonomicPharmacologyQuestions: z.literal(80),
    autonomicPharmacologyObjectives: z.literal(20),
    autonomicPharmacologySources: z.literal(18),
    autonomicPharmacologySvgDiagrams: z.literal(5),
    autonomicPharmacologyChecksum: z.literal(
      '7f8c0d7915bccd3c3ffcf2ac96bc44758366928198ec55e68ee5e5c55d43e143',
    ),
    systemicPathologyQuestions: z.literal(80),
    systemicPathologyObjectives: z.literal(20),
    systemicPathologySources: z.literal(19),
    systemicPathologySvgDiagrams: z.literal(5),
    systemicPathologyChecksum: z.literal(
      '06ed91a7323147e8eb9ce1fe6d4813209d986d0b4e4664d55136a012d544b379',
    ),
    environmentalVisionChecksum: z.literal(
      'cd453b8dd2f691db44bc93eb550f290d0c7213e44f16dc1913e5d75559b99385',
    ),
    reviewStatuses: z.strictObject({
      aqueousQuestions: reviewCountsSchema,
      aqueousObjectives: reviewCountsSchema,
      hvpQuestions: reviewCountsSchema,
      hvpObjectives: reviewCountsSchema,
      tissueQuestions: reviewCountsSchema,
      tissueObjectives: reviewCountsSchema,
      ocularAdnexaQuestions: reviewCountsSchema,
      ocularAdnexaObjectives: reviewCountsSchema,
      bloodSupplyQuestions: reviewCountsSchema,
      bloodSupplyObjectives: reviewCountsSchema,
      environmentalVisionQuestions: reviewCountsSchema,
      environmentalVisionObjectives: reviewCountsSchema,
      autonomicPharmacologyQuestions: reviewCountsSchema,
      autonomicPharmacologyObjectives: reviewCountsSchema,
      systemicPathologyQuestions: reviewCountsSchema,
      systemicPathologyObjectives: reviewCountsSchema,
      opt370Questions: reviewCountsSchema,
      opt370Objectives: reviewCountsSchema,
    }),
    academicStatus: z.literal(
      'Established curated and OPT 370 course-aligned questions remain draft educational practice; not lecturer-approved examination items.',
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
    identity: releaseBuildMetadataSchema,
    metrics: releaseBuildMetricsSchema,
  }),
  assertions: z.array(releaseAssertionSchema).min(1),
});

export type ReleaseManifest = z.infer<typeof releaseManifestSchema>;
