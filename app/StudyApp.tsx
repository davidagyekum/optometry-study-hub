'use client';

import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { CourseView } from '@/components/course/CourseView';
import { HomeView } from '@/components/home/HomeView';
import { LegacyArchive } from '@/components/legacy/LegacyArchive';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PracticeHub } from '@/components/practice/PracticeHub';
import { ModuleProgressView } from '@/components/progress/ModuleProgressView';
import { ProgressHub } from '@/components/progress/ProgressHub';
import { AssessmentPilotUnavailable } from '@/components/assessment/pilot/AssessmentPilotUnavailable';
import { CuratedPracticeRouter } from '@/components/assessment/curated/CuratedPracticeRouter';
import { CuratedProgressPanel } from '@/components/progress/CuratedProgressPanel';
import { LegacyQuizView } from '@/components/quiz/LegacyQuizView';
import { LegacyResultsView } from '@/components/results/LegacyResultsView';
import { StudyView } from '@/components/study/StudyView';
import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { useClientRoute, type GoToRoute } from '@/hooks/useClientRoute';
import { useLegacyStore } from '@/hooks/useLegacyStore';
import { isAssessmentPilotEnabled } from '@/lib/assessment/pilot/config';
import {
  curatedExperienceRegistry,
  curatedExperienceSummaries,
  isCuratedExperienceEnabled,
} from '@/lib/assessment/curated/experienceRegistry';
import {
  resolveCuratedExperienceForControlledRoute,
  summaryForModule,
} from '@/lib/assessment/curated/resolveExperience';
import { controlledExperienceKind } from '@/lib/assessment/routing/controlledExperience';
import type { CourseSummary } from '@/lib/legacy/types';
import type { ClientView } from '@/lib/navigation/clientRoute';
import { documentTitleForRoute } from '@/lib/navigation/documentIdentity';
import { legacyRecommendations } from '@/lib/progress/recommendations';
import {
  courseResetConfirmation,
  moduleResetConfirmation,
  resetAssessmentModule,
  resetCourseStudyData,
} from '@/lib/storage/assessmentReset';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';
import { resetAllStudyData } from '@/lib/storage/store';

const CONTROLLED_VIEWS: ClientView[] = ['pilot', 'practice', 'assessment', 'assessment-result'];
const AssessmentPilotRouter = lazy(() => (
  import('@/components/assessment/pilot/AssessmentPilotRouter')
    .then((module) => ({ default: module.AssessmentPilotRouter }))
));

function AppFrame({
  children,
  go,
  view,
}: {
  children: ReactNode;
  go: GoToRoute;
  view: ClientView;
}) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <SiteHeader go={go} view={view} />
      <main className="app-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter go={go} />
    </div>
  );
}

