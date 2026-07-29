import type {
  ComponentType,
  Dispatch,
  SetStateAction,
} from 'react';
import { z } from 'zod';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { ClientView } from '@/lib/navigation/clientRoute';
import type {
  ProgressActivity,
  ProgressRecommendation,
} from '@/lib/progress/types';
import type { StoreV2 } from '@/lib/storage/schemas';

export const curatedExperienceSummarySchema = z.object({
  experienceId: z.string().min(1),
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  courseCode: z.string().min(1),
  routeSegment: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  blueprintIds: z.array(z.string().min(1)).min(1),
  statusLabel: z.string().min(1),
  enabled: z.boolean(),
  supportsAutomaticPractice: z.boolean(),
  supportsWrittenPractice: z.boolean(),
  studyEntryTitle: z.string().min(1),
  studyEntryDescription: z.string().min(1),
  releaseStatus: z.object({
    ariaLabel: z.string().min(1),
    title: z.string().min(1),
    lines: z.array(z.string().min(1)).min(1),
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

export type CuratedProgressVariant =
  | 'resume'
  | 'summary'
  | 'detail'
  | 'recommendation'
  | 'activity';

export type CuratedProgressPanelProps = {
  store: StoreV2;
  go: GoToRoute;
  variant: CuratedProgressVariant;
  legacyCandidates?: ProgressRecommendation[];
  legacyActivity?: ProgressActivity[];
};

export type CuratedPracticeModule = {
  PracticeRouter: ComponentType<CuratedPracticeRouterProps>;
};

export type CuratedProgressModule = {
  ProgressPanel: ComponentType<CuratedProgressPanelProps>;
};

export type CuratedExperienceAdapter = {
  summary: CuratedExperienceSummary;
  isEnabled?: () => boolean;
  loadPracticeModule: () => Promise<CuratedPracticeModule>;
  loadProgressModule?: () => Promise<CuratedProgressModule>;
};
