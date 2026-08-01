'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PilotActionAlert } from '@/components/assessment/pilot/PilotActionAlert';
import { QuestionNavigator } from '@/components/assessment/pilot/QuestionNavigator';
import { SessionProgress } from '@/components/assessment/pilot/SessionProgress';
import { SubmissionSummary } from '@/components/assessment/pilot/SubmissionSummary';
import { AssessmentQuestionRenderer } from '@/components/assessment/renderers/AssessmentQuestionRenderer';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { ClientView } from '@/lib/navigation/clientRoute';
import { partitionPilotActionIssues } from '@/lib/assessment/pilot/issuePartition';
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

type ScopedValidation = {
  questionId: string;
  issues: SessionIssue[];
};

export type ControlledAttemptSelection = {
  candidates: AssessmentAttemptSnapshot[];
  compatibleAttempt?: AssessmentAttemptSnapshot;
  issues: SessionIssue[];
};

export type ControlledAssessmentExperience = {
  warning: ReactNode;
  landingView: ClientView;
  landingResourceId: string;
  experienceName: string;
  contextDescription: string;
};

export type ControlledAssessmentSessionProps = {
  attemptSelection: ControlledAttemptSelection;
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
  onReplace: (candidateIds: string[]) => SessionResult<AssessmentAttemptSnapshot>;
  onSubmit: (attemptId: string) => SessionResult<AssessmentResultSnapshot>;
  experience: ControlledAssessmentExperience;
};

