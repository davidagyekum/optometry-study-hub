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
import type { ValidatedMergedReviewSubmissions } from './mergeSubmissions';
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

function isIndependentReviewer(reviewer?: ReviewerProfile): boolean {
  return Boolean(
    reviewer?.independentReviewAttestation &&
      reviewer.conflictOfInterest.status === 'none',
  );
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
    if (isIndependentReviewer(reviewer)) independent += 1;
  }
  return { independent, conflicted };
}

export function analyzeReviewCampaign(input: {
  manifest: ReviewCampaignManifest;
  merged: ValidatedMergedReviewSubmissions;
  policy: ContentReviewPolicy;
}): BankReviewAnalysis {
  const reviewerMap = new Map(
    input.manifest.reviewers.map((reviewer) => [reviewer.id, reviewer]),
  );
  const questions: QuestionReviewAnalysis[] = input.manifest.questions.map(
    (question) => {
      const questionRows = input.merged.submissions.filter(
        (submission) => submission.questionId === question.questionId,
      );
      const ratingRows = questionRows.filter(
        (submission) => submission.rating !== undefined,
      );
      const independentRatingRows = ratingRows.filter((submission) =>
        isIndependentReviewer(reviewerMap.get(submission.reviewerId)),
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
          independentRatingRows.filter((row) => row.criterion === criterion),
          input.policy,
        ),
      );
      const allReviewerCriterionValues = question.applicableCriteria.map(
        (criterion) =>
          aikenValue(
            input.manifest,
            question,
            criterion,
            ratingRows.filter((row) => row.criterion === criterion),
            input.policy,
          ),
      );
      const issues: StableReviewIssue[] = [];
      let fullyCoveredCriteria = 0;
      let independentlyCoveredCriteria = 0;
      for (const value of criterionValues) {
        const coverageRows = questionRows.filter(
          (row) => row.criterion === value.criterion,
        );
        const allCriterionRows = ratingRows.filter(
          (row) => row.criterion === value.criterion,
        );
        const independentCriterionRows = independentRatingRows.filter(
          (row) => row.criterion === value.criterion,
        );
        if (coverageRows.length === 0) {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              campaignHash: input.manifest.campaignHash,
              question,
              criterion: value.criterion,
              code: 'MISSING_REQUIRED_CRITERION',
              severity: 'blocking',
              message: `${value.criterion} is absent from merged coverage evidence.`,
            }),
          );
        }
        const allCriterionReviewers = new Set(
          allCriterionRows.map((row) => row.reviewerId),
        );
        const independentCriterionReviewers = new Set(
          independentCriterionRows.map((row) => row.reviewerId),
        );
        if (allCriterionReviewers.size >= input.policy.minimumUniqueReviewers) {
          fullyCoveredCriteria += 1;
        }
        if (
          independentCriterionReviewers.size >=
          input.policy.minimumUniqueReviewers
        ) {
          independentlyCoveredCriteria += 1;
        }
        if (value.ratingCount === 0) {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              campaignHash: input.manifest.campaignHash,
              question,
              criterion: value.criterion,
              code: 'NO_REVIEW_RATINGS',
              severity: 'blocking',
              message: `${value.criterion} has no independent unconflicted numeric review ratings.`,
            }),
          );
        } else {
          if (
            independentCriterionReviewers.size <
            input.policy.minimumUniqueReviewers
          ) {
            issues.push(
              createStableReviewIssue({
                campaignId: input.manifest.id,
                campaignHash: input.manifest.campaignHash,
                question,
                criterion: value.criterion,
                code: 'INSUFFICIENT_REVIEWERS',
                severity: 'blocking',
                message: `${value.criterion} has ${independentCriterionReviewers.size} independent unconflicted reviewers; ${input.policy.minimumUniqueReviewers} are required by project policy.`,
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
                campaignHash: input.manifest.campaignHash,
                question,
                criterion: value.criterion,
                code: 'AIKEN_BELOW_PROJECT_FLAG',
                severity: 'requires-discussion',
                message: `${value.criterion} independent-review Aiken's V is below the project discussion flag of ${input.policy.flagBelowAikenV.toFixed(2)}.`,
                evidence: { aikenV: value.value },
              }),
            );
          }
        }
        for (const row of allCriterionRows.filter(
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
              campaignHash: input.manifest.campaignHash,
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
            campaignHash: input.manifest.campaignHash,
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
      const independentlyComplete =
        independentlyCoveredCriteria === question.applicableCriteria.length;
      for (const reviewerId of new Set(questionRows.map((row) => row.reviewerId))) {
        const reviewer = reviewerMap.get(reviewerId);
        if (!reviewer) continue;
        if (!reviewer.independentReviewAttestation && !independentlyComplete) {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              campaignHash: input.manifest.campaignHash,
              question,
              reviewerId,
              code: 'REVIEWER_INDEPENDENCE_NOT_ATTESTED',
              severity: independentlyComplete
                ? 'requires-discussion'
                : 'blocking',
              message: `${reviewerId} has not attested independent review and is excluded from independent coverage.`,
            }),
          );
        }
        if (reviewer.conflictOfInterest.status === 'declared') {
          issues.push(
            createStableReviewIssue({
              campaignId: input.manifest.id,
              campaignHash: input.manifest.campaignHash,
              question,
              reviewerId,
              code: 'REVIEWER_CONFLICT_DECLARED',
              severity: 'requires-discussion',
              message: `${reviewerId} declared a conflict of interest and is excluded from independent coverage.`,
            }),
          );
        }
      }
      const sortedIssues = sortReviewIssues(issues);
      const hasRatingsOrComments = ratingRows.length > 0 || commentRows.length > 0;
      const state = !hasRatingsOrComments
        ? 'not-started'
        : !independentlyComplete
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
          independentlyCoveredCriteria,
          uniqueReviewers: reviewerIds.size,
          independentReviewers: counts.independent,
          conflictedReviewers: counts.conflicted,
        },
        overallContentValidity: criterionValues.find(
          (value) => value.criterion === 'overall-content-validity',
        ),
        criterionValues,
        allReviewerOverallContentValidity: allReviewerCriterionValues.find(
          (value) => value.criterion === 'overall-content-validity',
        ),
        allReviewerCriterionValues,
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
  const submittedReviewers = new Set(
    input.merged.submissions.map((submission) => submission.reviewerId),
  );
  const ratingReviewers = new Set(
    input.merged.submissions
      .filter((submission) => submission.rating !== undefined)
      .map((submission) => submission.reviewerId),
  );
  const commentingReviewers = new Set(
    input.merged.submissions
      .filter((submission) => Boolean(submission.comment))
      .map((submission) => submission.reviewerId),
  );
  const commentOnlyReviewers = new Set(
    [...commentingReviewers].filter(
      (reviewerId) => !ratingReviewers.has(reviewerId),
    ),
  );
  const reviewerSummary = reviewerCounts(submittedReviewers, reviewerMap);
  return {
    schemaVersion: 1,
    campaignId: input.manifest.id,
    campaignHash: input.manifest.campaignHash,
    bankId: input.manifest.bankId,
    bankHash: input.manifest.bankHash,
    mergedHash: input.merged.mergedHash,
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
      issueStatusCounts: {
        total: allIssues.length,
        resolved: 0,
        unresolved: allIssues.length,
      },
      reviewerCoverage: {
        registeredReviewers: input.manifest.reviewers.length,
        submittedReviewers: submittedReviewers.size,
        ratingReviewers: ratingReviewers.size,
        commentOnlyReviewers: commentOnlyReviewers.size,
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
            sum + question.coverage.independentlyCoveredCriteria,
          0,
        ),
      },
    },
  };
}
