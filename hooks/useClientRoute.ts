'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  buildClientPath,
  parseClientRoute,
  type ClientRoute,
  type ClientView,
} from '@/lib/navigation/clientRoute';

const HOME_ROUTE: ClientRoute = { view: 'home', moduleId: '' };

export function useClientRoute() {
  const [route, setRoute] = useState<ClientRoute>(HOME_ROUTE);
  const [focusRevision, setFocusRevision] = useState(0);
  const commitRoute = useCallback((nextRoute: ClientRoute, focus: boolean) => {
    setRoute(nextRoute);
    if (focus) setFocusRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      commitRoute(parseClientRoute(window.location.pathname), false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [commitRoute]);

  useEffect(() => {
    const onPop = () => commitRoute(parseClientRoute(window.location.pathname), true);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [commitRoute]);

  useEffect(() => {
    if (focusRevision === 0) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById('main-content');
      main?.focus({ preventScroll: true });
      main?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRevision]);

  const go = (view: ClientView, moduleId = '') => {
    const nextRoute = { view, moduleId };
    window.history.pushState({}, '', buildClientPath(nextRoute));
    commitRoute(nextRoute, true);
  };

  return { route, go };
}

export type GoToRoute = ReturnType<typeof useClientRoute>['go'];
