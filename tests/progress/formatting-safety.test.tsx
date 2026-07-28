// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  displayDate,
  displayPercent,
  ProgressBar,
} from '@/components/progress/ProgressPrimitives';
import { safeLegacyPercentage } from '@/lib/progress/legacyAnalytics';

describe('progress formatting safety', () => {
  it('returns an em dash for missing and invalid dates without throwing', () => {
    expect(displayDate()).toBe('—');
    expect(displayDate('not-a-date')).toBe('—');
    expect(displayDate('2026-07-01T08:00:00.000Z')).not.toBe('—');
  });

  it('does not expose non-finite percentages', () => {
    expect(displayPercent()).toBe('—');
    expect(displayPercent(Number.NaN)).toBe('—');
    expect(displayPercent(Number.POSITIVE_INFINITY)).toBe('—');
    expect(displayPercent(74.6)).toBe('75%');
  });

  it('requires finite legacy scores and a positive finite total', () => {
    expect(safeLegacyPercentage({ score: 25, total: 50 })).toBe(50);
    expect(safeLegacyPercentage({ score: Number.NaN, total: 50 })).toBeUndefined();
    expect(safeLegacyPercentage({ score: 25, total: 0 })).toBeUndefined();
    expect(safeLegacyPercentage({ score: 25, total: Number.POSITIVE_INFINITY })).toBeUndefined();
  });

  it('bounds non-finite progress-bar values to zero', () => {
    render(<ProgressBar value={Number.POSITIVE_INFINITY} label="Unsafe progress" />);
    expect(screen.getByRole('progressbar', { name: 'Unsafe progress' }))
      .toHaveAttribute('aria-valuenow', '0');
  });
});
