// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenResponseRenderer } from '@/components/assessment/renderers/OpenResponseRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('OpenResponseRenderer', () => {
  it('uses a labelled textarea, persists raw drafts, and keeps rubric feedback hidden', () => {
    const question = questionByFormat('open_response');
    const onDraftChange = vi.fn();
    render(
      <OpenResponseRenderer
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        question={question}
      />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Your response' });
    fireEvent.change(textarea, { target: { value: 'Reasoned draft response.' } });
    expect(onDraftChange).toHaveBeenCalledWith({
      format: question.format,
      text: 'Reasoned draft response.',
    });
    expect(screen.getByText(/not automatically scored/i)).toBeInTheDocument();
    if (question.sampleAnswer) {
      expect(screen.queryByText(question.sampleAnswer)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(question.rubric[0])).not.toBeInTheDocument();
  });
});