export default function StudyApp() {
  const { route, go } = useClientRoute();
  const { store, setStore } = useLegacyStore();
  const pilotEnabled = isAssessmentPilotEnabled();
  const allCuratedExperiences = curatedExperienceSummaries();
  const curatedExperiences = allCuratedExperiences.filter(
    (experience) => experience.enabled,
  );
  const curatedEnabled = curatedExperiences.length > 0;
  const legacyRecommendationCandidates = legacyRecommendations(store);
  const isControlledView = CONTROLLED_VIEWS.includes(route.view);
  const routedAttempt = route.view === 'assessment'
    ? store.assessment.activeAttempts[route.moduleId]
    : undefined;
  const routedResult = route.view === 'assessment-result'
    ? store.assessment.results[route.moduleId]
    : undefined;
  const controlledBlueprint = routedAttempt?.blueprintId ?? routedResult?.blueprintId;
  const controlledCuratedExperience = resolveCuratedExperienceForControlledRoute(
    route.view,
    route.moduleId,
    controlledBlueprint,
  );
  const controlledKind = controlledExperienceKind(
    route.view,
    controlledBlueprint,
    route.moduleId,
  );

  const updateStore = (updater: (current: StoreV2) => StoreV2) => {
    setStore((current) => updater(current));
  };
  const activeModule = moduleMap.get(route.moduleId);
  const activeCourse = courses.find((course) => course.id === route.moduleId);
  const controlledAvailable = controlledCuratedExperience
    ? isCuratedExperienceEnabled(controlledCuratedExperience)
    : controlledKind === 'aqueous'
      ? pilotEnabled
      : false;

  useEffect(() => {
    document.title = documentTitleForRoute(route, {
      courseTitle: activeCourse?.title,
      moduleTitle: activeModule?.shortTitle ?? activeModule?.title,
      controlledKind,
      curatedSummary: controlledCuratedExperience?.summary,
      available: controlledAvailable,
      resultAvailable: Boolean(routedResult),
    });
  }, [
    activeCourse?.title,
    activeModule?.shortTitle,
    activeModule?.title,
    controlledAvailable,
    controlledKind,
    controlledCuratedExperience,
    route,
    routedResult,
  ]);

  const clearModule = (id: string) => {
    if (!window.confirm(moduleResetConfirmation(store, id, pilotEnabled || curatedEnabled))) return;
    updateStore((current) => resetAssessmentModule({
      ...current,
      read: { ...current.read, [id]: [] },
      active: { ...current.active, [id]: undefined },
      results: { ...current.results, [id]: [] },
    }, id));
  };

  const clearCourse = (course: CourseSummary) => {
    if (!window.confirm(courseResetConfirmation(
      store,
      course.id,
      course.title,
      pilotEnabled || curatedEnabled,
    ))) return;
    updateStore((current) => resetCourseStudyData(
      current,
      course.id,
      course.moduleIds,
    ));
  };

  if (route.view === 'course' && !activeCourse) {
    return (
      <AppFrame go={go} view={route.view}>
        <div className="empty">
          <h1>Course not found</h1>
          <button onClick={() => go('home')} type="button">Return home</button>
        </div>
      </AppFrame>
    );
  }

  if (route.view === 'not-found') {
    return (
      <AppFrame go={go} view={route.view}>
        <div className="empty">
          <h1>Page not found</h1>
          <p>The requested study route does not exist.</p>
          <button onClick={() => go('home')} type="button">Return home</button>
        </div>
      </AppFrame>
    );
  }

  const globalView = route.view === 'practice-hub'
    || route.view === 'legacy'
    || (route.view === 'progress' && !route.moduleId);
  if (
    !isControlledView
    && !globalView
    && !activeModule
    && !['home', 'course'].includes(route.view)
  ) {
    return (
      <AppFrame go={go} view={route.view}>
        <div className="empty">
          <h1>Module not found</h1>
          <button onClick={() => go('home')} type="button">Return home</button>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame go={go} view={route.view}>
      {route.view === 'home' ? (
        <HomeView
          store={store}
          go={go}
          resetAll={() => {
            if (window.confirm('Reset all reading progress, legacy quiz data, controlled practice, written responses and question history on this device?')) {
              resetAllStudyData();
              setStore(createEmptyStoreV2());
            }
          }}
        />
      ) : null}
      {route.view === 'practice-hub' ? (
        <PracticeHub
          store={store}
          go={go}
          curatedExperiences={curatedExperiences}
          allCuratedExperiences={allCuratedExperiences}
          curatedResumePanel={curatedExperiences.map((experience) => (
            <CuratedProgressPanel
              experienceId={experience.experienceId}
              fallbackLabel={`Loading ${experience.shortTitle} progress…`}
              go={go}
              key={experience.experienceId}
              store={store}
              variant="resume"
            />
          ))}
          curatedPanel={curatedExperiences.map((experience) => (
            <CuratedProgressPanel
              experienceId={experience.experienceId}
              fallbackLabel={`Loading ${experience.shortTitle} summary…`}
              go={go}
              key={experience.experienceId}
              store={store}
              variant="summary"
            />
          ))}
        />
      ) : null}
      {route.view === 'legacy' ? (
        <LegacyArchive
          moduleId={route.moduleId}
          store={store}
          go={go}
          curatedExperiences={allCuratedExperiences}
        />
      ) : null}
      {route.view === 'progress' && !route.moduleId ? (
        <ProgressHub
          store={store}
          go={go}
          curatedExperiences={curatedExperiences}
          allCuratedExperiences={allCuratedExperiences}
          curatedRegistry={curatedExperienceRegistry}
          curatedPanel={curatedExperiences.map((experience) => (
            <CuratedProgressPanel
              experienceId={experience.experienceId}
              fallbackLabel={`Loading ${experience.shortTitle} progress…`}
              go={go}
              key={experience.experienceId}
              store={store}
              variant="summary"
            />
          ))}
        />
      ) : null}
      {route.view === 'progress' && activeModule ? (
        <ModuleProgressView
          module={activeModule}
          store={store}
          go={go}
          curatedPanel={(() => {
            const experience = summaryForModule(activeModule.id, curatedExperiences);
            return experience ? (
              <CuratedProgressPanel
                experienceId={experience.experienceId}
                fallbackLabel={`Loading ${experience.shortTitle} mastery evidence…`}
                go={go}
                legacyCandidates={legacyRecommendationCandidates}
                store={store}
                variant="detail"
              />
            ) : undefined;
          })()}
        />
      ) : null}
      {route.view === 'course' && activeCourse ? (
        <CourseView
          course={activeCourse}
          store={store}
          go={go}
          clearModule={clearModule}
          clearCourse={() => clearCourse(activeCourse)}
          curatedExperiences={allCuratedExperiences}
        />
      ) : null}
      {route.view === 'study' && activeModule ? (
        <StudyView
          module={activeModule}
          read={store.read[activeModule.id] ?? []}
          onToggle={(sectionId) => updateStore((current) => {
            const present = current.read[activeModule.id] ?? [];
            const next = present.includes(sectionId)
              ? present.filter((id) => id !== sectionId)
              : [...present, sectionId];
            return {
              ...current,
              read: { ...current.read, [activeModule.id]: next },
            };
          })}
          go={go}
          pilotEnabled={pilotEnabled}
          openPilot={() => go('pilot', 'aqueous-vitreous')}
          curatedExperience={summaryForModule(activeModule.id, curatedExperiences)}
          openCuratedPractice={(routeSegment) => go('practice', routeSegment)}
          hasLegacyAttempt={Boolean(store.active[activeModule.id])}
          hasLegacyResults={(store.results[activeModule.id] ?? []).length > 0}
        />
      ) : null}
      {route.view === 'quiz' && activeModule ? (
        <LegacyQuizView
          module={activeModule}
          attempt={store.active[activeModule.id]}
          onAttempt={(attempt) => updateStore((current) => ({
            ...current,
            active: { ...current.active, [activeModule.id]: attempt },
          }))}
          onSubmit={(result) => updateStore((current) => ({
            ...current,
            active: { ...current.active, [activeModule.id]: undefined },
            results: {
              ...current.results,
              [activeModule.id]: [
                result,
                ...(current.results[activeModule.id] ?? []),
              ].slice(0, 20),
            },
          }))}
          go={go}
          curatedExperience={summaryForModule(activeModule.id, allCuratedExperiences)}
          hasLegacyResults={(store.results[activeModule.id] ?? []).length > 0}
        />
      ) : null}
      {route.view === 'results' && activeModule ? (
        <LegacyResultsView
          module={activeModule}
          result={(store.results[activeModule.id] ?? [])[0]}
          go={go}
          curatedExperience={summaryForModule(activeModule.id, allCuratedExperiences)}
        />
      ) : null}
      {isControlledView ? (
        route.view === 'practice' || controlledCuratedExperience ? (
          <CuratedPracticeRouter
            go={go}
            resourceId={route.moduleId}
            setStore={setStore}
            store={store}
            view={route.view}
          />
        ) : controlledKind === 'aqueous' && pilotEnabled ? (
          <Suspense fallback={<div className="pilot-loading" role="status">Loading experimental assessment…</div>}>
            <AssessmentPilotRouter
              go={go}
              resourceId={route.moduleId}
              setStore={setStore}
              store={store}
              view={route.view}
            />
          </Suspense>
        ) : <AssessmentPilotUnavailable go={go} />
      ) : null}
    </AppFrame>
  );
}
