'use client';

import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { CourseView } from '@/components/course/CourseView';
import { HomeView } from '@/components/home/HomeView';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PracticeHub } from '@/components/practice/PracticeHub';
import { ModuleProgressView } from '@/components/progress/ModuleProgressView';
import { ProgressHub } from '@/components/progress/ProgressHub';
import { AssessmentPilotUnavailable } from '@/components/assessment/pilot/AssessmentPilotUnavailable';
import { HvpPracticeUnavailable } from '@/components/assessment/hvp/HvpPracticeUnavailable';
import { LegacyQuizView } from '@/components/quiz/LegacyQuizView';
import { LegacyResultsView } from '@/components/results/LegacyResultsView';
import { StudyView } from '@/components/study/StudyView';
import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { useClientRoute, type GoToRoute } from '@/hooks/useClientRoute';
import { useLegacyStore } from '@/hooks/useLegacyStore';
import { isAssessmentPilotEnabled } from '@/lib/assessment/pilot/config';
import { controlledExperienceKind } from '@/lib/assessment/routing/controlledExperience';
import {
  HVP_CURATED_PRACTICE_ID,
  isHvpCuratedPracticeEnabled,
} from '@/lib/assessment/hvp/config';
import { createAttempt } from '@/lib/legacy/attempts';
import type { CourseSummary, Module } from '@/lib/legacy/types';
import type { ClientView } from '@/lib/navigation/clientRoute';
import { documentTitleForRoute } from '@/lib/navigation/documentIdentity';
import { legacyRecentActivity } from '@/lib/progress/activity';
import { legacyRecommendations } from '@/lib/progress/recommendations';
import {
  courseResetConfirmation,
  moduleResetConfirmation,
  resetAssessmentCourse,
  resetAssessmentModule,
} from '@/lib/storage/assessmentReset';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';
import { resetAllStudyData } from '@/lib/storage/store';

