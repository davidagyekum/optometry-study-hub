import type { GoToRoute } from '@/hooks/useClientRoute';

export function SiteFooter({ go }: { go: GoToRoute }) {
  return (
    <footer>
      <p>Optometry Study Hub · Progress stays on this device.</p>
      <nav aria-label="Footer navigation">
        <button className="text-button" onClick={() => go('home')}>Home</button>
        <button className="text-button" onClick={() => go('practice-hub')}>Practice</button>
        <button className="text-button" onClick={() => go('progress')}>Progress</button>
      </nav>
    </footer>
  );
}
