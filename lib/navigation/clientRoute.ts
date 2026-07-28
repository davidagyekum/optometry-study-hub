export type ClientView =
  | 'home'
  | 'practice-hub'
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
  'course', 'study', 'quiz', 'results', 'pilot', 'practice', 'assessment', 'assessment-result',
];

export function parseClientRoute(pathname: string): ClientRoute {
  const cleanPath = pathname.split(/[?#]/, 1)[0];
  const parts = cleanPath.split('/').filter(Boolean);
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
  return { view: 'home', moduleId: '' };
}

export function buildClientPath(route: ClientRoute): string {
  if (route.view === 'home') return '/';
  if (route.view === 'practice-hub') return '/practice';
  if (route.view === 'progress') {
    return route.moduleId ? `/progress/${route.moduleId}` : '/progress';
  }
  return `/${route.view}/${route.moduleId}`;
}
