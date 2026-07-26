import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

function selectionInstruction(minimum?: number, maximum?: number): string {
  if (minimum !== undefined && maximum === minimum) return `Select exactly ${minimum}`;
  if (minimum !== undefined && maximum !== undefined) {
    return `Select between ${minimum} and ${maximum}`;
  }
  return 'Select all that apply';
}

export function MultipleResponseRenderer({
  question,
  presentationOrder,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'multiple_response'>) {
  const selected = draft?.optionIds ?? response?.optionIds ?? [];
  const selectedSet = new Set(selected);
  const order = presentationOrder ?? question.options.map((option) => option.id);
  const options = new Map(question.options.map((option) => [option.id, option]));
  const atMaximum = question.maximumSelections !== undefined
    && selected.length >= question.maximumSelections;
  const countId = `${question.id}-selection-count`;

  return (
    <fieldset
      className="assessment-fieldset"
      disabled={disabled}
      aria-describedby={[descriptionId, countId].filter(Boolean).join(' ')}
    >
      <legend className="sr-only">{question.stem}</legend>
      <p className="assessment-instruction">
        {selectionInstruction(question.minimumSelections, question.maximumSelections)}
      </p>
      <p aria-live="polite" className="assessment-count" id={countId}>
        {selected.length} selected
      </p>
      <div className="assessment-options">
        {order.map((optionId) => {
          const option = options.get(optionId);
          if (!option) return null;
          const checked = selectedSet.has(option.id);
          const inputId = `${question.id}-${option.id}`;
          return (
            <label className="assessment-choice checkbox" htmlFor={inputId} key={option.id}>
              <input
                checked={checked}
                disabled={disabled || (atMaximum && !checked)}
                id={inputId}
                onChange={() => onDraftChange({
                  format: 'multiple_response',
                  optionIds: checked
                    ? selected.filter((id) => id !== option.id)
                    : [...selected, option.id],
                })}
                type="checkbox"
              />
              <span>{option.text}</span>
            </label>
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
