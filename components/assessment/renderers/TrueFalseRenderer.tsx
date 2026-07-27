import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  AssessmentDraftResponse,
  PersistedResponse,
} from '@/lib/storage/schemas';
type TrueFalseQuestion = Extract<AssessmentQuestion, { format: 'true_false' }>;
type TrueFalseDraft = Extract<AssessmentDraftResponse, { format: 'true_false' }>;
type TrueFalseResponse = Extract<PersistedResponse, { format: 'true_false' }>;

export function TrueFalseRenderer({
  question,
  draft,
  response,
  disabled,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: {
  question: TrueFalseQuestion;
  presentationOrder?: string[];
  draft?: TrueFalseDraft;
  response?: TrueFalseResponse;
  disabled?: boolean;
  descriptionId?: string;
  validationMessage?: string;
  onDraftChange: (draft: TrueFalseDraft) => void;
  onClear: () => void;
}) {
  const selected = draft?.answer ?? response?.answer;
  return (
    <fieldset
      aria-describedby={descriptionId}
      className="assessment-options"
      disabled={disabled}
    >
      <legend className="sr-only">{question.stem}</legend>
      {[true, false].map((answer) => (
        <label className="assessment-option" key={String(answer)}>
          <input
            checked={selected === answer}
            name={`true-false-${question.id}`}
            onChange={() => onDraftChange({ format: 'true_false', answer })}
            type="radio"
          />
          <span>{answer ? 'True' : 'False'}</span>
        </label>
      ))}
      <button
        className="text-button"
        disabled={disabled || selected === undefined}
        onClick={onClear}
        type="button"
      >
        Clear answer
      </button>
      {validationMessage ? <p className="assessment-validation">{validationMessage}</p> : null}
    </fieldset>
  );
}
