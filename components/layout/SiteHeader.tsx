import type { GoToRoute } from '@/hooks/useClientRoute';

export function SiteHeader({ go }: { go: GoToRoute }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => go('home')} aria-label="Optometry Study Hub home">
        <span className="brand-mark" aria-hidden="true"><i /></span>
        <span><b>OPTOMETRY</b><small>Study Hub</small></span>
      </button>
      <span className="device-note">Private study progress · saved on device</span>
    </header>
  );
}
