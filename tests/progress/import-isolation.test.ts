import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ordinaryGraph = [
  'app/StudyApp.tsx',
  'components/practice/PracticeHub.tsx',
  'components/progress/ProgressHub.tsx',
  'components/progress/ModuleProgressView.tsx',
  'lib/progress/legacyAnalytics.ts',
  'lib/progress/activity.ts',
  'lib/progress/recommendations.ts',
];

describe('disabled HVP dashboard import isolation', () => {
  it('keeps the canonical bank and registry behind the lazy feature-specific panel', () => {
    ordinaryGraph.forEach((path) => {
      const source = readFileSync(path, 'utf8');
      expect(source, path).not.toMatch(/human-visual-perception\/bank|hvp\/registry|hvpAnalytics/);
    });
    const app = readFileSync('app/StudyApp.tsx', 'utf8');
    const registry = readFileSync(
      'lib/assessment/curated/experienceRegistry.ts',
      'utf8',
    );
    expect(registry).toContain('@/components/progress/HvpProgressPanel');
    expect(app).not.toContain("from '@/components/progress/HvpProgressPanel'");
  });
});