export function ControlledAssessmentSession({
  attemptSelection,
  registry,
  go,
  onUpdateDraft,
  onClear,
  onMove,
  onToggleFlag,
  onDiscard,
  onReplace,
  onSubmit,
  experience,
}: ControlledAssessmentSessionProps) {
  const selectedAttempt = attemptSelection.compatibleAttempt;
  const [optimisticAttempt, setOptimisticAttempt] = useState<{
    source: AssessmentAttemptSnapshot;
    value: AssessmentAttemptSnapshot;
  }>();
  const [validation, setValidation] = useState<ScopedValidation>();
  const [controllerIssues, setControllerIssues] = useState<SessionIssue[]>([]);
  const [recoveryIssues, setRecoveryIssues] = useState<SessionIssue[]>([]);
  const [reviewingSubmission, setReviewingSubmission] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const attempt = optimisticAttempt && optimisticAttempt.source === selectedAttempt
    ? optimisticAttempt.value
    : selectedAttempt;
  const currentIndex = attempt?.currentIndex;

  useEffect(() => {
    if (currentIndex === undefined) return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({
      block: 'start',
      behavior: scrollingBehavior(),
    });
  }, [currentIndex]);

  if (!attempt) {
    const candidate = attemptSelection.candidates.length === 1
      ? attemptSelection.candidates[0]
      : undefined;
    const compatibilityIssues = attemptSelection.issues.length > 0
      ? attemptSelection.issues
      : [{
        code: 'ATTEMPT_NOT_FOUND' as const,
        message: 'The requested assessment attempt is unavailable.',
      }];
    return (
      <div className="pilot-page">
        {experience.warning}
        <section className="pilot-recovery">
          <h1>{experience.experienceName} attempt needs attention</h1>
          <p>
            The saved attempt could not be safely resumed. It remains available
            until you explicitly discard or replace it.
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
            <button className="secondary" onClick={() => go(experience.landingView, experience.landingResourceId)} type="button">
              Return to {experience.experienceName}
            </button>
            {candidate ? (
              <>
                <button
                  className="text-button danger"
                  onClick={() => {
                    if (window.confirm('Discard this incompatible saved attempt?')) {
                      const result = onDiscard(candidate.id);
                      setRecoveryIssues(result.ok ? [] : result.issues);
                      if (result.ok) go(experience.landingView, experience.landingResourceId);
                    }
                  }}
                  type="button"
                >
                  Discard saved attempt
                </button>
                <button
                  className="primary"
                  onClick={() => {
                    if (window.confirm(`Replace this attempt with a fresh ${experience.experienceName}?`)) {
                      const result = onReplace([candidate.id]);
                      setRecoveryIssues(result.ok ? [] : result.issues);
                    }
                  }}
                  type="button"
                >
                  Start a fresh {experience.experienceName}
                </button>
              </>
            ) : null}
          </div>
          <PilotActionAlert
            issues={recoveryIssues}
            title="The saved attempt could not be recovered."
          />
        </section>
      </div>
    );
  }

  const question = registry.get(attempt.orderedQuestionIds[attempt.currentIndex]);
  const questionId = attempt.orderedQuestionIds[attempt.currentIndex];
  if (!question) return null;
  const states = attempt.orderedQuestionIds.map(
    (id) => getAttemptQuestionState(attempt, id),
  );
  const answered = states.filter((state) => state === 'answered').length;
  const inProgress = states.filter((state) => state === 'in_progress').length;
  const unanswered = states.filter((state) => state === 'unanswered').length;
  const hasOpenResponse = attempt.orderedQuestionIds.some((id) => (
    registry.get(id)?.format === 'open_response'
    && attempt.responses[id]?.format === 'open_response'
  ));

  const captureQuestionAction = (
    originQuestionId: string,
    result: SessionResult<AssessmentAttemptSnapshot>,
  ) => {
    if (result.ok) {
      setOptimisticAttempt({
        source: selectedAttempt ?? result.value,
        value: result.value,
      });
      setValidation((current) => (
        current?.questionId === originQuestionId ? undefined : current
      ));
      setControllerIssues([]);
      return;
    }
    const partitioned = partitionPilotActionIssues(result.issues, originQuestionId);
    setValidation(partitioned.rendererIssues.length > 0
      ? { questionId: originQuestionId, issues: partitioned.rendererIssues }
      : undefined);
    setControllerIssues(partitioned.sessionIssues);
  };
  const captureAttemptAction = (
    result: SessionResult<AssessmentAttemptSnapshot>,
    clearValidation = false,
  ) => {
    setControllerIssues(result.ok ? [] : result.issues);
    if (result.ok) {
      setOptimisticAttempt({
        source: selectedAttempt ?? result.value,
        value: result.value,
      });
      if (clearValidation) setValidation(undefined);
    }
  };
  const captureController = (result: SessionResult<unknown>, clearValidation = false) => {
    setControllerIssues(result.ok ? [] : result.issues);
    if (result.ok && clearValidation) setValidation(undefined);
  };
  const visibleValidation = validation?.questionId === questionId
    ? validation.issues[0]
    : undefined;
  const validationId = `${question.id}-validation`;
  const describedBy = visibleValidation
    ? `${question.id}-pilot-context ${validationId}`
    : `${question.id}-pilot-context`;

  return (
    <div className="pilot-session-page">
      {experience.warning}
      <SessionProgress
        answered={answered}
        flagged={attempt.flags.length}
        inProgress={inProgress}
        total={attempt.orderedQuestionIds.length}
      />
      <div className="pilot-session-grid">
        <QuestionNavigator
          attempt={attempt}
          onNavigate={(index) => captureAttemptAction(onMove(attempt, index), true)}
        />
        <section className="pilot-question-card">
          <div className="pilot-question-meta">
            <span>Question {attempt.currentIndex + 1} of {attempt.orderedQuestionIds.length}</span>
            <span>{formatLabel(question.format)}</span>
            <button
              className={attempt.flags.includes(questionId) ? 'flag active' : 'flag'}
              onClick={() => captureAttemptAction(onToggleFlag(attempt, questionId))}
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
            descriptionId={describedBy}
            draft={attempt.draftResponses?.[questionId]}
            onClear={() => captureQuestionAction(
              questionId,
              onClear(attempt, questionId),
            )}
            onDraftChange={(draft) => captureQuestionAction(
              questionId,
              onUpdateDraft(attempt, questionId, draft),
            )}
            presentationOrder={attempt.optionOrder[questionId]}
            question={question}
            response={attempt.responses[questionId]}
          />
          <p className="sr-only" id={`${question.id}-pilot-context`}>
            {experience.contextDescription}
          </p>
          {visibleValidation ? (
            <p
              aria-live="polite"
              className="assessment-validation"
              id={validationId}
            >
              {visibleValidation.message}
            </p>
          ) : null}
          <div className="pilot-question-actions">
            <button
              className="secondary"
              disabled={attempt.currentIndex === 0}
              onClick={() => captureAttemptAction(
                onMove(attempt, attempt.currentIndex - 1),
                true,
              )}
              type="button"
            >
              Previous
            </button>
            {attempt.currentIndex < attempt.orderedQuestionIds.length - 1 ? (
              <button
                className="secondary"
                onClick={() => captureAttemptAction(
                  onMove(attempt, attempt.currentIndex + 1),
                  true,
                )}
                type="button"
              >
                Next
              </button>
            ) : (
              <button
                className="primary coral pilot-submit-button"
                onClick={() => {
                  setControllerIssues([]);
                  setReviewingSubmission(true);
                }}
                ref={submitButtonRef}
                type="button"
              >
                Review &amp; submit
              </button>
            )}
            <button
              className="text-button"
              onClick={() => go(experience.landingView, experience.landingResourceId)}
              type="button"
            >
              Save and exit
            </button>
            {attempt.currentIndex < attempt.orderedQuestionIds.length - 1 ? (
              <button
                className="primary coral pilot-submit-button"
                onClick={() => {
                  setControllerIssues([]);
                  setReviewingSubmission(true);
                }}
                ref={submitButtonRef}
                type="button"
              >
                Review &amp; submit
              </button>
            ) : null}
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
              submitLabel={`Submit ${experience.experienceName}`}
              unanswered={unanswered}
            />
          ) : null}
          <PilotActionAlert issues={controllerIssues} />
        </section>
      </div>
    </div>
  );
}
