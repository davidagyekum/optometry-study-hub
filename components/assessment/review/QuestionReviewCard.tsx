import { ResponseSummary } from '@/components/assessment/review/ResponseSummary';
import type { QuestionGradeOutcome } from '@/lib/assessment/grading/types';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import type { PersistedResponse } from '@/lib/storage/schemas';

const STATUS_LABEL = {
  correct: 'Correct',
  partial: 'Partial',
  incorrect: 'Incorrect',
  unanswered: 'Unanswered',
  manual_required: 'Manual review',
} as const;

export function QuestionReviewCard({
  index,
  question,
  response,
  grade,
}: {
  index: number;
  question: AssessmentQuestion;
  response?: PersistedResponse;
  grade: QuestionGradeOutcome;
}) {
  return (
    <details className={`pilot-review-card ${grade.status}`}>
      <summary>
        <span>Question {index + 1}</span>
        <strong>{STATUS_LABEL[grade.status]}</strong>
        <small>{question.format.replaceAll('_', ' ')}</small>
        <b>{grade.score === null ? 'Manual' : `${grade.score} / ${grade.maxScore}`}</b>
      </summary>
      <div className="pilot-review-body">
        <h3>{question.stem}</h3>
        <ResponseSummary question={question} response={response} />
        <p className="pilot-explanation"><strong>Explanation</strong>{question.explanation}</p>
        <a href={`/study/${question.moduleId}#${question.noteAnchor}`}>
          Review related notes
        </a>
      </div>
    </details>
  );
}
