import { calculateAikenValue } from './aikenV';
import type {
  BankReviewAnalysis,
  ContentReviewPolicy,
  QuestionReviewAnalysis,
  ReviewCampaignManifest,
  ReviewSubmission,
  ReviewerProfile,
  StableReviewIssue,
} from './campaignTypes';
import { createStableReviewIssue, sortReviewIssues } from './reviewIssues';
import type { AikenValue } from './types';

function aikenValue(
  manifest: ReviewCampaignManifest,
  question: ReviewCampaignManifest['questions'][number],
  criterion: string,
  rows: ReviewSubmission[],
  policy: ContentReviewPolicy,
): AikenValue {
  const ratings = rows
    .map((row) => row.rating)
    .filter((rating): rating is number => rating !== undefined);
  const calculated = calculateAikenValue(ratings);
  const reviewers = new Set(
    rows.filter((row) => row.rating !== undefined).map((row) => row.reviewerId),
  );
  if (!calculated) {
    return {
      bankId: manifest.bankId,
      questionId: question.questionId,
      questionVersion: question.questionVersion,
      questionHash: question.questionHash,
      criterion,
      ratingCount: 0,
      reviewerCount: 0,
      status: 'unrated',
    };
  }
  return {
    bankId: manifest.bankId,
    questionId: question.questionId,
    questionVersion: question.questionVersion,
    questionHash: question.questionHash,
    criterion,
    ...calculated,
    reviewerCount: reviewers.size,
    status:
      reviewers.size < policy.minimumUniqueReviewers
        ? 'provisional'
        : calculated.value < policy.flagBelowAikenV
          ? 'needs-review'
          : 'complete',
  };
}

function reviewerCounts(
  reviewerIds: Set<string>,
  reviewers: Map<string, ReviewerProfile>,
): {
  independent: number;
  conflicted: number;
} {
  let independent = 0;
  let conflicted = 0;
  for (const reviewerId of reviewerIds) {
    const reviewer = reviewers.get(reviewerId);
    if (!reviewer) continue;
    if (reviewer.conflictOfInterest.status === 'declared') conflicted += 1;
    if (
      reviewer.independentReviewAttestation &&
      reviewer.conflictOfInterest.status === 'none'
    ) {
      independent += 1;
    }
  }
  return { independent, conflicted };
}

