import { describe, expect, it } from 'vitest';
import { RELEASE_BASELINES, RELEASE_BUDGETS } from '@/lib/release/budgets';

describe('release bundle budgets', () => {
  it('provides approximately ten percent measured headroom', () => {
    for (const profile of Object.keys(RELEASE_BASELINES) as Array<
      keyof typeof RELEASE_BASELINES
    >) {
      const baseline = RELEASE_BASELINES[profile];
      const budget = RELEASE_BUDGETS[profile];
      for (const [key, limit] of Object.entries(budget)) {
        const measured = baseline[key as keyof typeof budget];
        expect(limit).toBeGreaterThanOrEqual(measured);
        expect(limit).toBeLessThanOrEqual(Math.ceil(measured * 1.101));
      }
    }
  });

  it('keeps build duration observational rather than a misleading hard budget', () => {
    expect(RELEASE_BUDGETS.disabled).not.toHaveProperty('buildDurationMs');
    expect(RELEASE_BASELINES.disabled.buildDurationMs).toBeGreaterThan(0);
  });
});
