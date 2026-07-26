export type ReviewCriterion = { id: string; label: string; description: string };
export type ReviewPackRow = { bankId: string; questionId: string; questionVersion: number; sectionId: string; objectiveId: string; format: string; bloomLevel: string; difficulty: string; criterion: string; reviewerId: string; rating: string; comment: string };
export type AikenRating = Omit<ReviewPackRow, 'rating'> & { rating: number };
export type AikenValue = { questionId: string; criterion: string; numerator: number; denominator: number; value: number; displayValue: string; reviewerCount: number; minimumRating: number; maximumRating: number; status: 'complete' | 'needs-review' };
export type ReviewIssue = { code: string; message: string; row?: number };
