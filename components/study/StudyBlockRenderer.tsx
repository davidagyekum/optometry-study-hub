'use client';

/* eslint-disable @next/next/no-img-element -- lesson figures preserve supplied dimensions and dialog behavior */

import type { MouseEvent as ReactMouseEvent } from 'react';
import type {
  StudyBlock,
  StudySource,
} from '@/content/notes-v2/types';
import type { Figure } from '@/lib/legacy/types';

export function StudyBlockRenderer({
  block,
  sources,
  openFigure,
}: {
  block: StudyBlock;
  sources: ReadonlyMap<string, StudySource>;
  openFigure: (
    figure: Figure,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
}) {
  switch (block.type) {
    case 'paragraph':
      return <p className="notes-v2-paragraph">{block.text}</p>;
    case 'key-points':
      return (
        <section className="notes-v2-block">
          <h3>{block.title}</h3>
          <ul className="key-points">
            {block.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      );
    case 'ordered-process':
    case 'mechanism':
      return (
        <section className={`notes-v2-block ${block.type}`}>
          <h3>{block.title}</h3>
          <ol>
            {block.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      );
    case 'comparison-table':
      return (
        <section className="notes-v2-block">
          <h3>{block.title}</h3>
          <div className="notes-table-wrap" tabIndex={0} role="region" aria-label={block.title}>
            <table>
              <thead>
                <tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join('|')}>
                    {row.map((cell, index) => (
                      index === 0
                        ? <th key={cell} scope="row">{cell}</th>
                        : <td key={`${index}-${cell}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    case 'clinical-vignette':
      return (
        <aside className="clinical">
          <span>{block.title}</span>
          <p>{block.text}</p>
        </aside>
      );
    case 'warning':
      return (
        <aside className="notes-warning" role="note">
          <strong>{block.title}</strong>
          <p>{block.text}</p>
        </aside>
      );
    case 'formula-or-relationship':
      return (
        <section className="notes-relationship">
          <h3>{block.title}</h3>
          <strong>{block.expression}</strong>
          <p>{block.note}</p>
        </section>
      );
    case 'figure':
      return (
        <figure className="section-figure">
          <button
            className="figure-button"
            type="button"
            onClick={(event) => openFigure(block.figure, event)}
            aria-label={`Enlarge figure: ${block.figure.caption}`}
          >
            <img
              src={block.figure.src}
              width={block.figure.width}
              height={block.figure.height}
              alt={block.figure.alt}
              loading="lazy"
              decoding="async"
            />
          </button>
          <figcaption><span>{block.figure.caption}</span></figcaption>
        </figure>
      );
    case 'callout':
      return (
        <aside className="notes-callout">
          <strong>{block.title}</strong>
          <p>{block.text}</p>
        </aside>
      );
    case 'glossary':
      return (
        <section className="terms">
          <h3>Glossary</h3>
          {block.entries.map((entry) => (
            <div key={entry.term}><b>{entry.term}</b><span>{entry.definition}</span></div>
          ))}
        </section>
      );
    case 'source-note':
      return (
        <aside className="source-note">
          <b>Source note</b>
          <span>
            {block.text}
            {' '}
            {block.sourceIds.map((id) => sources.get(id)).filter(Boolean).map((source) => (
              source?.url
                ? <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                : <span key={source?.id}>{source?.title}</span>
            ))}
          </span>
        </aside>
      );
  }
}
