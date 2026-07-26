import type { RendererProps } from '@/components/assessment/renderers/rendererTypes';

export function MatchingRenderer({
  question,
  presentationOrder,
  draft,
  response,
  disabled = false,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: RendererProps<'matching'>) {
  const matches = draft?.matches ?? response?.matches ?? {};
  const order = presentationOrder ?? question.choices.map((choice) => choice.id);
  const choices = new Map(question.choices.map((choice) => [choice.id, choice]));
  const selectedValues = new Set(Object.values(matches));

  return (
    <fieldset className="assessment-fieldset" disabled={disabled} aria-describedby={descriptionId}>
      <legend className="sr-only">{question.stem}</legend>
      <div className="matching-list">
        {question.prompts.map((prompt) => {
          const selectId = `${question.id}-${prompt.id}`;
          return (
            <div className="matching-row" key={prompt.id}>
              <label htmlFor={selectId}>{prompt.text}</label>
              <select
                id={selectId}
                onChange={(event) => {
                  const next = { ...matches };
                  if (event.target.value) next[prompt.id] = event.target.value;
                  else delete next[prompt.id];
                  onDraftChange({ format: 'matching', matches: next });
                }}
                value={matches[prompt.id] ?? ''}
              >
                <option value="">Choose an answer</option>
                {order.map((choiceId) => {
                  const choice = choices.get(choiceId);
                  if (!choice) return null;
                  const usedElsewhere = !question.reuseChoices
                    && selectedValues.has(choice.id)
                    && matches[prompt.id] !== choice.id;
                  return (
                    <option disabled={usedElsewhere} key={choice.id} value={choice.id}>
                      {choice.text}
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
