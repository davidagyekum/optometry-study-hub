import type { GoToRoute } from '@/hooks/useClientRoute';

export function SiteFooter({ go }: { go: GoToRoute }) {
  return (
    <footer>
      <p>Optometry Study Hub · Progress stays on this device.</p>
      <button className="text-button" onClick={() => go('home')}>All courses</button>
    </footer>
  );
}
