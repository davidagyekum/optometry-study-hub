import { moduleMap } from '@/content/legacy/moduleCatalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import { bestScore, courseReadingCompletion, moduleReadingPercentage } from '@/lib/legacy/progress';
import type { CourseSummary, LegacyStoreData, Module } from '@/lib/legacy/types';

export function CourseView({
  course,
  store,
  go,
  startQuiz,
  clearModule,
  clearCourse,
  curatedExperiences,
}: {
  course: CourseSummary;
  store: LegacyStoreData;
  go: GoToRoute;
  startQuiz: (module: Module) => void;
  clearModule: (id: string) => void;
  clearCourse: () => void;
  curatedExperiences: readonly CuratedExperienceSummary[];
}) {
  const courseModules = course.moduleIds.map((id) => moduleMap.get(id)).filter(Boolean) as Module[];
  const completion = courseReadingCompletion(courseModules, store);
  const registeredCurated = curatedExperiences.filter(
    (experience) => experience.courseId === course.id,
  );
  const enabledCurated = registeredCurated.filter(
    (experience) => experience.enabled,
  );

  return (
    <>
      <section className={`course-hero ${course.tone}`}>
        <button className="back" onClick={() => go('home')}>← All courses</button>
        <div>
          <span>{course.code}</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <p className="lecturer-line"><b>Lecturer/source:</b> {course.lecturers.join(' · ')}</p>
        </div>
        <div className="round-progress"><strong>{completion.percentage}%</strong><span>reviewed</span></div>
      </section>
      <section className="overview compact">
        <div>
          <span>COURSE MODULES</span>
          <h2>{courseModules.length === 1 ? 'One complete review module.' : `${courseModules.length} focused review modules.`}</h2>
        </div>
        <div className="overall-progress"><strong>{completion.completed}/{completion.total}</strong><span>sections reviewed</span></div>
      </section>
      {registeredCurated.length ? (
        <section
          aria-label={`${course.title} curated practice availability`}
          className="privacy-panel course-curated-status"
        >
          <div>
            <span className="course-code">CURATED PRACTICE</span>
            <h2>
              Curated modules enabled: {enabledCurated.length} of{' '}
              {registeredCurated.length}
            </h2>
            <p>
              Curated results and mastery evidence remain separate for each
              module and do not replace legacy Latest or Best scores.
            </p>
          </div>
        </section>
      ) : null}
      <section className="module-grid">
        {courseModules.map((item) => {
          const moduleProgress = moduleReadingPercentage(item, store.read[item.id] ?? []);
          const history = store.results[item.id] ?? [];
          const latest = history[0];
          const best = bestScore(history);
          return (
            <article className={`module-card ${item.tone}`} key={item.id}>
              <div className="module-number">{item.number}</div>
              <div className="module-art" aria-hidden="true">
                <img src={item.coverImage.src} width={item.coverImage.width} height={item.coverImage.height} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="module-body">
                <span className="course-code">{item.lecturer}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="progress-row"><div><i style={{ width: `${moduleProgress}%` }} /></div><span>{moduleProgress}%</span></div>
                <div className="score-row">
                  <span>Latest <b>{latest ? `${latest.score}/50` : '—'}</b></span>
                  <span>Best <b>{best === undefined ? '—' : `${best}/50`}</b></span>
                </div>
                <div className="card-actions">
                  <button className="secondary" onClick={() => go('study', item.id)}>Read notes</button>
                  <button className="primary small" onClick={() => startQuiz(item)}>{store.active[item.id] ? 'Resume quiz' : 'Take quiz'}</button>
                </div>
                <button className="text-button danger" onClick={() => clearModule(item.id)}>Clear module data</button>
              </div>
            </article>
          );
        })}
      </section>
      <section className="privacy-panel course-reset">
        <div>
          <h2>Course data controls</h2>
          <p>Clear only this course while leaving every other course and the original OPT 376 records untouched.</p>
        </div>
        <button className="secondary danger" onClick={clearCourse}>Clear {course.title}</button>
      </section>
    </>
  );
}
