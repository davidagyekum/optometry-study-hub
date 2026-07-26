import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('headless grading integration boundary', () => {
  it('keeps grading and the pilot out of the live quiz and application routes', async () => {
    const liveSources = await Promise.all([
      readFile('components/quiz/LegacyQuizView.tsx', 'utf8'),
      readFile('components/results/LegacyResultsView.tsx', 'utf8'),
      readFile('app/StudyApp.tsx', 'utf8'),
      readFile('lib/navigation/clientRoute.ts', 'utf8'),
    ]);
    liveSources.forEach((source) => {
      expect(source).not.toContain('assessment/grading');
      expect(source).not.toContain('question-bank/pilot');
      expect(source).not.toContain('gradingPolicy');
    });
  });

  it('does not update questionHistory anywhere in the grading layer', async () => {
    const files = (await readdir('lib/assessment/grading'))
      .filter((file) => file.endsWith('.ts'));
    const sources = await Promise.all(
      files.map((file) => readFile(`lib/assessment/grading/${file}`, 'utf8')),
    );
    expect(sources.join('\n')).not.toContain('questionHistory');
  });
});
