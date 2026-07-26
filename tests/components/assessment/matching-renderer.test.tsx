// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MatchingRenderer } from '@/components/assessment/renderers/MatchingRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('MatchingRenderer', () => {
  it('restores partial mappings, uses placeholders, stable order, and prevents reuse', () => {
    const question = questionByFormat('matching');
    const first = question.prompts[0];
    const choice = question.choices[0];
    const onDraftChange = vi.fn();
    render(
      <MatchingRenderer
        draft={{ format: question.format, matches: { [first.id]: choice.id } }}
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        presentationOrder={question.choices.map((item) => item.id).reverse()}
        question={question}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toHaveValue(choice.id);
    expect(screen.getAllByRole('option', { name: 'Choose an answer' })).toHaveLength(question.prompts.length);
    expect(selects[1].querySelector(`option[value="${choice.id}"]`)).toBeDisabled();
    fireEvent.change(selects[1], { target: { value: question.choices[1].id } });
    expect(onDraftChange).toHaveBeenCalledWith({
      format: question.format,
      matches: { [first.id]: choice.id, [question.prompts[1].id]: question.choices[1].id },
    });
  });
});
