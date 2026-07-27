import { GradeSummary } from '@/components/assessment/review/GradeSummary';
import { QuestionReviewCard } from '@/components/assessment/review/QuestionReviewCard';
import type { ReactNode } from 'react';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { ClientView } from '@/lib/navigation/clientRoute';
import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import type { GradingIssue } from '@/lib/assessment/grading/types';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionIssue, SessionResult } from '@/lib/assessment/session/types';
import type { AssessmentResultSnapshot } from '@/lib/storage/schemas';

type ControlledAssessmentResultExperience = {
  warning: ReactNode;
  landingView: ClientView;
  landingResourceId: string;
  experienceName: string;
  resultTitle: string;
};

export type ControlledAssessmentResultsProps = {
  resultResult: SessionResult<AssessmentResultSnapshot>;
  registry: QuestionRegistry;
  go: GoToRoute;
  experience: ControlledAssessmentResultExperience;
};

function ResultIntegrityError({
  issues,
  go,
  experience,
}: {
  issues: Array<SessionIssue | GradingIssue>;
  go: GoToRoute;
  experience: ControlledAssessmentResultExperience;
}) {
  return (
    <div className="pilot-page">
      {experience.warning}
      <section className="pilot-recovery">
        <h1>Assessment result integrity check failed</h1>
        <p>
          This saved result cannot be displayed as trusted feedback. No score
          has been fabricated or substituted.
        </p>
        <details>
          <summary>Technical details</summary>
          <ul>{issues.map((issue) => (
            <li key={`${issue.code}-${issue.path ?? issue.message}`}>
              <code>{issue.code}</code>: {issue.message}
            </li>
          ))}</ul>
        </details>
        <button className="secondary" onClick={() => go(experience.landingView, experience.landingResourceId)} type="button">
          Return to {experience.experienceName}
        </button>
      </section>
    </div>
  );
}

export function ControlledAssessmentResults({
  resultResult,
  registry,
  go,
  experience,
}: ControlledAssessmentResultsProps) {
  if (!resultResult.ok) {
    return <ResultIntegrityError go={go} issues={resultResult.issues} experience={experience} />;
  }
  const result = resultResult.value;
  const graded = gradeAssessmentResult({ result, registry });
  if (!graded.ok) {
    return <ResultIntegrityError go={go} issues={graded.issues} experience={experience} />;
  }

  const questionMap = new Map(registry.questionIds().map((id) => [id, registry.get(id)]));
  return (
    <div className="pilot-results-page">
      <button className="back" onClick={() => go(experience.landingView, experience.landingResourceId)} type="button">
        ← Back to {experience.experienceName}
      </button>
      {experience.warning}
      <GradeSummary report={graded.value} title={experience.resultTitle} />
      <section className="pilot-review-section">
        <h2>Instructional review</h2>
        <p>Questions are shown in the exact order used for this attempt.</p>
        <div className="pilot-review-list">
          {result.orderedQuestionIds.map((questionId, index) => {
            const question = questionMap.get(questionId);
            const grade = graded.value.questionGrades[questionId];
            return question && grade ? (
              <QuestionReviewCard
                grade={grade}
                index={index}
                key={questionId}
                question={question}
                response={result.responses[questionId]}
              />
            ) : null;
          })}
        </div>
      </section>
    </div>
  );
}
