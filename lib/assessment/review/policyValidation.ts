import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import { applicableCriteria, UNIVERSAL_CRITERIA } from './criteria';
import { contentReviewPolicySchema } from './campaignSchemas';
import type {
  ContentReviewPolicy,
  ReviewDiagnostic,
} from './campaignTypes';

const sameSet = (left: string[], right: string[]): boolean =>
  left.length === right.length &&
  [...left].sort().every((value, index) => value === [...right].sort()[index]);

export function validateContentReviewPolicy(value: unknown): {
  policy?: ContentReviewPolicy;
  issues: ReviewDiagnostic[];
} {
  const parsed = contentReviewPolicySchema.safeParse(value);
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map((issue) => ({
        code: 'REVIEW_POLICY_INVALID',
        message: issue.message,
        path: issue.path.join('.'),
      })),
    };
  }
  const policy = parsed.data as ContentReviewPolicy;
  const issues: ReviewDiagnostic[] = [];
  const duplicate = (values: string[]): boolean =>
    new Set(values).size !== values.length;
  if (
    duplicate(policy.requiredUniversalCriteria) ||
    duplicate(policy.blockingCriteria)
  ) {
    issues.push({
      code: 'REVIEW_POLICY_DUPLICATE_CRITERION',
      message: 'Policy criteria must be unique.',
    });
  }
  const expectedUniversal = UNIVERSAL_CRITERIA.map((criterion) => criterion.id);
  if (!sameSet(policy.requiredUniversalCriteria, expectedUniversal)) {
    issues.push({
      code: 'REVIEW_POLICY_UNIVERSAL_CRITERIA_MISMATCH',
      message: 'Policy universal criteria must exactly match the registered universal criteria.',
    });
  }
  const knownCriteria = new Set(
    QUESTION_FORMATS.flatMap((format) =>
      applicableCriteria(format).map((criterion) => criterion.id),
    ),
  );
  if (policy.blockingCriteria.some((criterion) => !knownCriteria.has(criterion))) {
    issues.push({
      code: 'REVIEW_POLICY_BLOCKING_CRITERION_UNKNOWN',
      message: 'Every blocking criterion must be registered as applicable.',
    });
  }
  for (const format of QUESTION_FORMATS) {
    const declared = policy.requiredFormatCriteria[format] ?? [];
    if (duplicate(declared)) {
      issues.push({
        code: 'REVIEW_POLICY_DUPLICATE_CRITERION',
        message: `${format} contains duplicate format criteria.`,
      });
    }
    const expected = applicableCriteria(format)
      .map((criterion) => criterion.id)
      .filter((criterion) => !expectedUniversal.includes(criterion));
    if (!sameSet(declared, expected)) {
      issues.push({
        code: 'REVIEW_POLICY_FORMAT_CRITERIA_MISMATCH',
        message: `${format} criteria must exactly match applicableCriteria().`,
      });
    }
  }
  return { policy, issues };
}
