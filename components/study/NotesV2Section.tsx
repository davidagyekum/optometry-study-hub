'use client';

/* eslint-disable @next/next/no-img-element -- lesson figures preserve supplied dimensions and dialog behavior */

import type { MouseEvent as ReactMouseEvent } from 'react';
import { StudyBlockRenderer } from '@/components/study/StudyBlockRenderer';
import type {
  StudySectionV2,
  StudySource,
} from '@/content/notes-v2/types';
import type { Figure } from '@/lib/legacy/types';

export function NotesV2Section({
  section,
  index,
  read,
  supplemental = false,
  onToggle,
  openFigure,
  sources,
}: {
  section: StudySectionV2;
  index: number;
  read: boolean;
  supplemental?: boolean;
  onToggle: () => void;
  openFigure: (
    figure: Figure,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  sources: ReadonlyMap<string, StudySource>;
}) {
  return (
    <article
      className={`note-section notes-v2-section${supplemental ? ' legacy-supplemental' : ''}`}
      id={section.id}
    >
      <div className="section-heading">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <div>
          {supplemental ? <small>Legacy supplemental notes</small> : null}
          <h2>{section.title}</h2>
          <p>{section.overview}</p>
        </div>
      </div>
      {section.learningOutcomes ? (
        <section className="notes-outcomes">
          <h3>After this section, you should be able to</h3>
          <ul>{section.learningOutcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
        </section>
      ) : null}
      {section.figure ? (
        <figure className="section-figure notes-v2-figure">
          <button
            className="figure-button"
            type="button"
            onClick={(event) => openFigure(section.figure!, event)}
            aria-label={`Enlarge figure: ${section.figure.caption}`}
          >
            <img
              src={section.figure.src}
              width={section.figure.width}
              height={section.figure.height}
              alt={section.figure.alt}
              loading="lazy"
              decoding="async"
            />
          </button>
          <figcaption>
            <span>{section.figure.caption}</span>
            <small>
              Source: {section.figure.sourceUrl
                ? (
                    <a href={section.figure.sourceUrl} target="_blank" rel="noreferrer">
                      {section.figure.credit}
                    </a>
                  )
                : section.figure.credit}
            </small>
          </figcaption>
        </figure>
      ) : null}
      <div className="notes-v2-blocks">
        {section.blocks.map((block, blockIndex) => (
          <StudyBlockRenderer
            key={`${section.id}-${block.type}-${blockIndex}`}
            block={block}
            sources={sources}
            openFigure={openFigure}
          />
        ))}
      </div>
      {section.keyTerms ? (
        <section className="terms notes-glossary">
          <h3>Glossary</h3>
          {section.keyTerms.map((entry) => (
            <div key={entry.term}><b>{entry.term}</b><span>{entry.definition}</span></div>
          ))}
        </section>
      ) : null}
      {section.clinicalPearls ? (
        <aside className="notes-clinical-pearls">
          <strong>Clinical pearls</strong>
          <ul>{section.clinicalPearls.map((pearl) => <li key={pearl}>{pearl}</li>)}</ul>
        </aside>
      ) : null}
      {section.misconceptions ? (
        <section className="notes-misconceptions">
          <h3>Common misconception</h3>
          {section.misconceptions.map((item) => (
            <div key={item.claim}>
              <p><strong>Claim:</strong> {item.claim}</p>
              <p><strong>Correction:</strong> {item.correction}</p>
            </div>
          ))}
        </section>
      ) : null}
      <button
        className={read ? 'complete-button complete' : 'complete-button'}
        onClick={onToggle}
        type="button"
        aria-pressed={read}
      >
        {read ? '✓ Reviewed' : 'Mark section reviewed'}
      </button>
    </article>
  );
}
