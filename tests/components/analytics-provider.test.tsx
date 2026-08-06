// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsProvider, useAnalyticsPrivacy } from '@/components/analytics/AnalyticsProvider';
import { ANALYTICS_CONSENT_KEY, GA_SCRIPT_ID } from '@/lib/analytics/config';

function PrivacyButton() {
  const open = useAnalyticsPrivacy();
  return <button onClick={open}>Privacy &amp; analytics</button>;
}

beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = '';
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('analytics consent interface', () => {
  it('offers equal accept and decline actions without loading GA first', async () => {
    const user = userEvent.setup();
    render(<AnalyticsProvider route={{ view: 'home', moduleId: '' }}><div>Site</div></AnalyticsProvider>);
    expect(screen.getByRole('button', { name: 'Accept analytics' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Decline analytics' })).toBeVisible();
    expect(document.getElementById(GA_SCRIPT_ID)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Accept analytics' }));
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('granted');
    expect(document.getElementById(GA_SCRIPT_ID)).toBeInstanceOf(HTMLScriptElement);
  });

  it('persists decline without loading the analytics script', async () => {
    const user = userEvent.setup();
    render(<AnalyticsProvider route={{ view: 'home', moduleId: '' }}><div>Site</div></AnalyticsProvider>);
    await user.click(screen.getByRole('button', { name: 'Decline analytics' }));
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('denied');
    expect(document.getElementById(GA_SCRIPT_ID)).toBeNull();
  });

  it('opens from the persistent control, supports Escape and restores focus', async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'denied');
    const user = userEvent.setup();
    render(<AnalyticsProvider route={{ view: 'home', moduleId: '' }}><PrivacyButton /></AnalyticsProvider>);
    const trigger = screen.getByRole('button', { name: 'Privacy & analytics' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Privacy & analytics' })).toBeVisible();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('records one page view per distinct routed path after acceptance', async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
    const { rerender } = render(<AnalyticsProvider route={{ view: 'home', moduleId: '' }}><div /></AnalyticsProvider>);
    await waitFor(() => {
      const events = ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? [])
        .filter(([command]) => command === 'event');
      expect(events).toHaveLength(1);
    });
    rerender(<AnalyticsProvider route={{ view: 'home', moduleId: '' }}><div /></AnalyticsProvider>);
    window.history.pushState({}, '', '/study/ocular-adnexa');
    rerender(<AnalyticsProvider route={{ view: 'study', moduleId: 'ocular-adnexa' }}><div /></AnalyticsProvider>);
    await waitFor(() => {
      const events = ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? [])
        .filter(([command]) => command === 'event');
      expect(events.map(([, name]) => name)).toEqual(['page_view', 'page_view', 'study_module_open']);
    });
  });
});