const CONTROLLED_VIEWS: ClientView[] = ['pilot', 'practice', 'assessment', 'assessment-result'];
const AssessmentPilotRouter = lazy(() => (
  import('@/components/assessment/pilot/AssessmentPilotRouter')
    .then((module) => ({ default: module.AssessmentPilotRouter }))
));
const HvpPracticeRouter = lazy(() => (
  import('@/components/assessment/hvp/HvpPracticeRouter')
    .then((module) => ({ default: module.HvpPracticeRouter }))
));
const HvpProgressPanel = lazy(() => (
  import('@/components/progress/HvpProgressPanel')
    .then((module) => ({ default: module.HvpProgressPanel }))
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
  const hvpPracticeEnabled = isHvpCuratedPracticeEnabled();
  const legacyRecommendationCandidates = legacyRecommendations(store);
  const unboundedLegacyActivity = legacyRecentActivity(
    store,
    Number.POSITIVE_INFINITY,
  );
  const isControlledView = CONTROLLED_VIEWS.includes(route.view);
  const routedAttempt = route.view === 'assessment'
    ? store.assessment.activeAttempts[route.moduleId]
    : undefined;
  const routedResult = route.view === 'assessment-result'
    ? store.assessment.results[route.moduleId]
    : undefined;
  const controlledBlueprint = routedAttempt?.blueprintId ?? routedResult?.blueprintId;
  const controlledKind = controlledExperienceKind(route.view, controlledBlueprint);

  const updateStore = (updater: (current: StoreV2) => StoreV2) => {
    setStore((current) => updater(current));
  };
  const activeModule = moduleMap.get(route.moduleId);
  const activeCourse = courses.find((course) => course.id === route.moduleId);
  const controlledAvailable = controlledKind === 'hvp'
    ? hvpPracticeEnabled
    : controlledKind === 'aqueous'
      ? pilotEnabled
      : false;

  useEffect(() => {
    document.title = documentTitleForRoute(route, {
      courseTitle: activeCourse?.title,
      moduleTitle: activeModule?.shortTitle ?? activeModule?.title,
      controlledKind,
      available: controlledAvailable,
      resultAvailable: Boolean(routedResult),
    });
  }, [
    activeCourse?.title,
    activeModule?.shortTitle,
    activeModule?.title,
    controlledAvailable,
    controlledKind,
    route,
    routedResult,
  ]);

  const startQuiz = (target: Module, force = false) => {
    const existing = store.active[target.id];
    if (existing && !force) {
      go('quiz', target.id);
      return;
    }
    if (
      existing
      && force
      && !window.confirm('Restart this attempt? Your current answers will be cleared.')
    ) return;
    const attempt = createAttempt(target);
    updateStore((current) => ({
      ...current,
      active: { ...current.active, [target.id]: attempt },
    }));
    go('quiz', target.id);
  };

  const clearModule = (id: string) => {
    if (!window.confirm(moduleResetConfirmation(store, id, pilotEnabled || hvpPracticeEnabled))) return;
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
      pilotEnabled || hvpPracticeEnabled,
    ))) return;
    updateStore((current) => {
      const read = { ...current.read };
      const active = { ...current.active };
      const results = { ...current.results };
      course.moduleIds.forEach((id) => {
        read[id] = [];
        active[id] = undefined;
        results[id] = [];
      });
      return resetAssessmentCourse({ ...current, read, active, results }, course.id);
    });
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
          startQuiz={startQuiz}
          hvpEnabled={hvpPracticeEnabled}
          curatedResumePanel={hvpPracticeEnabled ? (
            <Suspense fallback={<div className="analytics-loading" role="status">Loading curated progress…</div>}>
              <HvpProgressPanel store={store} go={go} variant="resume" />
            </Suspense>
          ) : undefined}
          curatedPanel={hvpPracticeEnabled ? (
            <Suspense fallback={<div className="analytics-loading" role="status">Loading curated summary…</div>}>
              <HvpProgressPanel store={store} go={go} variant="summary" />
            </Suspense>
          ) : undefined}
        />
      ) : null}
      {route.view === 'progress' && !route.moduleId ? (
        <ProgressHub
          store={store}
          go={go}
          hvpEnabled={hvpPracticeEnabled}
          curatedPanel={hvpPracticeEnabled ? (
            <Suspense fallback={<div className="analytics-loading" role="status">Loading curated progress…</div>}>
              <HvpProgressPanel store={store} go={go} variant="summary" />
            </Suspense>
          ) : undefined}
          curatedRecommendationPanel={hvpPracticeEnabled ? (
            <Suspense fallback={<div className="analytics-loading" role="status">Loading recommendation…</div>}>
              <HvpProgressPanel
                store={store}
                go={go}
                variant="recommendation"
                legacyCandidates={legacyRecommendationCandidates}
              />
            </Suspense>
          ) : undefined}
          curatedActivityPanel={hvpPracticeEnabled ? (
            <Suspense fallback={<div className="analytics-loading" role="status">Loading activity…</div>}>
              <HvpProgressPanel
                store={store}
                go={go}
                variant="activity"
                legacyActivity={unboundedLegacyActivity}
              />
            </Suspense>
          ) : undefined}
        />
      ) : null}
      {route.view === 'progress' && activeModule ? (
        <ModuleProgressView
          module={activeModule}
          store={store}
          go={go}
          startQuiz={startQuiz}
          curatedPanel={
            activeModule.id === 'human-visual-perception' && hvpPracticeEnabled ? (
              <Suspense fallback={<div className="analytics-loading" role="status">Loading mastery evidence…</div>}>
                <HvpProgressPanel
                  store={store}
                  go={go}
                  variant="detail"
                  legacyCandidates={legacyRecommendationCandidates}
                />
              </Suspense>
            ) : undefined
          }
        />
      ) : null}
      {route.view === 'course' && activeCourse ? (
        <CourseView
          course={activeCourse}
          store={store}
          go={go}
          startQuiz={startQuiz}
          clearModule={clearModule}
          clearCourse={() => clearCourse(activeCourse)}
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
          startQuiz={startQuiz}
          pilotEnabled={pilotEnabled}
          openPilot={() => go('pilot', 'aqueous-vitreous')}
          hvpPracticeEnabled={hvpPracticeEnabled}
          openHvpPractice={() => go('practice', HVP_CURATED_PRACTICE_ID)}
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
          startQuiz={startQuiz}
        />
      ) : null}
      {route.view === 'results' && activeModule ? (
        <LegacyResultsView
          module={activeModule}
          result={(store.results[activeModule.id] ?? [])[0]}
          go={go}
          startQuiz={startQuiz}
        />
      ) : null}
      {isControlledView ? (
        controlledKind === 'hvp' && hvpPracticeEnabled ? (
          <Suspense fallback={<div className="pilot-loading" role="status">Loading curated practice…</div>}>
            <HvpPracticeRouter
              go={go}
              resourceId={route.moduleId}
              setStore={setStore}
              store={store}
              view={route.view}
            />
          </Suspense>
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
        ) : controlledKind === 'hvp' ? (
          <HvpPracticeUnavailable go={go} />
        ) : <AssessmentPilotUnavailable go={go} />
      ) : null}
    </AppFrame>
  );
}
