import type { ClientRoute } from '@/lib/navigation/clientRoute';

const SITE_TITLE = 'Optometry Study Hub';

export type RouteIdentityContext = {
  courseTitle?: string;
  moduleTitle?: string;
  controlledKind?: 'hvp' | 'aqueous' | 'unknown';
  available?: boolean;
  resultAvailable?: boolean;
};

export function documentTitleForRoute(
  route: ClientRoute,
  context: RouteIdentityContext = {},
): string {
  const suffix = (title: string) => `${title} | ${SITE_TITLE}`;
  if (route.view === 'home') return SITE_TITLE;
  if (route.view === 'practice-hub') return suffix('Practice Hub');
  if (route.view === 'progress') {
    return suffix(context.moduleTitle
      ? `${context.moduleTitle} Progress`
      : 'Progress Hub');
  }
  if (route.view === 'course') {
    return suffix(context.courseTitle ?? 'Course not found');
  }
  if (route.view === 'study') {
    return suffix(context.moduleTitle ? `${context.moduleTitle} Notes` : 'Study module not found');
  }
  if (route.view === 'quiz') {
    return suffix(context.moduleTitle ? `${context.moduleTitle} Legacy Quiz` : 'Quiz unavailable');
  }
  if (route.view === 'results') {
    return suffix(context.moduleTitle ? `${context.moduleTitle} Legacy Results` : 'Results unavailable');
  }
  if (route.view === 'practice') {
    return suffix(context.available === false
      ? 'Curated Practice Unavailable'
      : 'HVP Curated Practice');
  }
  if (route.view === 'assessment') {
    if (context.available === false) return suffix('Assessment Unavailable');
    return suffix(context.controlledKind === 'hvp'
      ? 'HVP Practice Session'
      : 'Assessment Session');
  }
  if (route.view === 'assessment-result') {
    if (context.resultAvailable === false) return suffix('Assessment Recovery');
    return suffix(context.controlledKind === 'hvp'
      ? 'HVP Practice Result'
      : 'Assessment Result');
  }
  if (route.view === 'pilot') {
    return suffix(context.available === false
      ? 'Aqueous Pilot Unavailable'
      : 'Aqueous Assessment Pilot');
  }
  return suffix('Page not found');
}
