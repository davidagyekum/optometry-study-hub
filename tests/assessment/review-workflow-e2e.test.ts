import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousPilotBank } from '@/content/question-bank/opt376/aqueous-vitreous/pilotSubset';
import { reviewBankHash } from '@/lib/assessment/review/campaignManifest';
import { analyzeReviewCampaign } from '@/lib/assessment/review/reviewAnalysis';
import {
  createEvidenceBundle,
  validateReviewDecisions,
} from '@/lib/assessment/review/reviewDecisions';
import { mergeReviewerPacks } from '@/lib/assessment/review/mergeSubmissions';
import { completeDecisionFixture } from './reviewDecisionFixtures';
import {
  reviewTestContext,
  reviewerCsv,
} from './reviewTestFixtures';

describe('review campaign end-to-end workflow', () => {
  it('creates, merges, analyzes, hashes, and verifies synthetic evidence without changing the bank', () => {
    const before = structuredClone(aqueousVitreousCandidateBank);
    const manifest = completeDecisionFixture().manifest;
    const merged = mergeReviewerPacks({
      manifest,
      bank: reviewTestContext.bank,
      packs: ['reviewer-a', 'reviewer-b', 'reviewer-c'].map((reviewerId) => ({
        name: `${reviewerId}.csv`,
        csv: reviewerCsv(reviewerId, { manifest, rating: '5' }),
      })),
    });
    expect(merged.issues).toEqual([]);
    const analysis = analyzeReviewCampaign({
      manifest,
      merged: merged.merged!,
      policy: reviewTestContext.policy,
    });
    expect(analysis.summary.readyForHumanDecision).toBe(80);
    const bundle = createEvidenceBundle({
      manifest,
      merged: merged.merged!,
      resolutions: [],
      policy: reviewTestContext.policy,
    });
    const fixture = completeDecisionFixture();
    expect(bundle.hash).toBe(fixture.bundle.hash);
    expect(
      validateReviewDecisions({
        value: [fixture.baseDecision],
        bundle,
        manifest,
        context: reviewTestContext,
      }).issues,
    ).toEqual([]);
    expect(aqueousVitreousCandidateBank).toEqual(before);
    expect(aqueousVitreousCandidateBank.questions.every((question) => question.reviewStatus === 'draft')).toBe(true);
    expect(aqueousVitreousCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')).toBe(true);
  });

  it('changes deterministic evidence hashes for every review-relevant evidence family', () => {
    const baseBankHash = reviewBankHash(
      reviewTestContext.bank,
      reviewTestContext.blueprint,
      reviewTestContext.policy,
    );
    const questionChanged = {
      ...reviewTestContext.bank,
      questions: reviewTestContext.bank.questions.map((question, index) =>
        index === 0 ? { ...question, stem: `${question.stem} changed` } : question,
      ),
    };
    const objectiveChanged = {
      ...reviewTestContext.bank,
      objectives: reviewTestContext.bank.objectives.map((objective, index) =>
        index === 0
          ? { ...objective, statement: `${objective.statement} changed` }
          : objective,
      ),
    };
    const sourceChanged = {
      ...reviewTestContext.bank,
      sources: reviewTestContext.bank.sources.map((source, index) =>
        index === 0 ? { ...source, title: `${source.title} changed` } : source,
      ),
    };
    expect(reviewBankHash(questionChanged, reviewTestContext.blueprint, reviewTestContext.policy)).not.toBe(baseBankHash);
    expect(reviewBankHash(objectiveChanged, reviewTestContext.blueprint, reviewTestContext.policy)).not.toBe(baseBankHash);
    expect(reviewBankHash(sourceChanged, reviewTestContext.blueprint, reviewTestContext.policy)).not.toBe(baseBankHash);
    expect(
      reviewBankHash(reviewTestContext.bank, reviewTestContext.blueprint, {
        ...reviewTestContext.policy,
        version: 2,
      }),
    ).not.toBe(baseBankHash);
  });
});

describe('current repository invariants remain outside review tooling', () => {
  it('preserves course, module, section, legacy-question, candidate, objective, and pilot counts', () => {
    expect(courses).toHaveLength(5);
    expect(modules).toHaveLength(8);
    expect(modules.reduce((sum, module) => sum + module.sections.length, 0)).toBe(39);
    expect(modules.every((module) => module.facts.length === 50)).toBe(true);
    expect(modules.reduce((sum, module) => sum + module.facts.length, 0)).toBe(400);
    expect(aqueousVitreousCandidateBank.questions).toHaveLength(80);
    expect(aqueousVitreousCandidateBank.questions.length - aqueousVitreousPilotBank.questions.length).toBe(71);
    expect(aqueousVitreousPilotBank.questions).toHaveLength(9);
    expect(aqueousVitreousCandidateBank.objectives).toHaveLength(13);
  });

  it('keeps every current question and objective draft with no reviewer metadata', () => {
    expect(aqueousVitreousCandidateBank.questions.every((question) => question.reviewStatus === 'draft' && !question.reviewer)).toBe(true);
    expect(aqueousVitreousCandidateBank.objectives.every((objective) => objective.reviewStatus === 'draft')).toBe(true);
  });

  it('keeps the pilot disabled and campaign modules outside browser application imports', () => {
    expect(readFileSync('.env.example', 'utf8')).toContain(
      'NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false',
    );
    const browserSources = [
      readFileSync('app/StudyApp.tsx', 'utf8'),
      readFileSync('components/assessment/pilot/AssessmentPilotRouter.tsx', 'utf8'),
      readFileSync('content/question-bank/opt376/aqueous-vitreous/pilotSubset.ts', 'utf8'),
    ].join('\n');
    expect(browserSources).not.toMatch(/campaignManifest|reviewAnalysis|reviewDecisions|reviewerPack|mergeSubmissions/);
    expect(browserSources).not.toContain("from './bank'");
  });

  it('declares all PR 8 commands without adding real-review commands to npm run check', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(manifest.scripts).toMatchObject({
      'questions:review-campaign': 'tsx scripts/create-review-campaign.ts',
      'questions:review-merge': 'tsx scripts/merge-question-reviews.ts',
      'questions:review-readiness': 'tsx scripts/report-review-readiness.ts',
      'questions:review-verify': 'tsx scripts/verify-review-decision.ts',
      'questions:review-snapshot': 'tsx scripts/export-question-bank-snapshot.ts',
    });
    expect(manifest.scripts.check).not.toMatch(/review-(campaign|merge|readiness|verify|snapshot)/);
  });
});
