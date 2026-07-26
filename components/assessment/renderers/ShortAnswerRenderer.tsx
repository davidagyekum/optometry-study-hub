import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function ShortAnswerRenderer({
  question,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'short_answer'>) {
  const text = draft?.text ?? response?.text ?? '';
  const inputId = `${question.id}-answer`;
  const guidanceId = `${question.id}-guidance`;

  return (
    <fieldset
      className="assessment-fieldset"
      disabled={disabled}
      aria-describedby={[descriptionId, guidanceId].filter(Boolean).join(' ')}
    >
      <legend className="sr-only">{question.stem}</legend>
      <label className="text-response-label" htmlFor={inputId}>Your answer</label>
      <input
        className="assessment-text-input"
        id={inputId}
        onChange={(event) => onDraftChange({
          format: 'short_answer',
          text: event.target.value,
        })}
        type="text"
        value={text}
      />
      <p className="assessment-guidance" id={guidanceId}>
        Spelling must match an accepted answer after the question&apos;s declared normalization.
        Meaningful symbols such as + and ° are preserved.
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
