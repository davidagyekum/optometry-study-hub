import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { syntheticReviewers } from './reviewTestFixtures';

describe('review campaign command idempotency', () => {
  it('never rewrites a completed reviewer pack on exact campaign recreation', async () => {
    const repositoryRoot = process.cwd();
    const sandbox = await mkdtemp(join(tmpdir(), 'opt376-review-campaign-'));
    try {
      const reviewerPath = join(sandbox, 'reviewers.json');
      await writeFile(
        reviewerPath,
        `${JSON.stringify(syntheticReviewers, null, 2)}\n`,
        'utf8',
      );
      const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');
      const script = resolve(repositoryRoot, 'scripts/create-review-campaign.ts');
      const args = [
        tsxCli,
        script,
        '--campaign-id',
        'idempotent-synthetic-review',
        '--reviewers',
        reviewerPath,
        '--created-at',
        '2000-01-01T00:00:00.000Z',
      ];
      const environment = {
        ...process.env,
        TSX_TSCONFIG_PATH: resolve(repositoryRoot, 'tsconfig.json'),
      };
      execFileSync(process.execPath, args, {
        cwd: sandbox,
        env: environment,
        encoding: 'utf8',
      });

      const packPath = join(
        sandbox,
        'tmp',
        'question-review',
        'idempotent-synthetic-review',
        'reviewer-packs',
        'reviewer-a.csv',
      );
      const initial = await readFile(packPath, 'utf8');
      const completed = initial.replace(
        ',reviewer-a,,\n',
        ',reviewer-a,5,"Synthetic completed review.\nMultiline comment."\n',
      );
      expect(completed).not.toBe(initial);
      await writeFile(packPath, completed, 'utf8');
      const expectedBytes = await readFile(packPath);

      const output = execFileSync(process.execPath, args, {
        cwd: sandbox,
        env: environment,
        encoding: 'utf8',
      });
      const actualBytes = await readFile(packPath);

      expect(output).toContain('no artifact was rewritten');
      expect(actualBytes.equals(expectedBytes)).toBe(true);
    } finally {
      await rm(sandbox, { recursive: true, force: true });
    }
  });
});
