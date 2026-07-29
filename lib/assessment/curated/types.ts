import type {
  ComponentType,
  Dispatch,
  SetStateAction,
} from 'react';
import { z } from 'zod';
import { STABLE_ID_PATTERN } from '@/lib/assessment/constants';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { ClientView } from '@/lib/navigation/clientRoute';
import type {
  ProgressActivity,
  ProgressRecommendation,
} from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

const stableIdSchema = z.string().regex(
  STABLE_ID_PATTERN,
  'Expected a stable slug-style ID',
);

export const curatedExperienceSummarySchema = z.strictObject({
  experienceId: stableIdSchema,
  courseId: stableIdSchema,
  moduleId: stableIdSchema,
  title: z.string().trim().min(1),
  shortTitle: z.string().trim().min(1),
  courseCode: z.string().trim().min(1),
  routeSegment: stableIdSchema,
  blueprintIds: z.array(stableIdSchema).min(1),
  statusLabel: z.string().trim().min(1),
  enabled: z.boolean(),
  supportsAutomaticPractice: z.boolean(),
  supportsWrittenPractice: z.boolean(),
  studyEntryTitle: z.string().trim().min(1),
  studyEntryDescription: z.string().trim().min(1),
  documentTitles: z.strictObject({
    landing: z.string().trim().min(1),
    session: z.string().trim().min(1),
    result: z.string().trim().min(1),
    unavailable: z.string().trim().min(1),
  }),
  releaseStatus: z.strictObject({
    ariaLabel: z.string().trim().min(1),
    title: z.string().trim().min(1),
    lines: z.array(z.string().trim().min(1)).min(1),
  }),
});

export type CuratedExperienceSummary = z.infer<
  typeof curatedExperienceSummarySchema
>;

export type CuratedPracticeRouterProps = {
  view: ClientView;
  resourceId: string;
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
};

export type CuratedProgressVariant = 'resume' | 'summary' | 'detail';

export type CuratedProgressPanelProps = {
  store: StoreV2;
  go: GoToRoute;
  variant: CuratedProgressVariant;
  legacyCandidates?: ProgressRecommendation[];
};

export type CuratedProgressContribution = {
  experienceId: string;
  moduleId: string;
  recommendationCandidates: ProgressRecommendation[];
  activity: ProgressActivity[];
  hasStoredData: boolean;
  integrityOmissionCount: number;
};

export type CuratedPracticeModule = {
  PracticeRouter: ComponentType<CuratedPracticeRouterProps>;
};

export type CuratedProgressModule = {
  ProgressPanel: ComponentType<CuratedProgressPanelProps>;
  getContribution: (store: StoreV2) => CuratedProgressContribution;
};

export type CuratedExperienceAdapter = {
  summary: CuratedExperienceSummary;
  isEnabled?: () => boolean;
  loadPracticeModule: () => Promise<CuratedPracticeModule>;
  loadProgressModule?: () => Promise<CuratedProgressModule>;
};
