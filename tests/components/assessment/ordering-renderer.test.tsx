// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderingRenderer } from '@/components/assessment/renderers/OrderingRenderer';
import { questionByFormat } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('OrderingRenderer', () => {
  it('supports button reordering, boundaries, confirmation, and live announcements', () => {
    const question = questionByFormat('ordering');
    const order = question.items.map((item) => item.id);
    const onDraftChange = vi.fn();
    render(
      <OrderingRenderer
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        presentationOrder={order}
        question={question}
      />,
    );
    expect(screen.getByRole('button', { name: `Move ${question.items[0].text} up` })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: `Move ${question.items[0].text} down` }));
    expect(onDraftChange).toHaveBeenCalledWith({
      format: question.format,
      itemIds: [order[1], order[0], ...order.slice(2)],
    });
    expect(screen.getByText(/moved to position 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm this order' }));
    expect(onDraftChange).toHaveBeenLastCalledWith({ format: question.format, itemIds: order });
  });
});
