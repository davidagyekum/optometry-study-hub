'use client';

import { CourseView } from '@/components/course/CourseView';
import { HomeView } from '@/components/home/HomeView';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { LegacyQuizView } from '@/components/quiz/LegacyQuizView';
import { LegacyResultsView } from '@/components/results/LegacyResultsView';
import { StudyView } from '@/components/study/StudyView';
import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { useClientRoute } from '@/hooks/useClientRoute';
import { useLegacyStore } from '@/hooks/useLegacyStore';
import { createAttempt } from '@/lib/legacy/attempts';
import type { CourseSummary, Module } from '@/lib/legacy/types';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';
import { resetAllStudyData } from '@/lib/storage/store';

export default function StudyApp() {
  const { route, go } = useClientRoute();
  const { store, setStore } = useLegacyStore();

  const updateStore = (updater: (current: StoreV2) => StoreV2) => {
    setStore((current) => updater(current));
  };
  const activeModule = moduleMap.get(route.moduleId);
  const activeCourse = courses.find((course) => course.id === route.moduleId);

  const startQuiz = (target: Module, force = false) => {
    const existing = store.active[target.id];
    if (existing && !force) {
      go('quiz', target.id);
      return;
    }
    if (existing && force && !window.confirm('Restart this attempt? Your current answers will be cleared.')) return;
    const attempt = createAttempt(target);
    updateStore((current) => ({
      ...current,
      active: { ...current.active, [target.id]: attempt },
    }));
    go('quiz', target.id);
  };

  const clearModule = (id: string) => {
    if (!window.confirm('Clear reading progress, active quiz and score history for this module?')) return;
    updateStore((current) => ({
      ...current,
      read: { ...current.read, [id]: [] },
      active: { ...current.active, [id]: undefined },
      results: { ...current.results, [id]: [] },
    }));
  };

  const clearCourse = (course: CourseSummary) => {
    if (!window.confirm(`Clear all notes progress, active quizzes and score history for ${course.title}?`)) return;
    updateStore((current) => {
      const read = { ...current.read };
      const active = { ...current.active };
      const results = { ...current.results };
      course.moduleIds.forEach((id) => {
        read[id] = [];
        active[id] = undefined;
        results[id] = [];
      });
      return { ...current, read, active, results };
    });
  };

  if (route.view === 'course' && !activeCourse) {
    return (
      <main className="shell">
        <SiteHeader go={go} />
        <div className="empty">
          <h1>Course not found</h1>
          <button onClick={() => go('home')}>Return home</button>
        </div>
      </main>
    );
  }

  if (!activeModule && !['home', 'course'].includes(route.view)) {
    return (
      <main className="shell">
        <SiteHeader go={go} />
        <div className="empty">
          <h1>Module not found</h1>
          <button onClick={() => go('home')}>Return home</button>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <SiteHeader go={go} />
      {route.view === 'home' ? (
        <HomeView
          store={store}
          go={go}
          resetAll={() => {
            if (window.confirm('Reset all study progress and scores on this device?')) {
              resetAllStudyData();
              setStore(createEmptyStoreV2());
            }
          }}
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
      <SiteFooter go={go} />
    </main>
  );
}
