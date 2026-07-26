import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function OpenResponseRenderer({
  question,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'open_response'>) {
  const text = draft?.text ?? response?.text ?? '';
  const inputId = `${question.id}-answer`;
  const guidanceId = `${question.id}-manual-guidance`;

  return (
    <fieldset
      className="assessment-fieldset"
      disabled={disabled}
      aria-describedby={[descriptionId, guidanceId].filter(Boolean).join(' ')}
    >
      <legend className="sr-only">{question.stem}</legend>
      <label className="text-response-label" htmlFor={inputId}>Your response</label>
      <textarea
        className="assessment-textarea"
        id={inputId}
        onChange={(event) => onDraftChange({
          format: 'open_response',
          text: event.target.value,
        })}
        rows={7}
        value={text}
      />
      <p className="assessment-guidance" id={guidanceId}>
        This response is not automatically scored and will be marked as requiring manual review.
      </p>
      {validationMessage ? <p className="assessment-validation">{validationMessage}</p> : null}
      <button
        className="text-button"
        disabled={text.length === 0 || disabled}
        onClick={onClear}
        type="button"
      >
        Clear answer
      </button>
    </fieldset>
  );
}
