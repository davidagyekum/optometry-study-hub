import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import {
  bestScorePercentage,
  courseReadingCompletion,
  latestResult,
  overallReadingCompletion,
  scorePercentage,
} from '@/lib/legacy/progress';
import { questionsFor } from '@/lib/legacy/questionGenerator';
import type { LegacyStoreData, Module } from '@/lib/legacy/types';

export function HomeView({
  store,
  go,
  resetAll,
}: {
  store: LegacyStoreData;
  go: GoToRoute;
  resetAll: () => void;
}) {
  const completion = overallReadingCompletion(modules, store);
  const totalQuestions = modules.reduce((sum, item) => sum + questionsFor(item).length, 0);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">KNUST OPTOMETRY REVIEW</span>
          <h1>Five courses.<br /><em>One focused study hub.</em></h1>
          <p>Clear lecture-based notes, source figures and {totalQuestions} shuffled practice questions across visual science, anatomy, pharmacology and pathology.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => go('course', courses[0].id)}>Explore the courses</button>
            <span>{completion.completed}/{completion.total} sections reviewed</span>
          </div>
        </div>
        <div className="eye-visual" aria-label="Stylised iris motif">
          <div className="iris"><div className="pupil" /></div>
          <div className="orbit-line one" />
          <div className="orbit-line two" />
        </div>
      </section>
      <section className="overview">
        <div><span>YOUR STUDY LIBRARY</span><h2>Choose a course to continue.</h2></div>
        <div className="overall-progress"><strong>{completion.percentage}%</strong><span>reading complete</span></div>
      </section>
      <section className="course-grid">
        {courses.map((course) => {
          const courseModules = course.moduleIds.map((id) => moduleMap.get(id)).filter(Boolean) as Module[];
          const progress = courseReadingCompletion(courseModules, store).percentage;
          const attempts = courseModules.flatMap((item) => store.results[item.id] ?? []);
          const latest = latestResult(attempts);
          const best = bestScorePercentage(attempts);
          return (
            <article className={`course-card ${course.tone}`} key={course.id}>
              <button className="course-art" onClick={() => go('course', course.id)} aria-label={`Open ${course.title}`}>
                <img src={course.coverImage.src} width={course.coverImage.width} height={course.coverImage.height} alt="" loading="lazy" decoding="async" />
              </button>
              <div className="course-body">
                <span className="course-code">{course.code}</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-meta">
                  <span>{courseModules.length} {courseModules.length === 1 ? 'module' : 'modules'}</span>
                  <span>{courseModules.length * 50} questions</span>
                </div>
                <div className="progress-row"><div><i style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div>
                <div className="score-row">
                  <span>Latest <b>{latest ? `${scorePercentage(latest)}%` : '—'}</b></span>
                  <span>Best <b>{best === undefined ? '—' : `${best}%`}</b></span>
                </div>
                <button className="primary full" onClick={() => go('course', course.id)}>Open course</button>
              </div>
            </article>
          );
        })}
      </section>
      <section className="privacy-panel">
        <div>
          <h2>Your learning stays yours.</h2>
          <p>Answers, reading progress and up to 20 recent attempts per module are stored only in this browser. No account or student name is required.</p>
        </div>
        <button className="secondary danger" onClick={resetAll}>Reset all study data</button>
      </section>
    </>
  );
}
