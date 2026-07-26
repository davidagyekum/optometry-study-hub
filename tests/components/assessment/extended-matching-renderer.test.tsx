// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExtendedMatchingRenderer } from '@/components/assessment/renderers/ExtendedMatchingRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('ExtendedMatchingRenderer', () => {
  it('renders the shared bank and emits partial answers without exposing correctness', () => {
    const question = questionByFormat('extended_matching');
    const onDraftChange = vi.fn();
    render(
      <ExtendedMatchingRenderer
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        presentationOrder={question.options.map((option) => option.id).reverse()}
        question={question}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Shared option bank' })).toBeInTheDocument();
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: question.options[0].id } });
    expect(onDraftChange).toHaveBeenCalledWith({
      format: question.format,
      answers: { [question.stems[0].id]: question.options[0].id },
    });
    expect(screen.queryByText(question.explanation)).not.toBeInTheDocument();
  });
});
