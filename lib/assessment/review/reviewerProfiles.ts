import type {
  ReviewDiagnostic,
  ReviewerProfile,
} from './campaignTypes';
import { reviewerProfileSchema } from './campaignSchemas';

export const normalizeCampaignReviewerId = (value: string): string =>
  value.trim().toLowerCase();

export function validateReviewerProfiles(value: unknown): {
  profiles: ReviewerProfile[];
  issues: ReviewDiagnostic[];
} {
  if (!Array.isArray(value)) {
    return {
      profiles: [],
      issues: [
        {
          code: 'REVIEWER_LIST_INVALID',
          message: 'Reviewer input must be an array.',
        },
      ],
    };
  }
  const profiles: ReviewerProfile[] = [];
  const issues: ReviewDiagnostic[] = [];
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const candidate =
      entry && typeof entry === 'object'
        ? {
            ...(entry as Record<string, unknown>),
            id:
              typeof (entry as Record<string, unknown>).id === 'string'
                ? normalizeCampaignReviewerId(
                    (entry as Record<string, string>).id,
                  )
                : (entry as Record<string, unknown>).id,
          }
        : entry;
    const parsed = reviewerProfileSchema.safeParse(candidate);
    if (!parsed.success) {
      issues.push({
        code: 'REVIEWER_PROFILE_INVALID',
        message: `Reviewer ${index + 1}: ${parsed.error.issues
          .map((issue) => issue.message)
          .join('; ')}`,
      });
      return;
    }
    if (seen.has(parsed.data.id)) {
      issues.push({
        code: 'REVIEWER_ID_DUPLICATE',
        message: `Duplicate reviewer ID "${parsed.data.id}".`,
      });
      return;
    }
    if (
      !parsed.data.independentReviewAttestation &&
      parsed.data.conflictOfInterest.status === 'none'
    ) {
      issues.push({
        code: 'REVIEWER_ATTESTATION_REQUIRED',
        message: `${parsed.data.id} must attest independence or declare a conflict.`,
      });
      return;
    }
    if (
      (parsed.data.displayName || parsed.data.affiliation) &&
      !parsed.data.consentToAttribution
    ) {
      issues.push({
        code: 'REVIEWER_ATTRIBUTION_CONSENT_REQUIRED',
        message: `${parsed.data.id} includes identity data without attribution consent.`,
      });
      return;
    }
    seen.add(parsed.data.id);
    profiles.push(parsed.data);
  });
  if (profiles.length === 0 && issues.length === 0) {
    issues.push({
      code: 'REVIEWER_LIST_EMPTY',
      message: 'A review campaign requires at least one reviewer.',
    });
  }
  return { profiles, issues };
}
