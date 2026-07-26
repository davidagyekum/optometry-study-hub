import Image from 'next/image';
import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function ImageHotspotRenderer({
  question,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'image_hotspot'>) {
  const selected = draft?.regionIds ?? response?.regionIds ?? [];
  const selectedSet = new Set(selected);

  return (
    <fieldset className="assessment-fieldset" disabled={disabled} aria-describedby={descriptionId}>
      <legend className="sr-only">{question.stem}</legend>
      <p className="assessment-instruction">
        Select one or more labelled regions. Correct regions are shown only after submission.
      </p>
      <div
        className="assessment-image-stage"
        style={{ aspectRatio: `${question.image.width} / ${question.image.height}` }}
      >
        <Image
          alt={question.image.alt}
          fill
          sizes="(max-width: 740px) 92vw, 720px"
          src={question.image.src}
          unoptimized
        />
        {question.regions.map((region) => {
          const pressed = selectedSet.has(region.id);
          return (
            <button
              aria-label={region.label}
              aria-pressed={pressed}
              className={`hotspot-region${pressed ? ' selected' : ''}`}
              disabled={disabled}
              key={region.id}
              onClick={() => onDraftChange({
                format: 'image_hotspot',
                regionIds: pressed
                  ? selected.filter((id) => id !== region.id)
                  : [...selected, region.id],
              })}
              style={{
                left: `${region.x * 100}%`,
                top: `${region.y * 100}%`,
                width: `${region.width * 100}%`,
                height: `${region.height * 100}%`,
              }}
              type="button"
            >
              <span>{region.label}</span>
            </button>
          );
        })}
      </div>
      {validationMessage ? <p className="assessment-validation">{validationMessage}</p> : null}
      <button
        className="text-button"
        disabled={selected.length === 0 || disabled}
        onClick={onClear}
        type="button"
      >
        Clear answer
      </button>
    </fieldset>
  );
}
