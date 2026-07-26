// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageLabelRenderer } from '@/components/assessment/renderers/ImageLabelRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('ImageLabelRenderer', () => {
  it('associates markers with selects, persists partial labels, and prevents label reuse', () => {
    const question = questionByFormat('image_label');
    const onDraftChange = vi.fn();
    render(
      <ImageLabelRenderer
        draft={{
          format: question.format,
          matches: { [question.targets[0].id]: question.labels[0].id },
        }}
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        presentationOrder={question.labels.map((label) => label.id)}
        question={question}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toHaveAccessibleName(/Marker 1/);
    expect(selects[1].querySelector(`option[value="${question.labels[0].id}"]`)).toBeDisabled();
    fireEvent.change(selects[1], { target: { value: question.labels[1].id } });
    expect(onDraftChange).toHaveBeenCalledWith({
      format: question.format,
      matches: {
        [question.targets[0].id]: question.labels[0].id,
        [question.targets[1].id]: question.labels[1].id,
      },
    });
    expect(screen.queryByText(/correct label/i)).not.toBeInTheDocument();
  });
});
