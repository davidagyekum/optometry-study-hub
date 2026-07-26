import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function ExtendedMatchingRenderer({
  question,
  presentationOrder,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'extended_matching'>) {
  const answers = draft?.answers ?? response?.answers ?? {};
  const order = presentationOrder ?? question.options.map((option) => option.id);
  const options = new Map(question.options.map((option) => [option.id, option]));
  const selectedValues = new Set(Object.values(answers));

  return (
    <fieldset className="assessment-fieldset" disabled={disabled} aria-describedby={descriptionId}>
      <legend className="sr-only">{question.stem}</legend>
      <div className="option-bank" aria-label="Shared option bank">
        <h3>Shared option bank</h3>
        <ol>
          {order.map((optionId) => {
            const option = options.get(optionId);
            return option ? <li key={option.id}>{option.text}</li> : null;
          })}
        </ol>
      </div>
      <div className="matching-list">
        {question.stems.map((stem) => {
          const selectId = `${question.id}-${stem.id}`;
          return (
            <div className="matching-row" key={stem.id}>
              <label htmlFor={selectId}>{stem.text}</label>
              <select
                id={selectId}
                onChange={(event) => {
                  const next = { ...answers };
                  if (event.target.value) next[stem.id] = event.target.value;
                  else delete next[stem.id];
                  onDraftChange({ format: 'extended_matching', answers: next });
                }}
                value={answers[stem.id] ?? ''}
              >
                <option value="">Choose an answer</option>
                {order.map((optionId) => {
                  const option = options.get(optionId);
                  if (!option) return null;
                  const usedElsewhere = !question.reuseOptions
                    && selectedValues.has(option.id)
                    && answers[stem.id] !== option.id;
                  return (
                    <option disabled={usedElsewhere} key={option.id} value={option.id}>
                      {option.text}
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
        disabled={Object.keys(answers).length === 0 || disabled}
        onClick={onClear}
        type="button"
      >
        Clear answer
      </button>
    </fieldset>
  );
}
