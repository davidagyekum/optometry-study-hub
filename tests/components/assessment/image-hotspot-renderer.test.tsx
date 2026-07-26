// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageHotspotRenderer } from '@/components/assessment/renderers/ImageHotspotRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('ImageHotspotRenderer', () => {
  it('uses positioned keyboard buttons with aria-pressed and hides correct-region feedback', () => {
    const question = questionByFormat('image_hotspot');
    const onDraftChange = vi.fn();
    render(
      <ImageHotspotRenderer
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        question={question}
      />,
    );
    const region = question.regions[0];
    const button = screen.getByRole('button', { name: region.label });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveStyle({ left: `${region.x * 100}%`, top: `${region.y * 100}%` });
    fireEvent.click(button);
    expect(onDraftChange).toHaveBeenCalledWith({
      format: question.format,
      regionIds: [region.id],
    });
    expect(screen.queryByText(/expected regions/i)).not.toBeInTheDocument();
  });
});
