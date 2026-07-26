// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ResponseSummary } from '@/components/assessment/review/ResponseSummary';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

function differentId(ids: string[], expected: string): string {
  const id = ids.find((candidate) => candidate !== expected);
  if (!id) throw new Error('Fixture needs an incorrect option');
  return id;
}

describe('instructional response review', () => {
  it('shows learner and expected rationales for matching and extended matching', () => {
    const matching = questionByFormat('matching');
    const prompt = matching.prompts[0];
    const expected = matching.correctMatches[prompt.id];
    const actual = differentId(matching.choices.map((choice) => choice.id), expected);
    const { container, rerender } = render(
      <ResponseSummary
        question={matching}
        response={{ format: 'matching', matches: { [prompt.id]: actual } }}
      />,
    );
    const firstMatchingRow = container.querySelector('.component-review-row');
    if (!firstMatchingRow) throw new Error('Matching review row missing');
    expect(within(firstMatchingRow as HTMLElement).getByText(/Learner-choice rationale:/).closest('p'))
      .toHaveTextContent(matching.choices.find((choice) => choice.id === actual)?.rationale ?? '');
    expect(within(firstMatchingRow as HTMLElement).getByText(/Expected-choice rationale:/).closest('p'))
      .toHaveTextContent(matching.choices.find((choice) => choice.id === expected)?.rationale ?? '');
    expect(within(firstMatchingRow as HTMLElement).getByText('Incorrect component'))
      .toBeInTheDocument();

    const extended = questionByFormat('extended_matching');
    const stem = extended.stems[0];
    const expectedExtended = extended.correctAnswers[stem.id];
    const actualExtended = differentId(
      extended.options.map((option) => option.id),
      expectedExtended,
    );
    rerender(
      <ResponseSummary
        question={extended}
        response={{
          format: 'extended_matching',
          answers: { [stem.id]: actualExtended },
        }}
      />,
    );
    const firstExtendedRow = container.querySelector('.component-review-row');
    if (!firstExtendedRow) throw new Error('Extended review row missing');
    expect(within(firstExtendedRow as HTMLElement).getByText(/Learner-choice rationale:/).closest('p'))
      .toHaveTextContent(extended.options.find((option) => option.id === actualExtended)?.rationale ?? '');
    expect(within(firstExtendedRow as HTMLElement).getByText(/Expected-choice rationale:/).closest('p'))
      .toHaveTextContent(extended.options.find((option) => option.id === expectedExtended)?.rationale ?? '');
  });

  it('shows image-label component status and both relevant rationales', () => {
    const question = questionByFormat('image_label');
    const target = question.targets[0];
    const expected = question.correctLabels[target.id];
    const actual = differentId(question.labels.map((label) => label.id), expected);
    const { container } = render(
      <ResponseSummary
        question={question}
        response={{ format: 'image_label', matches: { [target.id]: actual } }}
      />,
    );
    const firstLabelRow = container.querySelector('.component-review-row');
    if (!firstLabelRow) throw new Error('Image-label review row missing');
    expect(within(firstLabelRow as HTMLElement).getByText('Incorrect component')).toBeInTheDocument();
    expect(within(firstLabelRow as HTMLElement).getByText(/Learner-label rationale:/).closest('p'))
      .toHaveTextContent(question.labels.find((label) => label.id === actual)?.rationale ?? '');
    expect(within(firstLabelRow as HTMLElement).getByText(/Expected-label rationale:/).closest('p'))
      .toHaveTextContent(question.labels.find((label) => label.id === expected)?.rationale ?? '');
  });

  it('overlays selected and expected hotspot regions with a visible non-colour legend', () => {
    const question = questionByFormat('image_hotspot');
    const selected = question.regions.find(
      (region) => !question.correctRegionIds.includes(region.id),
    );
    if (!selected) throw new Error('Fixture needs an incorrect hotspot');
    const { container } = render(
      <ResponseSummary
        question={question}
        response={{ format: 'image_hotspot', regionIds: [selected.id] }}
      />,
    );
    expect(container.querySelector('.review-hotspot-region.selected')).toBeInTheDocument();
    expect(container.querySelector('.review-hotspot-region.expected')).toBeInTheDocument();
    const legend = screen.getByRole('list', { name: 'Diagram overlay legend' });
    expect(legend).toHaveTextContent('Selected');
    expect(legend).toHaveTextContent('Expected');
    expect(legend).toHaveTextContent('Selected and expected');
    expect(screen.getByText('Selected regions')).toBeInTheDocument();
    expect(screen.getByText('Expected regions')).toBeInTheDocument();
  });

  it('uses the same unoptimized image behavior for active and review diagrams', () => {
    const active = readFileSync(resolve('components/assessment/renderers/ImageHotspotRenderer.tsx'), 'utf8');
    const review = readFileSync(resolve('components/assessment/review/ResponseSummary.tsx'), 'utf8');
    expect(active).toContain('unoptimized');
    expect(review.match(/unoptimized/g)?.length).toBeGreaterThanOrEqual(2);
  });
});