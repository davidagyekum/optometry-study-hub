export type ClientView =
  | 'home'
  | 'course'
  | 'study'
  | 'quiz'
  | 'results'
  | 'pilot'
  | 'assessment'
  | 'assessment-result';

export type ClientRoute = {
  view: ClientView;
  moduleId: string;
};

const ROUTED_VIEWS: ClientView[] = [
  'course', 'study', 'quiz', 'results', 'pilot', 'assessment', 'assessment-result',
];

export function parseClientRoute(pathname: string): ClientRoute {
  const cleanPath = pathname.split(/[?#]/, 1)[0];
  const parts = cleanPath.split('/').filter(Boolean);
  const view = parts[0] as ClientView | undefined;
  if (view && ROUTED_VIEWS.includes(view)) {
    return { view, moduleId: parts[1] ?? '' };
  }
  return { view: 'home', moduleId: '' };
}

export function buildClientPath(route: ClientRoute): string {
  return route.view === 'home' ? '/' : `/${route.view}/${route.moduleId}`;
}
