'use client';

import { type MouseEvent as ReactMouseEvent, useCallback, useRef, useState } from 'react';
import { CuratedReleaseStatus } from '@/components/assessment/curated/CuratedReleaseStatus';
import { FigureDialog } from '@/components/study/FigureDialog';
import { NotesV2Section } from '@/components/study/NotesV2Section';
import {
  notesV2ReadingPercentage,
  resolveNotesV2,
} from '@/content/notes-v2/catalog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { CuratedExperienceSummary } from '@/lib/assessment/curated/types';
import { moduleReadingPercentage } from '@/lib/legacy/progress';
import type { Figure, Module } from '@/lib/legacy/types';

export function StudyView({
  module,
  read,
  onToggle,
  pilotEnabled,
  openPilot,
  curatedExperience,
  openCuratedPractice,
  go,
  startQuiz,
}: {
  module: Module;
  read: string[];
  onToggle: (id: string) => void;
  go: GoToRoute;
  pilotEnabled: boolean;
  openPilot: () => void;
  curatedExperience?: CuratedExperienceSummary;
  openCuratedPractice?: (routeSegment: string) => void;
  startQuiz: (module: Module) => void;
}) {
  const notesResolution = resolveNotesV2(module);
  const content = notesResolution.kind === 'v2' ? notesResolution.content : undefined;
  const allSections = content
    ? [...content.sections, ...(content.legacySupplementalSections ?? [])]
    : [];
  const progress = content
    ? notesV2ReadingPercentage(content, read)
    : moduleReadingPercentage(module, read);
  const sourceMap = new Map(content?.sources.map((source) => [source.id, source]) ?? []);
  const [expanded, setExpanded] = useState<Figure | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeFigure = useCallback(() => setExpanded(null), []);

  const openFigure = (image: Figure, event: ReactMouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setExpanded(image);
  };

  return (
    <>
      <section className={`module-hero ${module.tone}`}>
        <nav className="study-breadcrumb" aria-label="Breadcrumb">
          <button className="back" onClick={() => go('home')}>Study hub</button>
          <span aria-hidden="true">/</span>
          <button className="back" onClick={() => go('course', module.courseId)}>Course</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{module.title}</span>
        </nav>
        <div>
          <span>MODULE {module.number}</span>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
        <div className="round-progress"><strong>{progress}%</strong><span>reviewed</span></div>
      </section>
      <div className="study-layout">
        <aside>
          <div className="aside-card">
            <h2>Learning objectives</h2>
            <ol>{(content?.learningObjectives ?? module.objectives).map((objective) => <li key={objective}>{objective}</li>)}</ol>
          </div>
          <nav className="notes-toc" aria-label="Module sections">
            <h2>On this page</h2>
            {(content ? allSections : module.sections).map((item, index) => (
              <a key={item.id} href={`#${item.id}`} className={read.includes(item.id) ? 'done' : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>{item.title}
              </a>
            ))}
          </nav>
          {curatedExperience?.moduleId === module.id && openCuratedPractice ? (
            <section className="pilot-entry">
              <h2>{curatedExperience.studyEntryTitle}</h2>
              <p>{curatedExperience.studyEntryDescription}</p>
              <CuratedReleaseStatus compact summary={curatedExperience} />
              <button
                aria-label="Open curated practice"
                className="primary full"
                onClick={() => openCuratedPractice(curatedExperience.routeSegment)}
                type="button"
              >
                Practice this module
              </button>
            </section>
          ) : null}
          {pilotEnabled && module.id === 'aqueous-vitreous' ? (
            <section className="pilot-entry">
              <h2>Experimental mixed-format pilot</h2>
              <p>
                Try nine draft questions using diagrams, matching, ordering and
                written responses. This pilot does not affect your existing quiz score.
              </p>
              <button className="secondary" onClick={openPilot} type="button">
                Open experimental pilot
              </button>
            </section>
          ) : null}
          <details className="legacy-archive">
            <summary>Legacy compatibility archive</summary>
            <p>The original quiz remains available for recovery and historical comparison. Curated practice is recommended.</p>
            <button className="secondary full" onClick={() => go('legacy', module.id)} type="button">
              Legacy quiz archive
            </button>
            <button className="text-button" onClick={() => go('results', module.id)} type="button">
              Legacy results/history
            </button>
            <button className="text-button" onClick={() => startQuiz(module)} type="button">
              Start 50-question quiz
            </button>
          </details>
        </aside>
        <div className="notes">
          {content ? (
            <details className="notes-toc-mobile">
              <summary>Jump to a section</summary>
              <nav aria-label="Module sections">
                {allSections.map((item, index) => (
                  <a key={item.id} href={`#${item.id}`}>
                    {String(index + 1).padStart(2, '0')} {item.title}
                  </a>
                ))}
              </nav>
            </details>
          ) : null}
          {notesResolution.kind === 'legacy' ? (
            <div className="notes-fallback" role="status">
              <strong>Original notes shown</strong>
              <span>{notesResolution.reason}</span>
            </div>
          ) : null}
          <div className="source-note"><b>Study note</b><span>{module.sourceNote}</span></div>
          {content ? content.sections.map((item, index) => (
            <NotesV2Section
              key={item.id}
              section={item}
              index={index}
              read={read.includes(item.id)}
              onToggle={() => onToggle(item.id)}
              openFigure={openFigure}
              sources={sourceMap}
            />
          )) : module.sections.map((item, index) => (
            <article className="note-section" id={item.id} key={item.id}>
              <div className="section-heading">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><h2>{item.title}</h2><p>{item.summary}</p></div>
              </div>
              <div className="section-learning">
                <figure className="section-figure">
                  <button className="figure-button" type="button" onClick={(event) => openFigure(item.image, event)} aria-label={`Enlarge figure: ${item.image.caption}`}>
                    <img src={item.image.src} width={item.image.width} height={item.image.height} alt={item.image.alt} loading="lazy" decoding="async" />
                  </button>
                  <figcaption>
                    <span>{item.image.caption}</span>
                    <small>
                      Source: {item.image.sourceUrl
                        ? <a href={item.image.sourceUrl} target="_blank" rel="noreferrer">{item.image.credit}</a>
                        : item.image.credit}
                    </small>
                  </figcaption>
                </figure>
                <ul className="key-points">{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              </div>
              <div className="terms">
                <h3>Key terms</h3>
                {item.terms.map((term) => {
                  const [name, definition] = term.split(' — ');
                  return <div key={term}><b>{name}</b><span>{definition}</span></div>;
                })}
              </div>
              <div className="clinical"><span>Clinical connection</span><p>{item.clinical}</p></div>
              <button className={read.includes(item.id) ? 'complete-button complete' : 'complete-button'} onClick={() => onToggle(item.id)}>
                {read.includes(item.id) ? '✓ Reviewed' : 'Mark section reviewed'}
              </button>
            </article>
          ))}
          {content?.legacySupplementalSections?.length ? (
            <section className="legacy-supplemental-group" aria-labelledby="legacy-supplemental-title">
              <div className="notes-supplemental-heading">
                <p className="eyebrow">Preserved reading history</p>
                <h2 id="legacy-supplemental-title">Legacy supplemental notes</h2>
                <p>
                  These historical sections remain readable and their completion records are preserved.
                  The current curated assessment does not cover them.
                </p>
              </div>
              {content.legacySupplementalSections.map((item, index) => (
                <NotesV2Section
                  key={item.id}
                  section={item}
                  index={content.sections.length + index}
                  read={read.includes(item.id)}
                  supplemental
                  onToggle={() => onToggle(item.id)}
                  openFigure={openFigure}
                  sources={sourceMap}
                />
              ))}
            </section>
          ) : null}
          {content ? (
            <section className="notes-sources" aria-labelledby="notes-sources-title">
              <h2 id="notes-sources-title">Sources and teaching scope</h2>
              <ul>
                {content.sources.map((source) => (
                  <li key={source.id}>
                    <strong>{source.title}</strong>
                    <span>{source.citation}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
      {expanded
        ? <FigureDialog figure={expanded} triggerRef={triggerRef} onClose={closeFigure} />
        : null}
    </>
  );
}
