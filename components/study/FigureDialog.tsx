'use client';

import { type RefObject, useCallback, useEffect, useRef } from 'react';
import type { Figure } from '@/lib/legacy/types';

export function FigureDialog({
  figure,
  triggerRef,
  onClose,
}: {
  figure: Figure;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const closeFigure = useCallback(() => {
    onClose();
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, [onClose, triggerRef]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFigure();
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button, a[href]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeFigure]);

  return (
    <div className="figure-modal" onMouseDown={(event) => { if (event.currentTarget === event.target) closeFigure(); }}>
      <div className="figure-dialog" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="figure-dialog-title">
        <button className="figure-close" type="button" ref={closeButtonRef} onClick={closeFigure} aria-label="Close enlarged figure">
          Close <span aria-hidden="true">×</span>
        </button>
        <img src={figure.src} width={figure.width} height={figure.height} alt={figure.alt} />
        <div className="figure-dialog-caption">
          <h2 id="figure-dialog-title">{figure.caption}</h2>
          <p>
            Source: {figure.sourceUrl
              ? <a href={figure.sourceUrl} target="_blank" rel="noreferrer">{figure.credit}</a>
              : figure.credit}
          </p>
        </div>
      </div>
    </div>
  );
}
