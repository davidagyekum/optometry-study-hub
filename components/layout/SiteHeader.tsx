import type { GoToRoute } from '@/hooks/useClientRoute';
import type { ClientView } from '@/lib/navigation/clientRoute';

export function SiteHeader({ go, view }: { go: GoToRoute; view: ClientView }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => go('home')} aria-label="Optometry Study Hub home">
        <span className="brand-mark" aria-hidden="true"><i /></span>
        <span><b>OPTOMETRY</b><small>Study Hub</small></span>
      </button>
      <nav aria-label="Primary navigation" className="site-nav">
        <button aria-current={view === 'home' ? 'page' : undefined} onClick={() => go('home')}>Home</button>
        <button
          aria-current={view === 'practice-hub' || view === 'practice' ? 'page' : undefined}
          onClick={() => go('practice-hub')}
        >
          Practice
        </button>
        <button
          aria-current={view === 'progress' ? 'page' : undefined}
          onClick={() => go('progress')}
        >
          Progress
        </button>
      </nav>
      <span className="device-note">Private progress · saved on device</span>
    </header>
  );
}
