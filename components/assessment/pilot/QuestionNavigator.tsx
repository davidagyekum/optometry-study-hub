import type { AssessmentAttemptSnapshot } from '@/lib/storage/schemas';
import {
  getAttemptQuestionState,
  type AttemptQuestionState,
} from '@/lib/assessment/session/draftResponses';

const STATE_LABEL: Record<AttemptQuestionState, string> = {
  answered: 'Answered',
  in_progress: 'In progress',
  unanswered: 'Unanswered',
};

export function QuestionNavigator({
  attempt,
  onNavigate,
}: {
  attempt: AssessmentAttemptSnapshot;
  onNavigate: (index: number) => void;
}) {
  return (
    <nav className="pilot-navigator" aria-label="Pilot questions">
      <h2>Questions ({attempt.orderedQuestionIds.length})</h2>
      <ol>
        {attempt.orderedQuestionIds.map((questionId, index) => {
          const state = getAttemptQuestionState(attempt, questionId);
          const flagged = attempt.flags.includes(questionId);
          const current = attempt.currentIndex === index;
          const label = `Question ${index + 1}, ${STATE_LABEL[state].toLowerCase()}${flagged ? ', flagged' : ''}`;
          return (
            <li key={questionId}>
              <button
                aria-current={current ? 'step' : undefined}
                aria-label={label}
                className={`${state}${current ? ' current' : ''}${flagged ? ' flagged' : ''}`}
                onClick={() => onNavigate(index)}
                type="button"
              >
                <span>{index + 1}</span>
                <small>{STATE_LABEL[state]}</small>
                {flagged ? <b>Flagged</b> : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
