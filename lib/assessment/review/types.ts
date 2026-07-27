export type ReviewCriterion = { id: string; label: string; description: string };
export type ReviewPackRow = { bankId: string; questionId: string; questionVersion: number; questionHash: string; sectionId: string; objectiveId: string; format: string; bloomLevel: string; difficulty: string; criterion: string; reviewerId: string; rating: string; comment: string };
export type AikenRating = Omit<ReviewPackRow, 'rating'> & { rating: number };
export type AikenValue = {
  bankId: string;
  questionId: string;
  questionVersion: number;
  questionHash: string;
  criterion: string;
  numerator?: number;
  denominator?: number;
  value?: number;
  displayValue?: string;
  ratingCount: number;
  reviewerCount: number;
  minimumRating?: number;
  maximumRating?: number;
  status: 'unrated' | 'provisional' | 'complete' | 'needs-review';
};
export type ReviewCoverage = {
  applicableCriterionCount: number;
  ratedCriterionCount: number;
  unratedCriterionCount: number;
  uniqueReviewerCount: number;
  questionCount: number;
  questionsWithRatings: number;
};
export type AikenSummary = { values: AikenValue[]; questionValues: AikenValue[]; warnings: ReviewIssue[]; coverage: ReviewCoverage };
export type ReviewIssue = { code: string; message: string; row?: number };
