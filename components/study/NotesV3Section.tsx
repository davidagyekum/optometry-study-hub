'use client';

/* eslint-disable @next/next/no-img-element -- lesson figures preserve supplied dimensions and dialog behavior */

import type { MouseEvent as ReactMouseEvent } from 'react';
import { StudyBlockV3Renderer } from '@/components/study/StudyBlockV3Renderer';
import type { StudySectionV3 } from '@/content/notes-v3/types';
import type { Figure } from '@/lib/legacy/types';

export function NotesV3Section({
  section,
  index,
  read,
  onToggle,
  openFigure,
}: {
  section: StudySectionV3;
  index: number;
  read: boolean;
  onToggle: () => void;
  openFigure: (figure: Figure, event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <article className="note-section notes-v2-section notes-v3-section" id={section.id}>
      <div className="section-heading">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <div>
          <small>Self-teaching notes</small>
          <h2>{section.title}</h2>
          <p>{section.overview}</p>
        </div>
      </div>
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
            <small>Source: {section.figure.credit}</small>
          </figcaption>
        </figure>
      ) : null}
      <div className="notes-v2-blocks notes-v3-blocks">
        {section.blocks.map((block, blockIndex) => (
          <StudyBlockV3Renderer key={`${section.id}-${block.type}-${blockIndex}`} block={block} />
        ))}
      </div>
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
