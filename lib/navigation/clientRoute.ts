export type ClientView =
  | 'home'
  | 'not-found'
  | 'practice-hub'
  | 'legacy'
  | 'progress'
  | 'course'
  | 'study'
  | 'quiz'
  | 'results'
  | 'pilot'
  | 'practice'
  | 'assessment'
  | 'assessment-result';

export type ClientRoute = {
  view: ClientView;
  moduleId: string;
};

const ROUTED_VIEWS: ClientView[] = [
  'course', 'study', 'legacy', 'quiz', 'results', 'pilot', 'practice', 'assessment', 'assessment-result',
];

export function parseClientRoute(pathname: string): ClientRoute {
  const cleanPath = pathname.split(/[?#]/, 1)[0];
  const parts = cleanPath.split('/').filter(Boolean);
  if (parts.length === 0) {
    return { view: 'home', moduleId: '' };
  }
  if (parts[0] === 'practice' && parts.length === 1) {
    return { view: 'practice-hub', moduleId: '' };
  }
  if (parts[0] === 'progress') {
    return { view: 'progress', moduleId: parts[1] ?? '' };
  }
  const view = parts[0] as ClientView | undefined;
  if (view && ROUTED_VIEWS.includes(view)) {
    return { view, moduleId: parts[1] ?? '' };
  }
  return { view: 'not-found', moduleId: '' };
}

export function buildClientPath(route: ClientRoute): string {
  if (route.view === 'home') return '/';
  if (route.view === 'practice-hub') return '/practice';
  if (route.view === 'legacy' && !route.moduleId) return '/legacy';
  if (route.view === 'progress') {
    return route.moduleId ? `/progress/${route.moduleId}` : '/progress';
  }
  return `/${route.view}/${route.moduleId}`;
}
