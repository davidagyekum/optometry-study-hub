// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SingleBestAnswerRenderer } from '@/components/assessment/renderers/SingleBestAnswerRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('SingleBestAnswerRenderer', () => {
  it('uses native radios in stored order and emits draft and clear actions without feedback', () => {
    const question = questionByFormat('single_best_answer');
    const onDraftChange = vi.fn();
    const onClear = vi.fn();
    const order = question.options.map((option) => option.id).reverse();
    render(
      <SingleBestAnswerRenderer
        onClear={onClear}
        onDraftChange={onDraftChange}
        presentationOrder={order}
        question={question}
      />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(question.options.length);
    expect(screen.getAllByText(/.+/)[0]).toBeDefined();
    fireEvent.click(screen.getByLabelText(question.options.at(-1)?.text ?? ''));
    expect(onDraftChange).toHaveBeenCalledWith({
      format: 'single_best_answer',
      optionId: question.options.at(-1)?.id,
    });
    const rationale = question.options[0].rationale;
    if (rationale) {
      expect(screen.queryByText(rationale)).not.toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Clear answer' }));
    expect(onClear).not.toHaveBeenCalled();
  });
});
