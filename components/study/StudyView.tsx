'use client';

import { type MouseEvent as ReactMouseEvent, useCallback, useRef, useState } from 'react';
import { FigureDialog } from '@/components/study/FigureDialog';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { moduleReadingPercentage } from '@/lib/legacy/progress';
import type { Figure, Module } from '@/lib/legacy/types';

export function StudyView({
  module,
  read,
  onToggle,
  pilotEnabled,
  openPilot,
  hvpPracticeEnabled = false,
  openHvpPractice,
  go,
  startQuiz,
}: {
  module: Module;
  read: string[];
  onToggle: (id: string) => void;
  go: GoToRoute;
  pilotEnabled: boolean;
  openPilot: () => void;
  hvpPracticeEnabled?: boolean;
  openHvpPractice?: () => void;
  startQuiz: (module: Module) => void;
}) {
  const progress = moduleReadingPercentage(module, read);
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
        <button className="back" onClick={() => go('course', module.courseId)}>← Back to course</button>
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
            <ol>{module.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ol>
          </div>
          <nav aria-label="Module sections">
            <h2>On this page</h2>
            {module.sections.map((item, index) => (
              <a key={item.id} href={`#${item.id}`} className={read.includes(item.id) ? 'done' : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>{item.title}
              </a>
            ))}
          </nav>
          <button className="primary full" onClick={() => startQuiz(module)}>Start 50-question quiz</button>
          {hvpPracticeEnabled && module.id === 'human-visual-perception' && openHvpPractice ? (
            <section className="pilot-entry">
              <h2>Curated slide-aligned practice</h2>
              <p>
                Build a 50-question mixed-format practice set from 120 questions
                aligned with the supplied OPT 374 slides. This does not affect
                your legacy quiz score.
              </p>
              <button className="secondary" onClick={openHvpPractice} type="button">
                Open curated practice
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
        </aside>
        <div className="notes">
          <div className="source-note"><b>Study note</b><span>{module.sourceNote}</span></div>
          {module.sections.map((item, index) => (
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
        </div>
      </div>
      {expanded
        ? <FigureDialog figure={expanded} triggerRef={triggerRef} onClose={closeFigure} />
        : null}
    </>
  );
}
