import Image from 'next/image';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import type { PersistedResponse } from '@/lib/storage/schemas';

function optionText(
  items: readonly { id: string; text: string }[],
  id: string | undefined,
): string {
  return items.find((item) => item.id === id)?.text ?? 'No response';
}

export function ResponseSummary({
  question,
  response,
}: {
  question: AssessmentQuestion;
  response?: PersistedResponse;
}) {
  switch (question.format) {
    case 'single_best_answer':
      return (
        <div className="response-comparison">
          <p><strong>Your response</strong>{optionText(
            question.options,
            response?.format === question.format ? response.optionId : undefined,
          )}</p>
          <p><strong>Expected response</strong>{optionText(question.options, question.correctOptionId)}</p>
          <ul>
            {question.options
              .filter((option) => (
                option.id === question.correctOptionId
                || option.id === (response?.format === question.format ? response.optionId : '')
              ))
              .map((option) => <li key={option.id}><b>{option.text}:</b> {option.rationale}</li>)}
          </ul>
        </div>
      );
    case 'multiple_response':
      {
        const selected = response?.format === question.format ? response.optionIds : [];
        return (
          <div className="response-comparison">
            <p><strong>Your responses</strong>{selected.length
              ? selected.map((id) => optionText(question.options, id)).join('; ')
              : 'No response'}</p>
            <p><strong>Expected responses</strong>{question.correctOptionIds
              .map((id) => optionText(question.options, id)).join('; ')}</p>
            <ul>
              {question.options.map((option) => {
                const selectedOption = selected.includes(option.id);
                const correctOption = question.correctOptionIds.includes(option.id);
                if (!selectedOption && !correctOption) return null;
                return (
                  <li key={option.id}>
                    <b>{option.text}</b> — {selectedOption ? 'selected' : 'omitted'};
                    {' '}{correctOption ? 'expected' : 'extra'}. {option.rationale}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
    case 'ordering':
      {
        const learner = response?.format === question.format ? response.itemIds : [];
        const items = new Map(question.items.map((item) => [item.id, item]));
        return (
          <div className="response-comparison">
            <ol>{learner.map((id, index) => (
              <li key={id}>
                {items.get(id)?.text} — {question.correctOrder[index] === id
                  ? 'Correct position'
                  : `Expected ${items.get(question.correctOrder[index])?.text}`}
              </li>
            ))}</ol>
            {!learner.length ? <p>No response</p> : null}
            <p><strong>Expected order</strong>{question.correctOrder
              .map((id) => items.get(id)?.text).join(' → ')}</p>
          </div>
        );
      }
    case 'matching':
      {
        const learner = response?.format === question.format ? response.matches : {};
        return (
          <div className="response-rows">
            {question.prompts.map((prompt) => {
              const actual = learner[prompt.id];
              const expected = question.correctMatches[prompt.id];
              return (
                <p key={prompt.id}>
                  <strong>{prompt.text}</strong>
                  Your match: {optionText(question.choices, actual)}.
                  Expected: {optionText(question.choices, expected)}.
                  {' '}{actual === expected ? 'Correct component.' : 'Incorrect component.'}
                </p>
              );
            })}
          </div>
        );
      }
    case 'extended_matching':
      {
        const learner = response?.format === question.format ? response.answers : {};
        return (
          <div className="response-rows">
            {question.stems.map((stem) => {
              const actual = learner[stem.id];
              const expected = question.correctAnswers[stem.id];
              return (
                <p key={stem.id}>
                  <strong>{stem.text}</strong>
                  Your answer: {optionText(question.options, actual)}.
                  Expected: {optionText(question.options, expected)}.
                  {' '}{actual === expected ? 'Correct component.' : 'Incorrect component.'}
                </p>
              );
            })}
          </div>
        );
      }
    case 'image_hotspot':
      {
        const selected = response?.format === question.format ? response.regionIds : [];
        return (
          <div className="response-image-review">
            <Image
              alt={question.image.alt}
              height={question.image.height}
              src={question.image.src}
              width={question.image.width}
            />
            <p><strong>Selected regions</strong>{selected.length
              ? selected.map((id) => question.regions.find((region) => region.id === id)?.label).join(', ')
              : 'No response'}</p>
            <p><strong>Expected regions</strong>{question.correctRegionIds
              .map((id) => question.regions.find((region) => region.id === id)?.label).join(', ')}</p>
          </div>
        );
      }
    case 'image_label':
      {
        const learner = response?.format === question.format ? response.matches : {};
        return (
          <div className="response-image-review">
            <Image
              alt={question.image.alt}
              height={question.image.height}
              src={question.image.src}
              width={question.image.width}
            />
            <div className="response-rows">
              {question.targets.map((target) => {
                const actual = learner[target.id];
                const expected = question.correctLabels[target.id];
                return (
                  <p key={target.id}>
                    <strong>{target.label}</strong>
                    Your label: {optionText(question.labels, actual)}.
                    Expected: {optionText(question.labels, expected)}.
                    {' '}{actual === expected ? 'Correct component.' : 'Incorrect component.'}
                  </p>
                );
              })}
            </div>
          </div>
        );
      }
    case 'short_answer':
      return (
        <div className="response-comparison">
          <p><strong>Your response</strong>{response?.format === question.format
            ? response.text
            : 'No response'}</p>
          <p><strong>Accepted response</strong>{question.acceptedAnswers[0]}</p>
        </div>
      );
    case 'open_response':
      return (
        <div className="response-comparison">
          <p><strong>Your response</strong>{response?.format === question.format
            ? response.text
            : 'No response'}</p>
          <p><strong>Sample answer</strong>{question.sampleAnswer}</p>
          <div>
            <strong>Rubric for manual review</strong>
            <ul>{question.rubric.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
          </div>
          <p>No automatic mark was assigned.</p>
        </div>
      );
  }
}
