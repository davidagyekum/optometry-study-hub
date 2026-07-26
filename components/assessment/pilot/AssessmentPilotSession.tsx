'use client';

import { useEffect, useRef, useState } from 'react';
import { PilotActionAlert } from '@/components/assessment/pilot/PilotActionAlert';
import { PilotWarning } from '@/components/assessment/pilot/PilotWarning';
import { QuestionNavigator } from '@/components/assessment/pilot/QuestionNavigator';
import { SessionProgress } from '@/components/assessment/pilot/SessionProgress';
import { SubmissionSummary } from '@/components/assessment/pilot/SubmissionSummary';
import { AssessmentQuestionRenderer } from '@/components/assessment/renderers/AssessmentQuestionRenderer';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { validateAqueousPilotAttempt } from '@/lib/assessment/pilot/compatibility';
import { getAttemptQuestionState } from '@/lib/assessment/session/draftResponses';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionIssue, SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentDraftResponse,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

function formatLabel(format: string): string {
  return format.split('_').map((word) => (
    `${word.charAt(0).toUpperCase()}${word.slice(1)}`
  )).join(' ');
}

function scrollingBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

export function AssessmentPilotSession({
  attemptResult,
  registry,
  go,
  onUpdateDraft,
  onClear,
  onMove,
  onToggleFlag,
  onDiscard,
  onSubmit,
}: {
  attemptResult: SessionResult<AssessmentAttemptSnapshot>;
  registry: QuestionRegistry;
  go: GoToRoute;
  onUpdateDraft: (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
    draft: AssessmentDraftResponse,
  ) => SessionResult<AssessmentAttemptSnapshot>;
  onClear: (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
  ) => SessionResult<AssessmentAttemptSnapshot>;
  onMove: (
    attempt: AssessmentAttemptSnapshot,
    index: number,
  ) => SessionResult<AssessmentAttemptSnapshot>;
  onToggleFlag: (
    attempt: AssessmentAttemptSnapshot,
    questionId: string,
  ) => SessionResult<AssessmentAttemptSnapshot>;
  onDiscard: (attemptId: string) => SessionResult<unknown>;
  onSubmit: (attemptId: string) => SessionResult<AssessmentResultSnapshot>;
}) {
  const [validationIssues, setValidationIssues] = useState<SessionIssue[]>([]);
  const [controllerIssues, setControllerIssues] = useState<SessionIssue[]>([]);
  const [discardIssues, setDiscardIssues] = useState<SessionIssue[]>([]);
  const [reviewingSubmission, setReviewingSubmission] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const attempt = attemptResult.ok ? attemptResult.value : undefined;
  const resolved = attempt ? validateAqueousPilotAttempt(attempt, registry) : undefined;
  const currentIndex = attempt?.currentIndex;

  useEffect(() => {
    if (currentIndex === undefined) return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({
      block: 'start',
      behavior: scrollingBehavior(),
    });
  }, [currentIndex]);

  if (!attemptResult.ok || !attempt || !resolved || !resolved.ok) {
    const compatibilityIssues: SessionIssue[] = !attemptResult.ok
      ? attemptResult.issues
      : resolved && !resolved.ok
        ? resolved.issues
        : [{
          code: 'ATTEMPT_NOT_FOUND',
          message: 'The requested pilot attempt is unavailable.',
        }];
    return (
      <div className="pilot-page">
        <PilotWarning />
        <section className="pilot-recovery">
          <h1>Pilot attempt needs attention</h1>
          <p>
            The saved attempt could not be safely resumed. It was not repaired or replaced.
          </p>
          <details>
            <summary>Technical details</summary>
            <ul>
              {compatibilityIssues.map((issue) => (
                <li key={`${issue.code}-${issue.path ?? issue.message}`}>
                  <code>{issue.code}</code>: {issue.message}
                </li>
              ))}
            </ul>
          </details>
          <div>
            <button className="secondary" onClick={() => go('pilot', 'aqueous-vitreous')} type="button">
              Return to pilot
            </button>
            {attempt ? (
              <button
                className="text-button danger"
                onClick={() => {
                  if (window.confirm('Discard this broken pilot attempt?')) {
                    const result = onDiscard(attempt.id);
                    setDiscardIssues(result.ok ? [] : result.issues);
                    if (result.ok) go('pilot', 'aqueous-vitreous');
                  }
                }}
                type="button"
              >
                Discard saved attempt
              </button>
            ) : null}
          </div>
          <PilotActionAlert
            issues={discardIssues}
            title="The saved attempt could not be discarded."
          />
        </section>
      </div>
    );
  }

  const question = resolved.value.questions[attempt.currentIndex];
  const questionId = attempt.orderedQuestionIds[attempt.currentIndex];
  const states = attempt.orderedQuestionIds.map(
    (id) => getAttemptQuestionState(attempt, id),
  );
  const answered = states.filter((state) => state === 'answered').length;
  const inProgress = states.filter((state) => state === 'in_progress').length;
  const unanswered = states.filter((state) => state === 'unanswered').length;
  const hasOpenResponse = resolved.value.questions.some(
    (candidate) => (
      candidate.format === 'open_response'
      && attempt.responses[candidate.id]?.format === 'open_response'
    ),
  );

  const captureValidation = (result: SessionResult<unknown>) => {
    setValidationIssues(result.ok ? [] : result.issues);
  };
  const captureController = (result: SessionResult<unknown>) => {
    setControllerIssues(result.ok ? [] : result.issues);
  };

  return (
    <div className="pilot-session-page">
      <PilotWarning />
      <SessionProgress
        answered={answered}
        flagged={attempt.flags.length}
        inProgress={inProgress}
        total={attempt.orderedQuestionIds.length}
      />
      <div className="pilot-session-grid">
        <QuestionNavigator
          attempt={attempt}
          onNavigate={(index) => captureController(onMove(attempt, index))}
        />
        <section className="pilot-question-card">
          <div className="pilot-question-meta">
            <span>Question {attempt.currentIndex + 1} of {attempt.orderedQuestionIds.length}</span>
            <span>{formatLabel(question.format)}</span>
            <button
              className={attempt.flags.includes(questionId) ? 'flag active' : 'flag'}
              onClick={() => captureController(onToggleFlag(attempt, questionId))}
              type="button"
            >
              {attempt.flags.includes(questionId) ? 'Unflag question' : 'Flag question'}
            </button>
          </div>
          <h1 ref={headingRef} tabIndex={-1}>{question.stem}</h1>
          <details className="pilot-metadata">
            <summary>Question metadata</summary>
            <p>Bloom level: {question.bloomLevel}. Difficulty: {question.difficulty}.</p>
          </details>
          <AssessmentQuestionRenderer
            descriptionId={`${question.id}-pilot-context`}
            draft={attempt.draftResponses?.[questionId]}
            onClear={() => captureValidation(onClear(attempt, questionId))}
            onDraftChange={(draft) => captureValidation(onUpdateDraft(attempt, questionId, draft))}
            presentationOrder={attempt.optionOrder[questionId]}
            question={question}
            response={attempt.responses[questionId]}
            validationMessage={validationIssues[0]?.message}
          />
          <p className="sr-only" id={`${question.id}-pilot-context`}>
            Draft pilot question. Correctness is shown only after submission.
          </p>
          <div className="pilot-question-actions">
            <button
              className="secondary"
              disabled={attempt.currentIndex === 0}
              onClick={() => captureController(onMove(attempt, attempt.currentIndex - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="secondary"
              disabled={attempt.currentIndex === attempt.orderedQuestionIds.length - 1}
              onClick={() => captureController(onMove(attempt, attempt.currentIndex + 1))}
              type="button"
            >
              Next
            </button>
            <button
              className="text-button"
              onClick={() => go('pilot', 'aqueous-vitreous')}
              type="button"
            >
              Save and exit
            </button>
            <button
              className="primary"
              onClick={() => {
                setControllerIssues([]);
                setReviewingSubmission(true);
              }}
              ref={submitButtonRef}
              type="button"
            >
              Submit
            </button>
          </div>
          {reviewingSubmission ? (
            <SubmissionSummary
              answered={answered}
              flagged={attempt.flags.length}
              hasOpenResponse={hasOpenResponse}
              inProgress={inProgress}
              onCancel={() => {
                setReviewingSubmission(false);
                window.setTimeout(() => submitButtonRef.current?.focus(), 0);
              }}
              onConfirm={() => captureController(onSubmit(attempt.id))}
              unanswered={unanswered}
            />
          ) : null}
          <PilotActionAlert issues={controllerIssues} />
        </section>
      </div>
    </div>
  );
}