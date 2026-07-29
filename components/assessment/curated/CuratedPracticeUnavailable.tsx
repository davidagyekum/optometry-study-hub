import type { GoToRoute } from '@/hooks/useClientRoute';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';

export function CuratedPracticeUnavailable({
  go,
  summary,
}: {
  go: GoToRoute;
  summary?: CuratedExperienceSummary;
}) {
  return (
    <section className="pilot-unavailable">
      <h1>Curated practice unavailable</h1>
      {summary ? (
        <>
          <p>
            The {summary.courseCode} curated-practice feature is disabled for
            this build. {summary.title.replace(' curated practice', '')} notes
            and the existing 50-question quiz remain available.
          </p>
          <p>
            Saved curated-practice data remains on this device and will be
            available if the feature is re-enabled.
          </p>
          <button
            className="primary"
            onClick={() => go('study', summary.moduleId)}
            type="button"
          >
            Return to {summary.title.replace(' curated practice', '')} notes
          </button>
        </>
      ) : (
        <>
          <p>The requested curated-practice experience is unavailable.</p>
          <p>Saved data was not changed.</p>
          <button className="primary" onClick={() => go('practice-hub')} type="button">
            Return to Practice Hub
          </button>
        </>
      )}
    </section>
  );
}
