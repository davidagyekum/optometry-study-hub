'use client';

import { useEffect, useState } from 'react';
import {
  buildClientPath,
  parseClientRoute,
  type ClientRoute,
  type ClientView,
} from '@/lib/navigation/clientRoute';

const HOME_ROUTE: ClientRoute = { view: 'home', moduleId: '' };

export function useClientRoute() {
  const [route, setRoute] = useState<ClientRoute>(HOME_ROUTE);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRoute(parseClientRoute(window.location.pathname));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parseClientRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (view: ClientView, moduleId = '') => {
    const nextRoute = { view, moduleId };
    window.history.pushState({}, '', buildClientPath(nextRoute));
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { route, go };
}

export type GoToRoute = ReturnType<typeof useClientRoute>['go'];
