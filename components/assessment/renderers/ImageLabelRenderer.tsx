import Image from 'next/image';
import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function ImageLabelRenderer({
  question,
  presentationOrder,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'image_label'>) {
  const matches = draft?.matches ?? response?.matches ?? {};
  const order = presentationOrder ?? question.labels.map((label) => label.id);
  const labels = new Map(question.labels.map((label) => [label.id, label]));
  const selectedValues = new Set(Object.values(matches));

  return (
    <fieldset className="assessment-fieldset" disabled={disabled} aria-describedby={descriptionId}>
      <legend className="sr-only">{question.stem}</legend>
      <p className="assessment-instruction">
        Match each numbered marker using the selects below. Dragging is not required.
      </p>
      <div
        className="assessment-image-stage label-stage"
        style={{ aspectRatio: `${question.image.width} / ${question.image.height}` }}
      >
        <Image
          alt={question.image.alt}
          fill
          sizes="(max-width: 740px) 92vw, 720px"
          src={question.image.src}
          unoptimized
        />
        {question.targets.map((target, index) => (
          <span
            aria-hidden="true"
            className="image-label-marker"
            key={target.id}
            style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }}
          >
            {index + 1}
          </span>
        ))}
      </div>
      <div className="matching-list image-label-controls">
        {question.targets.map((target, index) => {
          const selectId = `${question.id}-${target.id}`;
          return (
            <div className="matching-row" key={target.id}>
              <label htmlFor={selectId}>
                Marker {index + 1}: {target.label}
              </label>
              <select
                id={selectId}
                onChange={(event) => {
                  const next = { ...matches };
                  if (event.target.value) next[target.id] = event.target.value;
                  else delete next[target.id];
                  onDraftChange({ format: 'image_label', matches: next });
                }}
                value={matches[target.id] ?? ''}
              >
                <option value="">Choose a label</option>
                {order.map((labelId) => {
                  const label = labels.get(labelId);
                  if (!label) return null;
                  const usedElsewhere = selectedValues.has(label.id)
                    && matches[target.id] !== label.id;
                  return (
                    <option disabled={usedElsewhere} key={label.id} value={label.id}>
                      {label.text}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>
      {validationMessage ? <p className="assessment-validation">{validationMessage}</p> : null}
      <button
        className="text-button"
        disabled={Object.keys(matches).length === 0 || disabled}
        onClick={onClear}
        type="button"
      >
        Clear answer
      </button>
    </fieldset>
  );
}
