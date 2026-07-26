import Image from 'next/image';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import type { PersistedResponse } from '@/lib/storage/schemas';

type TextOption = {
  id: string;
  text: string;
  rationale?: string;
};

function optionFor(items: readonly TextOption[], id: string | undefined) {
  return items.find((item) => item.id === id);
}

function optionText(items: readonly TextOption[], id: string | undefined): string {
  return optionFor(items, id)?.text ?? 'No response';
}

function rationaleText(
  items: readonly TextOption[],
  id: string | undefined,
): string {
  if (!id) return 'No learner choice was submitted.';
  return optionFor(items, id)?.rationale ?? 'No authored rationale is available.';
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
    case 'multiple_response': {
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
    case 'ordering': {
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
    case 'matching': {
      const learner = response?.format === question.format ? response.matches : {};
      return (
        <div className="response-rows">
          {question.prompts.map((prompt) => {
            const actual = learner[prompt.id];
            const expected = question.correctMatches[prompt.id];
            const correct = actual === expected;
            return (
              <div className="component-review-row" key={prompt.id}>
                <strong>{prompt.text}</strong>
                <p>Your match: {optionText(question.choices, actual)}.</p>
                <p>Expected: {optionText(question.choices, expected)}.</p>
                <p className={`component-status ${correct ? 'correct' : 'incorrect'}`}>
                  {correct ? 'Correct component' : 'Incorrect component'}
                </p>
                <p><b>Learner-choice rationale:</b> {rationaleText(question.choices, actual)}</p>
                {!correct ? (
                  <p><b>Expected-choice rationale:</b> {rationaleText(question.choices, expected)}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    }
    case 'extended_matching': {
      const learner = response?.format === question.format ? response.answers : {};
      return (
        <div className="response-rows">
          {question.stems.map((stem) => {
            const actual = learner[stem.id];
            const expected = question.correctAnswers[stem.id];
            const correct = actual === expected;
            return (
              <div className="component-review-row" key={stem.id}>
                <strong>{stem.text}</strong>
                <p>Your answer: {optionText(question.options, actual)}.</p>
                <p>Expected: {optionText(question.options, expected)}.</p>
                <p className={`component-status ${correct ? 'correct' : 'incorrect'}`}>
                  {correct ? 'Correct component' : 'Incorrect component'}
                </p>
                <p><b>Learner-choice rationale:</b> {rationaleText(question.options, actual)}</p>
                {!correct ? (
                  <p><b>Expected-choice rationale:</b> {rationaleText(question.options, expected)}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    }
    case 'image_hotspot': {
      const selected = response?.format === question.format ? response.regionIds : [];
      const selectedSet = new Set(selected);
      const expectedSet = new Set(question.correctRegionIds);
      return (
        <div className="response-image-review">
          <div
            className="assessment-image-stage review-hotspot-stage"
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
              const wasSelected = selectedSet.has(region.id);
              const wasExpected = expectedSet.has(region.id);
              if (!wasSelected && !wasExpected) return null;
              const status = wasSelected && wasExpected
                ? 'both'
                : wasSelected ? 'selected' : 'expected';
              const statusText = status === 'both'
                ? 'Selected and expected'
                : status === 'selected' ? 'Selected' : 'Expected';
              return (
                <span
                  className={`review-hotspot-region ${status}`}
                  key={region.id}
                  style={{
                    left: `${region.x * 100}%`,
                    top: `${region.y * 100}%`,
                    width: `${region.width * 100}%`,
                    height: `${region.height * 100}%`,
                  }}
                >
                  <b>{region.marker}</b>
                  <span>{statusText}</span>
                  <span className="sr-only">: {region.label}</span>
                </span>
              );
            })}
          </div>
          <ul className="hotspot-review-legend" aria-label="Diagram overlay legend">
            <li><span className="legend-swatch selected">S</span> Selected</li>
            <li><span className="legend-swatch expected">E</span> Expected</li>
            <li><span className="legend-swatch both">B</span> Selected and expected</li>
          </ul>
          <p><strong>Selected regions</strong>{selected.length
            ? selected.map((id) => question.regions.find((region) => region.id === id)?.label).join(', ')
            : 'No response'}</p>
          <p><strong>Expected regions</strong>{question.correctRegionIds
            .map((id) => question.regions.find((region) => region.id === id)?.label).join(', ')}</p>
        </div>
      );
    }
    case 'image_label': {
      const learner = response?.format === question.format ? response.matches : {};
      return (
        <div className="response-image-review">
          <Image
            alt={question.image.alt}
            height={question.image.height}
            src={question.image.src}
            unoptimized
            width={question.image.width}
          />
          <div className="response-rows">
            {question.targets.map((target) => {
              const actual = learner[target.id];
              const expected = question.correctLabels[target.id];
              const correct = actual === expected;
              return (
                <div className="component-review-row" key={target.id}>
                  <strong>{target.label}</strong>
                  <p>Your label: {optionText(question.labels, actual)}.</p>
                  <p>Expected: {optionText(question.labels, expected)}.</p>
                  <p className={`component-status ${correct ? 'correct' : 'incorrect'}`}>
                    {correct ? 'Correct component' : 'Incorrect component'}
                  </p>
                  <p><b>Learner-label rationale:</b> {rationaleText(question.labels, actual)}</p>
                  {!correct ? (
                    <p><b>Expected-label rationale:</b> {rationaleText(question.labels, expected)}</p>
                  ) : null}
                </div>
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