export function analyzeReviewCampaign(input: {
  manifest: ReviewCampaignManifest;
  submissions: ReviewSubmission[];
  policy: ContentReviewPolicy;
}): BankReviewAnalysis {
  const reviewerMap = new Map(
    input.manifest.reviewers.map((reviewer) => [reviewer.id, reviewer]),
  );
  const questions: QuestionReviewAnalysis[] = input.manifest.questions.map(
    (question) => {
      const questionRows = input.submissions.filter(
        (submission) => submission.questionId === question.questionId,
      );
      const ratingRows = questionRows.filter(
        (submission) => submission.rating !== undefined,
      );
      const commentRows = questionRows.filter(
        (submission) => Boolean(submission.comment),
      );
      const reviewerIds = new Set(ratingRows.map((row) => row.reviewerId));
      const counts = reviewerCounts(reviewerIds, reviewerMap);
      const criterionValues = question.applicableCriteria.map((criterion) =>
        aikenValue(
          input.manifest,
          question,
          criterion,
          questionRows.filter((row) => row.criterion === criterion),
          input.policy,
        ),
      );
      const issues: StableReviewIssue[] = [];
      for (const row of questionRows.filter(
        (entry) =>
          entry.questionVersion !== question.questionVersion ||
          entry.questionHash !== question.questionHash,
      )) {
        issues.push(
          createStableReviewIssue({
            campaignId: input.manifest.id,
            question,
            criterion: row.criterion,
            reviewerId: row.reviewerId,
            code: 'STALE_REVIEW_EVIDENCE',
            severity: 'blocking',
            message: `${row.reviewerId} submitted evidence for a stale question version or hash.`,
          }),
        );
      }
      let fullyCoveredCriteria = 0;
      let independentlyCoveredCriteria = 0;
      for (const value of criterionValues) {
        const coverageRows = questionRows.filter(
          (row) => row.criterion === value.criterion,
        );
        const criterionRows = ratingRows.filter(
          (row) => row.criterion === value.criterion,
        );
        if (coverageRows.length === 0) {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              question,
              criterion: value.criterion,
              code: 'MISSING_REQUIRED_CRITERION',
              severity: 'blocking',
              message: `${value.criterion} is absent from merged coverage evidence.`,
            }),
          );
        }
        const criterionReviewers = new Set(
          criterionRows.map((row) => row.reviewerId),
        );
        const criterionCounts = reviewerCounts(criterionReviewers, reviewerMap);
        if (value.ratingCount === 0) {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              question,
              criterion: value.criterion,
              code: 'NO_REVIEW_RATINGS',
              severity: 'blocking',
              message: `${value.criterion} has no numeric review ratings.`,
            }),
          );
        } else {
          if (criterionReviewers.size >= input.policy.minimumUniqueReviewers) {
            fullyCoveredCriteria += 1;
          }
          if (
            criterionCounts.independent >= input.policy.minimumUniqueReviewers
          ) {
            independentlyCoveredCriteria += 1;
          }
          if (
            criterionCounts.independent < input.policy.minimumUniqueReviewers
          ) {
            issues.push(
              createStableReviewIssue({
                campaignId: input.manifest.id,
                question,
                criterion: value.criterion,
                code: 'INSUFFICIENT_REVIEWERS',
                severity: 'blocking',
                message: `${value.criterion} has ${criterionCounts.independent} independent unconflicted reviewers; ${input.policy.minimumUniqueReviewers} are required by project policy.`,
              }),
            );
          }
          if (
            value.value !== undefined &&
            value.value < input.policy.flagBelowAikenV
          ) {
            issues.push(
              createStableReviewIssue({
                campaignId: input.manifest.id,
                question,
                criterion: value.criterion,
                code: 'AIKEN_BELOW_PROJECT_FLAG',
                severity: 'requires-discussion',
                message: `${value.criterion} Aiken's V is below the project discussion flag of ${input.policy.flagBelowAikenV.toFixed(2)}.`,
                evidence: { aikenV: value.value },
              }),
            );
          }
        }
        for (const row of criterionRows.filter(
          (entry) =>
            entry.rating !== undefined &&
            entry.rating <= input.policy.lowRatingAtOrBelow,
        )) {
          const blocking = input.policy.blockingCriteria.includes(
            value.criterion,
          );
          const specialCode =
            value.criterion === 'factual-accuracy'
              ? 'FACTUAL_ACCURACY_CONCERN'
              : value.criterion === 'image-rights'
                ? 'IMAGE_RIGHTS_CONCERN'
                : 'LOW_INDIVIDUAL_RATING';
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              question,
              criterion: value.criterion,
              reviewerId: row.reviewerId,
              code: specialCode,
              severity: blocking ? 'blocking' : 'requires-discussion',
              message: `${row.reviewerId} rated ${value.criterion} ${row.rating}.`,
              evidence: { rating: row.rating },
            }),
          );
        }
      }
      for (const row of commentRows) {
        issues.push(
          createStableReviewIssue({
            campaignId: input.manifest.id,
            question,
            criterion: row.criterion,
            reviewerId: row.reviewerId,
            code: 'REVIEWER_COMMENT',
            severity: 'requires-discussion',
            message: `${row.reviewerId} supplied a qualitative comment.`,
            evidence: { comment: row.comment },
          }),
        );
      }
      for (const reviewerId of new Set(questionRows.map((row) => row.reviewerId))) {
        const reviewer = reviewerMap.get(reviewerId);
        if (!reviewer) continue;
        if (!reviewer.independentReviewAttestation) {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              question,
              reviewerId,
              code: 'REVIEWER_INDEPENDENCE_NOT_ATTESTED',
              severity: 'blocking',
              message: `${reviewerId} has not attested independent review.`,
            }),
          );
        }
        if (reviewer.conflictOfInterest.status === 'declared') {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              question,
              reviewerId,
              code: 'REVIEWER_CONFLICT_DECLARED',
              severity: 'requires-discussion',
              message: `${reviewerId} declared a conflict of interest.`,
            }),
          );
        }
      }
      const sortedIssues = sortReviewIssues(issues);
      const hasRatingsOrComments = ratingRows.length > 0 || commentRows.length > 0;
      const incomplete =
        independentlyCoveredCriteria < question.applicableCriteria.length;
      const state = !hasRatingsOrComments
        ? 'not-started'
        : incomplete
          ? 'incomplete'
          : sortedIssues.length > 0
            ? 'requires-resolution'
            : 'ready-for-human-decision';
      return {
        questionId: question.questionId,
        questionVersion: question.questionVersion,
        questionHash: question.questionHash,
        coverage: {
          applicableCriteria: question.applicableCriteria.length,
          ratedCriteria: criterionValues.filter((value) => value.ratingCount > 0)
            .length,
          fullyCoveredCriteria,
          uniqueReviewers: reviewerIds.size,
          independentReviewers: counts.independent,
          conflictedReviewers: counts.conflicted,
        },
        overallContentValidity: criterionValues.find(
          (value) => value.criterion === 'overall-content-validity',
        ),
        criterionValues,
        ratings: ratingRows,
        comments: commentRows,
        issues: sortedIssues,
        state,
      };
    },
  );

  const allIssues = questions.flatMap((question) => question.issues);
  const stateCount = (state: QuestionReviewAnalysis['state']): number =>
    questions.filter((question) => question.state === state).length;
  const totalReviewers = new Set(
    input.submissions.map((submission) => submission.reviewerId),
  );
  const reviewerSummary = reviewerCounts(totalReviewers, reviewerMap);
  return {
    schemaVersion: 1,
    campaignId: input.manifest.id,
    bankId: input.manifest.bankId,
    bankHash: input.manifest.bankHash,
    policy: { id: input.policy.id, version: input.policy.version },
    questions,
    summary: {
      totalQuestions: questions.length,
      notStarted: stateCount('not-started'),
      incomplete: stateCount('incomplete'),
      requiresResolution: stateCount('requires-resolution'),
      readyForHumanDecision: stateCount('ready-for-human-decision'),
      totalIssues: {
        blocking: allIssues.filter((issue) => issue.severity === 'blocking')
          .length,
        'requires-discussion': allIssues.filter(
          (issue) => issue.severity === 'requires-discussion',
        ).length,
        informational: allIssues.filter(
          (issue) => issue.severity === 'informational',
        ).length,
      },
      reviewerCoverage: {
        totalReviewers: totalReviewers.size,
        independentReviewers: reviewerSummary.independent,
        conflictedReviewers: reviewerSummary.conflicted,
      },
      criterionCoverage: {
        applicable: questions.reduce(
          (sum, question) => sum + question.coverage.applicableCriteria,
          0,
        ),
        rated: questions.reduce(
          (sum, question) => sum + question.coverage.ratedCriteria,
          0,
        ),
        fullyCovered: questions.reduce(
          (sum, question) => sum + question.coverage.fullyCoveredCriteria,
          0,
        ),
        independentlyCovered: questions.reduce(
          (sum, question) =>
            sum +
            question.criterionValues.filter((value) => {
              const rows = question.ratings.filter(
                (row) => row.criterion === value.criterion,
              );
              return (
                reviewerCounts(
                  new Set(rows.map((row) => row.reviewerId)),
                  reviewerMap,
                ).independent >= input.policy.minimumUniqueReviewers
              );
            }).length,
          0,
        ),
      },
    },
  };
}
