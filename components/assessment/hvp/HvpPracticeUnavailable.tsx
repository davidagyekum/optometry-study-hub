import type { GoToRoute } from '@/hooks/useClientRoute';

export function HvpPracticeUnavailable({ go }: { go: GoToRoute }) {
  return (
    <section className="pilot-unavailable">
      <h1>Curated practice unavailable</h1>
      <p>
        The OPT 374 curated-practice feature is disabled for this build.
        Human Visual Perception notes and the existing 50-question quiz remain available.
      </p>
      <button
        className="primary"
        onClick={() => go('study', 'human-visual-perception')}
        type="button"
      >
        Return to Human Visual Perception notes
      </button>
    </section>
  );
}
