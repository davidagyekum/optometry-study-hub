import { z } from 'zod';
import type {
  CuratedExperienceAdapter,
  CuratedProgressContribution,
} from '@/lib/assessment/curated/types';

const curatedProgressContributionSchema = z.strictObject({
  experienceId: z.string(),
  moduleId: z.string(),
  recommendationCandidates: z.array(z.unknown()),
  activity: z.array(z.unknown()),
  hasStoredData: z.boolean(),
  integrityOmissionCount: z.number().int().nonnegative().finite(),
});

export function validateCuratedProgressContribution(
  adapter: CuratedExperienceAdapter,
  value: unknown,
): CuratedProgressContribution {
  const parsed = curatedProgressContributionSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error('CURATED_PROGRESS_CONTRIBUTION_INVALID');
  }
  if (
    parsed.data.experienceId !== adapter.summary.experienceId
    || parsed.data.moduleId !== adapter.summary.moduleId
  ) {
    throw new Error('CURATED_PROGRESS_CONTRIBUTION_OWNERSHIP_MISMATCH');
  }
  return parsed.data as CuratedProgressContribution;
}
