import type {
  ReviewDiagnostic,
  ReviewerProfile,
} from './campaignTypes';
import { reviewerProfileSchema } from './campaignSchemas';

export const normalizeCampaignReviewerId = (value: string): string =>
  value.trim().toLowerCase();

export function normalizeReviewerProfile(
  profile: ReviewerProfile,
): ReviewerProfile {
  return {
    schemaVersion: 1,
    id: normalizeCampaignReviewerId(profile.id),
    roles: [...new Set(profile.roles)].sort(),
    expertiseTags: [...new Set(profile.expertiseTags)].sort(),
    independentReviewAttestation: profile.independentReviewAttestation,
    conflictOfInterest:
      profile.conflictOfInterest.status === 'none'
        ? { status: 'none' }
        : {
            status: 'declared',
            description: profile.conflictOfInterest.description.trim(),
          },
    consentToAttribution: profile.consentToAttribution,
    ...(profile.displayName ? { displayName: profile.displayName.trim() } : {}),
    ...(profile.affiliation ? { affiliation: profile.affiliation.trim() } : {}),
  };
}

export function normalizeReviewerProfiles(
  profiles: ReviewerProfile[],
): ReviewerProfile[] {
  return profiles
    .map(normalizeReviewerProfile)
    .sort((left, right) => left.id.localeCompare(right.id));
}

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
    if (
      new Set(parsed.data.roles).size !== parsed.data.roles.length ||
      new Set(parsed.data.expertiseTags).size !== parsed.data.expertiseTags.length
    ) {
      issues.push({
        code: 'REVIEWER_PROFILE_DUPLICATE_VALUE',
        message: `${parsed.data.id} contains duplicate roles or expertise tags.`,
      });
      return;
    }
    const profile = normalizeReviewerProfile(parsed.data as ReviewerProfile);
    if (seen.has(profile.id)) {
      issues.push({
        code: 'REVIEWER_ID_DUPLICATE',
        message: `Duplicate reviewer ID "${profile.id}".`,
      });
      return;
    }
    if (
      !profile.independentReviewAttestation &&
      profile.conflictOfInterest.status === 'none'
    ) {
      issues.push({
        code: 'REVIEWER_ATTESTATION_REQUIRED',
        message: `${profile.id} must attest independence or declare a conflict.`,
      });
      return;
    }
    if (
      (profile.displayName || profile.affiliation) &&
      !profile.consentToAttribution
    ) {
      issues.push({
        code: 'REVIEWER_ATTRIBUTION_CONSENT_REQUIRED',
        message: `${profile.id} includes identity data without attribution consent.`,
      });
      return;
    }
    seen.add(profile.id);
    profiles.push(profile);
  });
  if (profiles.length === 0 && issues.length === 0) {
    issues.push({
      code: 'REVIEWER_LIST_EMPTY',
      message: 'A review campaign requires at least one reviewer.',
    });
  }
  if (
    profiles.length > 0 &&
    !profiles.some((profile) => profile.roles.includes('review-chair'))
  ) {
    issues.push({
      code: 'REVIEW_CHAIR_REQUIRED',
      message: 'A review campaign requires at least one registered review chair.',
    });
  }
  return { profiles: normalizeReviewerProfiles(profiles), issues };
}
