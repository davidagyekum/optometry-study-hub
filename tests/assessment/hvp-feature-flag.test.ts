import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isHvpCuratedPracticeEnabled } from '@/lib/assessment/hvp/config';
import { parseClientRoute } from '@/lib/navigation/clientRoute';

describe('HVP curated-practice exposure boundary', () => {
  it('requires the exact string true', () => {
    expect(isHvpCuratedPracticeEnabled(undefined)).toBe(false);
    expect(isHvpCuratedPracticeEnabled('false')).toBe(false);
    expect(isHvpCuratedPracticeEnabled('TRUE')).toBe(false);
    expect(isHvpCuratedPracticeEnabled(' true ')).toBe(false);
    expect(isHvpCuratedPracticeEnabled('true')).toBe(true);
  });

  it('keeps both controlled-assessment features false by default', () => {
    const env = readFileSync('.env.example', 'utf8');
    expect(env).toContain('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false');
    expect(env).toContain('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false');
  });

  it('recognizes the dedicated practice route', () => {
    expect(parseClientRoute('/practice/human-visual-perception-curated')).toEqual({
      view: 'practice',
      moduleId: 'human-visual-perception-curated',
    });
  });

  it('keeps the canonical bank behind the lazy HVP boundary', () => {
    const app = readFileSync('app/StudyApp.tsx', 'utf8');
    const study = readFileSync('components/study/StudyView.tsx', 'utf8');
    expect(app).not.toContain(
      "from '@/content/question-bank/opt374/human-visual-perception",
    );
    expect(study).not.toContain(
      "from '@/content/question-bank/opt374/human-visual-perception",
    );
    expect(app).toContain("import('@/components/assessment/hvp/HvpPracticeRouter')");
  });
});
