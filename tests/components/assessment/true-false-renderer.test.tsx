// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TrueFalseRenderer } from '@/components/assessment/renderers/TrueFalseRenderer';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import { questionByFormat } from '@/tests/fixtures/session-engine';

function question(): Extract<AssessmentQuestion, { format: 'true_false' }> {
  const source = questionByFormat('single_best_answer');
  const { options: _options, correctOptionId: _correctOptionId, ...base } = source;
  void _options;
  void _correctOptionId;
  return {
    ...base,
    id: 'renderer-true-false',
    familyId: 'renderer-true-false-family',
    format: 'true_false',
    stem: 'The optic disc lacks photoreceptors.',
    correctAnswer: true,
  };
}

describe('TrueFalseRenderer', () => {
  it('renders accessible True and False choices and emits a boolean draft', async () => {
    const onDraftChange = vi.fn();
    render(
      <TrueFalseRenderer
        onClear={vi.fn()}
        onDraftChange={onDraftChange}
        question={question()}
      />,
    );
    expect(screen.getByRole('radio', { name: 'True' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'False' })).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: 'False' }));
    expect(onDraftChange).toHaveBeenCalledWith({ format: 'true_false', answer: false });
  });
});
