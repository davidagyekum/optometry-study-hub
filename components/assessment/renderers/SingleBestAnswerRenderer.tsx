import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function SingleBestAnswerRenderer({
  question,
  presentationOrder,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'single_best_answer'>) {
  const selected = draft?.optionId ?? response?.optionId ?? '';
  const order = presentationOrder ?? question.options.map((option) => option.id);
  const options = new Map(question.options.map((option) => [option.id, option]));

  return (
    <fieldset className="assessment-fieldset" disabled={disabled} aria-describedby={descriptionId}>
      <legend className="sr-only">{question.stem}</legend>
      <div className="assessment-options">
        {order.map((optionId) => {
          const option = options.get(optionId);
          if (!option) return null;
          const inputId = `${question.id}-${option.id}`;
          return (
            <label className="assessment-choice" htmlFor={inputId} key={option.id}>
              <input
                checked={selected === option.id}
                id={inputId}
                name={question.id}
                onChange={() => onDraftChange({
                  format: 'single_best_answer',
                  optionId: option.id,
                })}
                type="radio"
              />
              <span>{option.text}</span>
            </label>
          );
        })}
      </div>
      {validationMessage ? <p className="assessment-validation">{validationMessage}</p> : null}
      <button className="text-button" disabled={!selected || disabled} onClick={onClear} type="button">
        Clear answer
      </button>
    </fieldset>
  );
}
