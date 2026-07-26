// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShortAnswerRenderer } from '@/components/assessment/renderers/ShortAnswerRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('ShortAnswerRenderer', () => {
  it('restores raw text and emits punctuation and symbols without grading them', () => {
    const question = questionByFormat('short_answer');
    const onDraftChange = vi.fn();
    render(
      <ShortAnswerRenderer
        draft={{ format: question.format, text: '15°?' }}
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        question={question}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Your answer' });
    expect(input).toHaveValue('15°?');
    fireEvent.change(input, { target: { value: 'Na+?!' } });
    expect(onDraftChange).toHaveBeenCalledWith({ format: question.format, text: 'Na+?!' });
    expect(screen.queryByText(question.acceptedAnswers[0])).not.toBeInTheDocument();
  });
});
