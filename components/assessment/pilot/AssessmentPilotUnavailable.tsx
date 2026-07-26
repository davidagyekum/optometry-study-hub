import type { GoToRoute } from '@/hooks/useClientRoute';

export function AssessmentPilotUnavailable({ go }: { go: GoToRoute }) {
  return (
    <section className="pilot-unavailable">
      <h1>Experimental assessment unavailable</h1>
      <p>
        The mixed-format assessment pilot is disabled for this build. Your notes
        and existing 50-question course-review quizzes are still available.
      </p>
      <button className="primary" onClick={() => go('home')} type="button">
        Return home
      </button>
    </section>
  );
}
