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
  ])('keeps the learner boundary visible in %s', (_label, view) => {
    render(view);
    expect(screen.getByText('Curated study practice')).toBeInTheDocument();
    expect(screen.getByText('Internally verified and slide-aligned.')).toBeInTheDocument();
    expect(screen.getByText('Not lecturer-approved examination items.')).toBeInTheDocument();
    expect(screen.getByText('Stored only on this device.')).toBeInTheDocument();
  });
});
