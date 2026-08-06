import type { GoToRoute } from '@/hooks/useClientRoute';
import { useAnalyticsPrivacy } from '@/components/analytics/AnalyticsProvider';

export function SiteFooter({ go }: { go: GoToRoute }) {
  const openAnalyticsPrivacy = useAnalyticsPrivacy();
  return (
    <footer>
      <p>Optometry Study Hub · Progress stays on this device.</p>
      <nav aria-label="Footer navigation">
        <button className="text-button" onClick={() => go('home')}>Home</button>
        <button className="text-button" onClick={() => go('practice-hub')}>Practice</button>
        <button className="text-button" onClick={() => go('progress')}>Progress</button>
        <button className="text-button privacy-analytics-button" onClick={openAnalyticsPrivacy}>Privacy &amp; analytics</button>
      </nav>
    </footer>
  );
}
