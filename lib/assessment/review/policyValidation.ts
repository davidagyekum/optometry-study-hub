import { QUESTION_FORMATS } from '@/lib/assessment/constants';
import { applicableCriteria } from './criteria';
import { contentReviewPolicySchema } from './campaignSchemas';
import type {
  ContentReviewPolicy,
  ReviewDiagnostic,
} from './campaignTypes';

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
  for (const format of QUESTION_FORMATS) {
    const declared = policy.requiredFormatCriteria[format] ?? [];
    if (duplicate(declared)) {
      issues.push({
        code: 'REVIEW_POLICY_DUPLICATE_CRITERION',
        message: `${format} contains duplicate format criteria.`,
      });
    }
    const applicable = new Set(
      applicableCriteria(format).map((criterion) => criterion.id),
    );
    for (const criterion of declared) {
      if (!applicable.has(criterion)) {
        issues.push({
          code: 'REVIEW_POLICY_CRITERION_NOT_APPLICABLE',
          message: `${criterion} is not applicable to ${format}.`,
        });
      }
    }
  }
  return { policy, issues };
}
