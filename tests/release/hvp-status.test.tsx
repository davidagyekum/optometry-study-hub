// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HvpReleaseStatus } from '@/components/assessment/hvp/HvpReleaseStatus';
import { HvpPracticeWarning } from '@/components/assessment/hvp/HvpPracticeWarning';

describe('HVP release-status messaging', () => {
  afterEach(cleanup);

  it.each([
    ['shared status', <HvpReleaseStatus key="status" />],
    ['controlled warning', <HvpPracticeWarning key="warning" />],
  ])('shows compact neutral course status in %s', (_label, view) => {
    render(view);
    expect(screen.getByText('Course-aligned practice')).toBeInTheDocument();
    expect(screen.getByText('Built from the supplied course materials.')).toBeInTheDocument();
    expect(screen.getByText('Progress is stored on this device.')).toBeInTheDocument();
    expect(screen.queryByText(/lecturer-approved/i)).not.toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveClass('curated-status');
  });
});
