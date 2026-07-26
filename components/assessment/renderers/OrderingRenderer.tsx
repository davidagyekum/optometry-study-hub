import { useState } from 'react';
import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function OrderingRenderer({
  question,
  presentationOrder,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'ordering'>) {
  const initialOrder = presentationOrder ?? question.items.map((item) => item.id);
  const order = draft?.itemIds ?? response?.itemIds ?? initialOrder;
  const items = new Map(question.items.map((item) => [item.id, item]));
  const [announcement, setAnnouncement] = useState('');

  const move = (itemId: string, direction: -1 | 1) => {
    const currentIndex = order.indexOf(itemId);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
    onDraftChange({ format: 'ordering', itemIds: next });
    setAnnouncement(`${items.get(itemId)?.text ?? 'Item'} moved to position ${nextIndex + 1}.`);
  };

  return (
    <fieldset className="assessment-fieldset" disabled={disabled} aria-describedby={descriptionId}>
      <legend className="sr-only">{question.stem}</legend>
      <p className="assessment-instruction">
        Use the buttons to arrange the items. Dragging is not required.
      </p>
      <ol className="ordering-list">
        {order.map((itemId, index) => {
          const item = items.get(itemId);
          if (!item) return null;
          return (
            <li key={item.id}>
              <span className="ordering-position">{index + 1}</span>
              <span>{item.text}</span>
              <span className="ordering-controls">
                <button
                  aria-label={`Move ${item.text} up`}
                  disabled={disabled || index === 0}
                  onClick={() => move(item.id, -1)}
                  type="button"
                >
                  Move up
                </button>
                <button
                  aria-label={`Move ${item.text} down`}
                  disabled={disabled || index === order.length - 1}
                  onClick={() => move(item.id, 1)}
                  type="button"
                >
                  Move down
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="sr-only">{announcement}</p>
      {validationMessage ? <p className="assessment-validation">{validationMessage}</p> : null}
      <div className="renderer-actions">
        {!draft && !response ? (
          <button
            className="secondary"
            disabled={disabled}
            onClick={() => onDraftChange({ format: 'ordering', itemIds: [...order] })}
            type="button"
          >
            Confirm this order
          </button>
        ) : null}
        <button
          className="text-button"
          disabled={(!draft && !response) || disabled}
          onClick={onClear}
          type="button"
        >
          Clear answer
        </button>
      </div>
    </fieldset>
  );
}
