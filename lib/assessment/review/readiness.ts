import type {
  BankReviewAnalysis,
  QuestionReviewAnalysis,
  ReviewIssueResolution,
} from './campaignTypes';
import { unresolvedReviewIssues } from './issueResolutions';

export function applyReviewResolutions(
  analysis: BankReviewAnalysis,
  resolutions: ReviewIssueResolution[],
): BankReviewAnalysis {
  const questions = analysis.questions.map((question) => {
    const unresolved = unresolvedReviewIssues(question.issues, resolutions);
    const complete =
      question.coverage.applicableCriteria ===
      question.coverage.fullyCoveredCriteria;
    const state: QuestionReviewAnalysis['state'] =
      question.ratings.length === 0 && question.comments.length === 0
        ? 'not-started'
        : !complete
          ? 'incomplete'
          : unresolved.length > 0
            ? 'requires-resolution'
            : 'ready-for-human-decision';
    return { ...question, state };
  });
  const stateCount = (state: QuestionReviewAnalysis['state']): number =>
    questions.filter((question) => question.state === state).length;
  return {
    ...analysis,
    questions,
    summary: {
      ...analysis.summary,
      notStarted: stateCount('not-started'),
      incomplete: stateCount('incomplete'),
      requiresResolution: stateCount('requires-resolution'),
      readyForHumanDecision: stateCount('ready-for-human-decision'),
    },
  };
}

export function everyQuestionReady(analysis: BankReviewAnalysis): boolean {
  return analysis.questions.every(
    (question) => question.state === 'ready-for-human-decision',
  );
}
