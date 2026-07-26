// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MultipleResponseRenderer } from '@/components/assessment/renderers/MultipleResponseRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('MultipleResponseRenderer', () => {
  it('restores partial drafts, exposes limits, and keeps selected options removable at max', () => {
    const question = questionByFormat('multiple_response');
    const selected = question.options.slice(0, 3).map((option) => option.id);
    const onDraftChange = vi.fn();
    render(
      <MultipleResponseRenderer
        draft={{ format: question.format, optionIds: selected }}
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        presentationOrder={question.options.map((option) => option.id)}
        question={question}
      />,
    );
    expect(screen.getByText('Select exactly 3')).toBeInTheDocument();
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    const checked = screen.getAllByRole('checkbox', { checked: true });
    expect(checked).toHaveLength(3);
    expect(checked[0]).not.toBeDisabled();
    expect(screen.getAllByRole('checkbox', { checked: false })[0]).toBeDisabled();
    fireEvent.click(checked[0]);
    expect(onDraftChange).toHaveBeenCalledWith({
      format: question.format,
      optionIds: selected.slice(1),
    });
    const rationale = question.options[0].rationale;
    if (rationale) {
      expect(screen.queryByText(rationale)).not.toBeInTheDocument();
    }
  });
});
