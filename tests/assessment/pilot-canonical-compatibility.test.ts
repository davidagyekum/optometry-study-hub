import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aqueousVitreousPilotBank } from '@/content/question-bank/opt376/aqueous-vitreous/pilotSubset';
import { AQUEOUS_PILOT_QUESTION_IDS } from '@/lib/assessment/pilot/blueprint';
import { lintQuestionBank } from '@/lib/assessment/lintQuestionBank';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
function relativeImportGraph(entry: string): string[] {
  const seen = new Set<string>();
  const visit = (file: string): void => {
    if (seen.has(file)) return; seen.add(file);
    const source = readFileSync(file, 'utf8'); const imports = source.matchAll(/from\s+['"](\.[^'"]+)['"]/g);
    for (const match of imports) {
      const base = resolve(dirname(file), match[1]); const dependency = [`${base}.ts`, resolve(base, 'index.ts')].find(existsSync);
      if (dependency) visit(dependency);
    }
  };
  visit(resolve(entry));
  return [...seen].map((file) => relative(process.cwd(), file).replaceAll('\\', '/')).sort();
}
const hashes: Record<string, string> = {
  'aqueous-flow-sba-001': 'fd062b040d1f52b25797007ba5e0c2abbbacb98d4c8903c0c988ea566fd8b0f4',
  'aqueous-production-mr-001': '778fe8252688ff8e131932b2c6e16c56552688ae08ddea12f74863e50ff42658',
  'aqueous-flow-ordering-001': '035f80ce118906ec2ef28891dd3145cbfef06e8c9d8f21ce7f5e89d8ee02d99c',
  'aqueous-flow-matching-001': '979a6dd62d8ae914616a3ae791342bbde5e9f8df706b2edaa9c2b6ec9d3760de',
  'aqueous-iop-extended-matching-001': '0bd008ecef504adbdf2c386ffcc53acfa05302bfc49ba6833f4d99257c74360c',
  'aqueous-flow-hotspot-001': '5630fd5c07ef3cc6aee2600b0002b15636642cb33789a8e217053b3ac03bccc8',
  'aqueous-chambers-label-001': '9e3ad1d763c431322ab537273c8b5f716ca6c4d8e879c28f4ee5cd36f951f6b1',
  'aqueous-iop-short-answer-001': '710510d2a2473130ddbcc8b9248e42a6ae92237f232d9564ce390747cbbdfff3',
  'vitreous-clinical-open-response-001': '17b6154fc7775e4385a9b3508fa94d37840f59b3e2bfdc9ba573c3b14bccabe6',
};
describe('derived engineering pilot compatibility', () => {
  it('preserves exact order, versions, and semantic hashes', () => { expect(aqueousVitreousPilotBank.questions.map((q) => q.id)).toEqual(AQUEOUS_PILOT_QUESTION_IDS); expect(aqueousVitreousPilotBank.questions.map((q) => q.version)).toEqual(Array(9).fill(1)); expect(Object.fromEntries(aqueousVitreousPilotBank.questions.map((q) => [q.id, createHash('sha256').update(JSON.stringify(q)).digest('hex')]))).toEqual(hashes); });
  it('has zero validation errors and warnings', () => { expect(validateQuestionBank(aqueousVitreousPilotBank).diagnostics).toEqual([]); expect(lintQuestionBank(aqueousVitreousPilotBank)).toEqual([]); });
  it('includes only referenced objectives and sources', () => { const objectives = new Set(aqueousVitreousPilotBank.questions.map((q) => q.objectiveId)); expect(aqueousVitreousPilotBank.objectives.every((objective) => objectives.has(objective.id))).toBe(true); const sourceIds = new Set([...aqueousVitreousPilotBank.questions.flatMap((q) => q.sources.map((source) => source.id)), ...aqueousVitreousPilotBank.objectives.flatMap((objective) => objective.sourceIds)]); expect(aqueousVitreousPilotBank.sources.map((source) => source.id).sort()).toEqual([...sourceIds].sort()); });
  it('does not import the assembled 36-question bank or hidden candidate modules', () => {
    const graph = relativeImportGraph('content/question-bank/opt376/aqueous-vitreous/pilotSubset.ts');
    expect(graph).not.toContain('content/question-bank/opt376/aqueous-vitreous/bank.ts');
    expect(graph.filter((file) => file.includes('/questions/'))).toEqual(['content/question-bank/opt376/aqueous-vitreous/questions/preservedPilot.ts']);
  });
});
