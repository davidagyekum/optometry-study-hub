import { describe, expect, it } from 'vitest';
import { isAssessmentPilotEnabled } from '@/lib/assessment/pilot/config';

describe('assessment pilot feature flag', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['false', false],
    ['TRUE', false],
    ['1', false],
    ['yes', false],
    ['true', true],
  ])('maps %j to %s', (value, expected) => {
    expect(isAssessmentPilotEnabled(value)).toBe(expected);
  });
});
